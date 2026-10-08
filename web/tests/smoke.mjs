import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import {
  addRowAfter,
  auditEngine,
  cellRole,
  classifyLabelTier,
  deleteRow,
  loadDocx,
  normalizedSequence,
  recordById,
  renumberRecord,
  writeCellLabel,
  writeCellValue,
} from '../src/docx-engine.js';
import { buildMappingPlan, canonicalSlotId, extractSourceFacts, normalizeSlotLabel } from '../src/msds-handoff.js';
import { renderEditorTable, renderParagraph, sourceRunStyle } from '../src/render-utils.js';
import {
  runSmartMatching,
  applyMatchResultToEditor,
  decoupleSection9Condition,
  groupPrecautionaryStatements,
  isMissingOrUnmeasured,
  decomposeRunsToFact,
  safeColonSplit,
  stripNumberingPrefix,
  sanitizeTypographyAndSymbols,
  isPureMissingValue,
  isSubstantiveNegativeFinding,
  detectSlotConflicts,
  resolveSlotBySemantics,
} from '../src/smart-matching.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const templateDir = path.join(webRoot, 'public', 'templates');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const numericValueRole = cellRole({
  col: 0,
  text: '123',
  paragraphs: [{ numberingText: '', runs: [{ text: '123', bold: false, textNodes: [] }] }],
});
assert.equal(numericValueRole.sequence, false, '首列纯数字值不得误判成序号');
const automaticNumberRole = cellRole({
  col: 1,
  text: '123',
  paragraphs: [{ numberingText: '1.', runs: [{ text: '123', bold: false, textNodes: [] }] }],
});
assert.equal(automaticNumberRole.sequence, true, 'Word 自动编号仍须按序号保护');

for (const name of ['正式模板_MSDS_CN_冠志(1).docx', '正式模板_MSDS_EN_冠志(1).docx']) {
  const source = await fs.readFile(path.join(templateDir, name));
  const originalHash = sha256(source);
  const packageFile = await JSZip.loadAsync(source);
  assert.ok(packageFile.file('word/document.xml'), `${name} 缺少 word/document.xml`);
  const documentXml = await packageFile.file('word/document.xml').async('string');
  assert.match(documentXml, /<w:tbl[ >]/, `${name} 没有可识别的 Word 表格`);

  const outputZip = new JSZip();
  for (const entry of Object.values(packageFile.files)) {
    if (!entry.dir) outputZip.file(entry.name, await entry.async('uint8array'));
  }
  const roundTrip = await outputZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const roundTripZip = await JSZip.loadAsync(roundTrip);
  const roundTripXml = await roundTripZip.file('word/document.xml').async('string');
  assert.equal(roundTripXml, documentXml, `${name} 的 document.xml 往返内容发生变化`);
  assert.equal(sha256(source), originalHash, `${name} 模板校验值改变`);

  const engine = await loadDocx(source, name);
  engine.records.filter((item) => item.kind === 'table').forEach((item) => renumberRecord(item));
  assert.equal(auditEngine(engine).length, 0, `${name} 模板工作副本重编号后仍有审计问题`);
  const record = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 1);
  const editableCell = record?.rows.flatMap((row) => row.cells).find((cell) => cell.editable && cell.valueNodes.length);
  assert.ok(editableCell, `${name} 没有识别到 Section 1 可编辑值单元格`);
  writeCellValue(editableCell, 'SMOKE_VALUE', engine.roleStyles.value);

  // Verify Template Editor Excel UI fidelity and inline editor markers
  const editorTableHtml = renderEditorTable(record, { roleStyles: engine.roleStyles });
  assert.ok(!editorTableHtml.includes('row-gutter'), `${name} 模板编辑器表格严禁包含 row-gutter 行序号列`);
  assert.ok(!editorTableHtml.includes('row-actions'), `${name} 模板编辑器表格严禁包含侵入式 row-actions 列`);
  assert.ok(!editorTableHtml.includes('editor-cell-foot'), `${name} 模板编辑器单元格严禁包含 editor-cell-foot 脚标`);
  assert.ok(!editorTableHtml.includes('inspect-cell'), `${name} 模板编辑器单元格严禁包含 inspect-cell 按钮`);
  assert.ok(editorTableHtml.includes('editor-excel-table'), `${name} 模板编辑器表格应具备 editor-excel-table 类名`);
  assert.ok(editorTableHtml.includes('excel-cell-editor'), `${name} 模板编辑器应包含内联 excel-cell-editor 元素`);
  assert.ok(editorTableHtml.includes('contenteditable="plaintext-only"'), `${name} 模板编辑器可编辑单元格应具备 contenteditable="plaintext-only"`);
  assert.ok(editorTableHtml.includes('row-floating-actions'), `${name} 模板编辑器数据行末尾应包含悬浮操作胶囊`);

  // Verify Row 0 protection in Editor Table
  const editorDom = new JSDOM(editorTableHtml);
  const row0 = editorDom.window.document.querySelector('tr.title-row');
  assert.ok(row0, `${name} 模板编辑器缺少 Row 0 标题行`);
  assert.equal(row0.querySelector('.row-floating-actions'), null, `${name} Row 0 标题行严禁包含悬浮操作按钮`);
  assert.equal(row0.querySelector('[contenteditable]'), null, `${name} Row 0 标题行严禁包含可编辑元素`);

  const addedRecord = addRowAfter(engine, record, 1);
  assert.equal(addedRecord.rows.length, record.rows.length + 1, `${name} 新增行未保留`);
  assert.throws(() => deleteRow(engine, addedRecord, 0), /章节标题行/, `${name} 标题行保护失效`);
  const sec9 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 9);
  const labelCell = sec9?.rows.flatMap((row) => row.cells).find((cell) => /^9\.3/.test(cell.text));
  assert.ok(labelCell?.labelNodes?.length, `${name} 没有找到 Section 9 标签运行区`);
  writeCellLabel(labelCell, 'pH值（原液）：', true, engine.roleStyles.label);
  assert.match(labelCell.text, /^9\.3\s{2}pH值（原液）：/, `${name} Section 9 标签未保持等宽前缀`);

  assert.equal(engine.roleStyles.label.sizeHalfPoints, '24', `${name} 标签角色字号未规范为小四 24 halfPoints`);
  assert.equal(engine.roleStyles.label.bold, true, `${name} 标签角色未保持加粗`);


  const sec1 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 1);
  const parentLabelRow = sec1.rows.find((row) => /^1\.1\b/.test(row.cells[0]?.text?.trim() || ''));
  const childLabelRow = sec1.rows.find((row) => /^(?:中文名称|Chemical category)[：:]?$/i.test(row.cells[0]?.text?.trim() || ''));
  assert.ok(parentLabelRow, `${name} 缺少 Section 1 父级标签行 (1.1)`);
  assert.ok(childLabelRow, `${name} 缺少 Section 1 子级标签行`);
  assert.equal(classifyLabelTier(parentLabelRow.cells[0], parentLabelRow, parentLabelRow.cells[0].paragraphs[0], sec1), 'parent', `${name} Section 1 父级标签识别异常`);
  assert.equal(classifyLabelTier(childLabelRow.cells[0], childLabelRow, childLabelRow.cells[0].paragraphs[0], sec1), 'child', `${name} Section 1 子级标签识别异常`);
  assert.ok(normalizedSequence(parentLabelRow.cells[0].paragraphs[0], parentLabelRow.cells[0]), `${name} Section 1 序号未成功提取`);

  const sec3 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 3);
  const sec3Row1 = sec3?.rows.find((row) => row.cells[0]?.text?.includes('3.1'));
  assert.ok(sec3Row1, `${name} Section 3 缺少 3.1 序号行`);
  assert.ok(sec3Row1.cells[0].labelText.includes('3.1'), `${name} Section 3 3.1 序号未保留在 labelText 中`);

  const sec7 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 7);
  const sec7Row1 = sec7?.rows.find((row) => row.cells[0]?.text?.includes('7.1'));
  assert.ok(sec7Row1, `${name} Section 7 缺少 7.1 序号行`);
  assert.ok(sec7Row1.cells[0].labelText.includes('7.1'), `${name} Section 7 7.1 序号未保留在 labelText 中`);

  const sec8 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 8);
  const sec8RecRow = sec8.rows.find((row) => /^(?:建议|Recommendation)[：:]?$/i.test(row.cells[0]?.text?.trim() || ''));
  assert.ok(sec8RecRow, `${name} 缺少 Section 8 建议行`);
  assert.equal(classifyLabelTier(sec8RecRow.cells[0], sec8RecRow, sec8RecRow.cells[0].paragraphs[0], sec8), 'parent', `${name} Section 8 建议特例未归属为父级标签`);

  const sec15 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 15);
  const sec15NoteRow = sec15?.rows.find((row) => /其它的规定|Other provisions/i.test(row.cells[0]?.text || ''));
  assert.ok(sec15NoteRow, `${name} Section 15 缺少其它的规定行`);
  assert.equal(classifyLabelTier(sec15NoteRow.cells[0], sec15NoteRow, sec15NoteRow.cells[0].paragraphs[0], sec15), 'parent', `${name} Section 15 说明性标签未分类为 parent (顶格左对齐)`);
  assert.equal(normalizedSequence(sec15NoteRow.cells[0].paragraphs[0], sec15NoteRow.cells[0]), null, `${name} Section 15 说明性标签不应分配序号`);

  const headerFooterRecs = engine.records.filter((item) => item.part && /^word\/(?:header|footer)/.test(item.part));
  assert.ok(headerFooterRecs.length > 0, `${name} 未读取到页眉或页脚记录`);

  // Assert Row 0 is strictly protected
  for (const rec of engine.records.filter((r) => r.kind === 'table')) {
    const r0c0 = rec.rows[0]?.cells[0];
    if (r0c0) {
      assert.equal(normalizedSequence(r0c0.paragraphs[0], r0c0), null, `${name} Section ${rec.sectionNumber} Row 0 不得提取或剥离序号`);
      assert.equal(classifyLabelTier(r0c0, rec.rows[0], r0c0.paragraphs[0], rec), 'title', `${name} Section ${rec.sectionNumber} Row 0 分类必须为 title`);
    }
  }

  // Table Border Integrity Assertions
  const sec11Rec = engine.records.find((r) => r.sectionNumber === 11);
  assert.ok(sec11Rec, `${name} 缺少 Section 11`);
  const sec11Html = renderEditorTable(sec11Rec);
  assert.ok(!sec11Html.includes('border:0'), `${name} Section 11 单元格严禁包含 inline border:0 清除样式`);
  assert.ok(sec11Html.includes('rowspan="4"'), `${name} Section 11 急性毒性单元格必须保留 rowspan="4"`);
  assert.ok(sec11Html.includes('rowspan="3"'), `${name} Section 11 生殖毒性单元格必须保留 rowspan="3"`);

  const sec2Rec = engine.records.find((r) => r.sectionNumber === 2);
  assert.ok(sec2Rec, `${name} 缺少 Section 2`);
  const sec2Html = renderEditorTable(sec2Rec);
  assert.ok(!sec2Html.includes('border:0'), `${name} Section 2 单元格严禁包含 inline border:0 清除样式`);
  assert.ok(sec2Html.includes('rowspan="5"'), `${name} Section 2 健康危害单元格必须保留 rowspan="5"`);

  const sec3Rec = engine.records.find((r) => r.sectionNumber === 3);
  assert.ok(sec3Rec, `${name} 缺少 Section 3`);
  const sec3Html = renderEditorTable(sec3Rec);
  assert.ok(!sec3Html.includes('border:0'), `${name} Section 3 单元格严禁包含 inline border:0 清除样式`);

  const atomicSection11 = engine.records.find((item) => item.kind === 'table' && item.sectionNumber === 11);
  const atomicRow11_2 = atomicSection11?.rows.find((row) => row.cells.some((cell) => /^\s*11\.2\b/.test(cell.text)));
  const atomicValueCell = atomicRow11_2?.cells.find((cell) => cell.valueNodes.length > 1 && cell.paragraphs.length > 1);
  assert.ok(atomicValueCell, `${name} Section 11.2 needs a multi-paragraph editable value cell for atomic replacement coverage`);
  writeCellValue(atomicValueCell, '123', engine.roleStyles.value);
  assert.equal(atomicValueCell.valueText, '123', `${name} Section 11.2 replacement must remain one logical value`);
  assert.equal(atomicValueCell.paragraphs.length, 1, `${name} Section 11.2 replacement must collapse obsolete source paragraphs`);
  assert.equal(atomicValueCell.valueNodes.length, 1, `${name} Section 11.2 replacement must use one destination text node`);

  const exported = await engine.exportArrayBuffer();
  const exportedZip = await JSZip.loadAsync(exported);
  const exportedXml = await exportedZip.file('word/document.xml').async('string');
  const exportedDom = new DOMParser().parseFromString(exportedXml, 'application/xml');
  const wordNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const findRun = (node) => {
    let current = node?.parentNode || null;
    while (current && current.localName !== 'r') current = current.parentNode;
    return current;
  };
  const property = (run, name) => run?.getElementsByTagNameNS(wordNs, name)?.[0] || null;
  const wordValue = (node) => node?.getAttributeNS(wordNs, 'val') || null;
  const valueTextNode = Array.from(exportedDom.getElementsByTagNameNS(wordNs, 't'))
    .find((node) => node.textContent?.includes('SMOKE_VALUE'));
  const valueRun = findRun(valueTextNode);
  assert.ok(valueRun, `${name} 导出的编辑值没有 Word run`);
  assert.equal(property(valueRun, 'rFonts')?.getAttributeNS(wordNs, 'eastAsia'), '宋体', `${name} 编辑值未显式设置 East Asian 宋体`);
  assert.equal(wordValue(property(valueRun, 'sz')), '24', `${name} 编辑值未设置小四字号`);
  assert.equal(wordValue(property(valueRun, 'szCs')), '24', `${name} 编辑值未设置复杂脚本小四字号`);
  assert.equal(wordValue(property(valueRun, 'b')), '0', `${name} 编辑值必须保持非加粗`);
  assert.equal(wordValue(property(valueRun, 'bCs')), '0', `${name} 编辑值复杂脚本必须保持非加粗`);
  if (name.includes('_CN_')) {
    assert.equal(property(valueRun, 'rFonts')?.getAttributeNS(wordNs, 'hAnsi'), 'Arial', `${name} 编辑中文值不应覆盖模板原有西文字体`);
  }

  const reopened = await loadDocx(exported, name);
  const reopenedRecord = recordById(reopened, record.id);
  assert.ok(reopenedRecord?.searchText.includes('SMOKE_VALUE'), `${name} 导出后未保留编辑值`);
  const reopenedSection11 = reopened.records.find((item) => item.kind === 'table' && item.sectionNumber === 11);
  const reopenedRow11_2 = reopenedSection11?.rows.find((row) => row.cells.some((cell) => /^\s*11\.2\b/.test(cell.text)));
  const reopenedAtomicCell = reopenedRow11_2?.cells.find((cell) => cell.text === '123');
  assert.ok(reopenedAtomicCell, `${name} Section 11.2 DOCX 导出/重开后应保持连续值 123`);
  assert.equal(reopenedAtomicCell.paragraphs.length, 1, `${name} Section 11.2 DOCX 不应残留已清空的原始段落`);
  assert.equal(reopenedAtomicCell.editable, true, `${name} 纯数字内容位于值列时不得被误判为受保护序号`);
  writeCellValue(reopenedAtomicCell, '1\n23', reopened.roleStyles.value);
  assert.equal(reopenedAtomicCell.valueText, '1\n23', `${name} 编辑器应保留用户显式输入的同格换行`);
  assert.equal(reopenedAtomicCell.paragraphs.length, 1, `${name} 用户换行不得拆成多个 Word 段落`);
  const explicitBreakOutput = await reopened.exportArrayBuffer();
  const explicitBreakEngine = await loadDocx(explicitBreakOutput, name);
  const explicitBreakCell = explicitBreakEngine.records.find((item) => item.kind === 'table' && item.sectionNumber === 11)
    ?.rows.flatMap((row) => row.cells).find((cell) => cell.valueText === '1\n23');
  assert.ok(explicitBreakCell, `${name} 导出/重开后应保留用户输入的同格换行`);
  assert.equal(explicitBreakCell.paragraphs.length, 1, `${name} 导出 DOCX 应使用一个段落内的软换行`);
  assert.equal(explicitBreakCell.paragraphs[0].node.getElementsByTagNameNS(wordNs, 'br').length, 1, `${name} 显式换行应序列化为一个 w:br`);
  const reopenedSec9 = reopened.records.find((item) => item.kind === 'table' && item.sectionNumber === 9);
  const reopenedLabel = reopenedSec9?.rows.flatMap((row) => row.cells).find((cell) => cell.labelText.includes('pH值（原液）：'));
  const reopenedLabelRuns = [...new Set((reopenedLabel?.labelNodes || []).map(findRun).filter(Boolean))];
  const editedLabelRun = reopenedLabelRuns.find((run) => run.textContent?.includes('pH值'));
  assert.ok(editedLabelRun, `${name} 导出的编辑标签没有 Word run`);
  assert.equal(property(editedLabelRun, 'rFonts')?.getAttributeNS(wordNs, 'eastAsia'), '宋体', `${name} 编辑标签未显式设置 East Asian 宋体`);
  assert.equal(wordValue(property(editedLabelRun, 'sz')), '24', `${name} 编辑标签未设置小四字号`);
  assert.equal(wordValue(property(editedLabelRun, 'szCs')), '24', `${name} 编辑标签未设置复杂脚本小四字号`);
  assert.equal(wordValue(property(editedLabelRun, 'b')), '1', `${name} 编辑标签必须保持加粗`);
  assert.equal(wordValue(property(editedLabelRun, 'bCs')), '1', `${name} 编辑标签复杂脚本必须保持加粗`);
  const sequenceRun = reopenedLabelRuns.find((run) => /^\s*9\.3\s*$/.test(run.textContent || ''));
  assert.ok(sequenceRun, `${name} 编辑 Section 9 标签必须保留独立序号 run`);
  assert.equal(wordValue(property(sequenceRun, 'sz')), '21', `${name} 编辑标签不应放大序号字号`);
}

// Verify semantic source-to-template planning without mutating either engine.
assert.equal(normalizeSlotLabel('11.3 主要粘膜刺激性：'), '主要粘膜刺激性', '标签规范化应剥离序号和标点');
assert.equal(canonicalSlotId(11, '11.3 主要粘膜刺激性：'), 'eye_irritation', 'Section 11 粘膜刺激映射必须使用注册的眼睛刺激槽位');
assert.equal(canonicalSlotId(9, '9.3 pH值（1%水溶液）：'), 'ph', 'Section 9 映射应保留属性身份并忽略测定条件做槽位匹配');
assert.equal(canonicalSlotId(1, '1.1 产品名称：'), 'product_model', 'Section 1 产品名称源值应识别为产品型号元数据');

const handoffTemplateBytes = await fs.readFile(path.join(templateDir, '正式模板_MSDS_CN_冠志(1).docx'));
const handoffSource = await loadDocx(handoffTemplateBytes, 'handoff-fixture.docx');
const handoffTarget = await loadDocx(handoffTemplateBytes, 'handoff-target.docx');
const handoffSourceHash = sha256(handoffSource.originalBytes);
const handoffPlan = buildMappingPlan(handoffSource, handoffTarget);
assert.ok(handoffPlan.facts.length > 0, 'handoff 应从 16 节识别模型提取源事实');
assert.equal(sha256(handoffSource.originalBytes), handoffSourceHash, '生成映射计划不得改动源 DOCX 字节');
assert.equal(handoffPlan.status, 'needs-review', 'handoff 计划在明确审核前不得直接写入模板');

const section1TargetRecord = handoffTarget.records.find((item) => item.kind === 'table' && item.sectionNumber === 1);
const duplicatedTarget = {
  ...handoffTarget,
  records: [...handoffTarget.records, { ...section1TargetRecord, id: 'duplicate-section1-table', sectionNumber: 1 }],
};
const ambiguousPlan = buildMappingPlan(handoffSource, duplicatedTarget);
assert.ok(ambiguousPlan.mappings.some((item) => item.status === 'ambiguous'), '同一语义命中多个模板槽位时必须阻断而非按行号猜测');

// Exercise the randomly selected real source when present; it must keep its two aligned component rows and Section 11 alias evidence.
const pa4816Path = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-2 水性羟基丙烯酸乳液 PA/PA-4816 msds_CN 国彩.docx';
try {
  const sourceBytes = await fs.readFile(pa4816Path);
  const sourceEngine = await loadDocx(sourceBytes, 'PA-4816 msds_CN 国彩.docx');
  const sourceModel = extractSourceFacts(sourceEngine);
  assert.equal(sourceEngine.coverage.body_table_xml_count, 16, 'PA-4816 源件应识别出 16 个正文表格');
  assert.equal(sourceModel.facts.filter((fact) => fact.kind === 'component').length, 2, 'PA-4816 两个成分必须拆成两个独立事实');
  const paPlan = buildMappingPlan(sourceEngine, handoffTarget);
  assert.ok(paPlan.mappings.some((item) => item.fact.label.includes('粘膜刺激') && item.target?.labelKeys.includes('eye_irritation')), 'PA-4816 粘膜刺激结论必须保留来源并映射至眼睛刺激目标');
  assert.ok(paPlan.mappings.some((item) => String(item.fact.label).includes('产品名称') && item.disposition === 'product_identity'), 'PA-4816 型号必须保留为产品身份事实');
  assert.ok(paPlan.mappings.some((item) => String(item.fact.label).includes('氟化橡胶') && item.target?.labelKeys.includes('fkm_glove')), 'PA-4816 FKM 独立行必须匹配到 Section 8 手套材料槽位');
  assert.equal(paPlan.mappings.filter((item) => item.fact.kind === 'component').length, 2, 'PA-4816 每个组分必须各自映射到独立成分行');
  assert.equal(sha256(sourceEngine.originalBytes), sha256(sourceBytes), '读取 PA-4816 不得改动源文件');

  const sourceSection6 = sourceEngine.records.find((item) => item.kind === 'table' && item.sectionNumber === 6);
  const duplicateSource = { ...sourceEngine, records: [...sourceEngine.records, { ...sourceSection6, id: 'duplicate-section6-source' }] };
  const conflictPlan = buildMappingPlan(duplicateSource, handoffTarget);
  assert.ok(conflictPlan.mappings.some((item) => item.status === 'conflict'), '重复源事实争用同一目标槽位时必须进入冲突复核');

  const unknownSourceRecord = {
    ...sourceSection6,
    id: 'unknown-label-source',
    fieldCandidates: [{ label: '未注册测试标签', value: '测试值', method: 'fixture', source: { label_cell: { row: 1, column: 0 }, value_cell: { row: 1, column: 1 } } }],
  };
  const unknownPlan = buildMappingPlan({ ...sourceEngine, records: [...sourceEngine.records, unknownSourceRecord] }, handoffTarget);
  assert.ok(unknownPlan.mappings.some((item) => item.status === 'unresolved' && item.fact.label === '未注册测试标签'), '未注册标签必须留下可见阻断项');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

// Verify CSS border rules
const cssContent = await fs.readFile(path.join(webRoot, 'src', 'styles.css'), 'utf-8');
assert.ok(
  cssContent.includes('.structured-table, .editor-excel-table, .editor-table') &&
  cssContent.includes('border-collapse: collapse !important; border: 1px solid #6f6f6f !important;'),
  'styles.css 必须包含标准的 border-collapse 和 border: 1px solid #6f6f6f 表格声明'
);
assert.ok(
  cssContent.includes('.structured-table td, .structured-table th, .editor-excel-table td, .editor-excel-table th, .editor-table td, .editor-table th { border: 1px solid #6f6f6f !important;'),
  'styles.css 必须为所有单元格声明 border: 1px solid #6f6f6f'
);
assert.ok(
  !cssContent.includes('.structured-table td + td'),
  'styles.css 必须废除脆弱的 td + td 假边框选择器'
);

// Regression checks on real MSDS source documents when present
const pu1107Path = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1107/中文版/PU-1107 msds_CN 冠志.docx';
const pu2341Path = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';

try {
  const pu1107Buf = await fs.readFile(pu1107Path);
  const pu1107Eng = await loadDocx(pu1107Buf, 'PU-1107.docx');
  const pu1107Sec1 = pu1107Eng.records.find((r) => r.sectionNumber === 1);
  assert.ok(pu1107Sec1.rows[1].cells[0].labelText.includes('1.1'), 'PU-1107 Section 1 1.1 自动编号未保留在 labelText');
  assert.equal(normalizedSequence(pu1107Sec1.rows[0].cells[0].paragraphs[0], pu1107Sec1.rows[0].cells[0]), null, 'PU-1107 Section 1 Row 0 不得提取序号');

  const pu1107Sec3 = pu1107Eng.records.find((r) => r.sectionNumber === 3);
  assert.ok(pu1107Sec3.rows[1].cells[0].labelText.includes('3.1'), 'PU-1107 Section 3 3.1 自动编号未保留在 labelText');

  const pu1107Sec7 = pu1107Eng.records.find((r) => r.sectionNumber === 7);
  assert.ok(pu1107Sec7.rows[1].cells[0].labelText.includes('7.1'), 'PU-1107 Section 7 7.1 自动编号未保留在 labelText');

  const pu1107Sec9 = pu1107Eng.records.find((r) => r.sectionNumber === 9);
  assert.ok(pu1107Sec9.rows[1].cells[0].labelText.includes('9.1'), 'PU-1107 Section 9 9.1 自动编号未保留在 labelText');
  assert.ok(pu1107Sec9.rows[3].cells[0].labelText.includes('9.3'), 'PU-1107 Section 9 9.3 自动编号未保留在 labelText');

  // PU-1107 font weight checks
  const pu1107Sec16 = pu1107Eng.records.find((r) => r.sectionNumber === 16);
  assert.ok(pu1107Sec16, 'PU-1107 缺少 Section 16');
  const pu1107Sec16Html = renderParagraph(pu1107Sec16.rows[1].cells[0].paragraphs[0], pu1107Sec16.rows[1].cells[0], pu1107Sec16, pu1107Eng.roleStyles, true, pu1107Sec16.rows[1]);
  assert.ok(pu1107Sec16Html.includes('font-weight:normal'), 'PU-1107 Section 16 免责声明必须为常规粗细');
  assert.ok(!pu1107Sec16Html.includes('font-weight:700'), 'PU-1107 Section 16 免责声明严禁加粗');

  const pu1107Sec11 = pu1107Eng.records.find((r) => r.sectionNumber === 11);
  assert.ok(pu1107Sec11, 'PU-1107 缺少 Section 11');
  const pu1107Sec11R1Html = renderParagraph(pu1107Sec11.rows[1].cells[0].paragraphs[0], pu1107Sec11.rows[1].cells[0], pu1107Sec11, pu1107Eng.roleStyles, true, pu1107Sec11.rows[1]);
  assert.ok(pu1107Sec11R1Html.includes('font-weight:normal'), 'PU-1107 Section 11 毒理学未加粗段落必须为常规粗细');
  assert.ok(!pu1107Sec11R1Html.includes('font-weight:700'), 'PU-1107 Section 11 毒理学未加粗段落严禁加粗');
  const pu1107Sec11R3Html = renderParagraph(pu1107Sec11.rows[3].cells[0].paragraphs[0], pu1107Sec11.rows[3].cells[0], pu1107Sec11, pu1107Eng.roleStyles, true, pu1107Sec11.rows[3]);
  assert.ok(pu1107Sec11R3Html.includes('font-weight:700'), 'PU-1107 Section 11 急性毒性标签必须保持加粗');

  const pu1107Sec8 = pu1107Eng.records.find((r) => r.sectionNumber === 8);
  assert.ok(pu1107Sec8, 'PU-1107 缺少 Section 8');
  const pu1107Sec8R2Html = renderParagraph(pu1107Sec8.rows[2].cells[0].paragraphs[0], pu1107Sec8.rows[2].cells[0], pu1107Sec8, pu1107Eng.roleStyles, true, pu1107Sec8.rows[2]);
  assert.ok(pu1107Sec8R2Html.includes('font-weight:normal'), 'PU-1107 Section 8 EC限值说明必须为常规粗细');
  assert.ok(!pu1107Sec8R2Html.includes('font-weight:700'), 'PU-1107 Section 8 EC限值说明严禁加粗');

  assert.ok(pu1107Sec3, 'PU-1107 缺少 Section 3');
  const pu1107Sec3R4Html = renderParagraph(pu1107Sec3.rows[4].cells[0].paragraphs[0], pu1107Sec3.rows[4].cells[0], pu1107Sec3, pu1107Eng.roleStyles, true, pu1107Sec3.rows[4]);
  assert.ok(pu1107Sec3R4Html.includes('font-weight:normal'), 'PU-1107 Section 3 化学品名称数据必须为常规粗细');
  assert.ok(!pu1107Sec3R4Html.includes('font-weight:700'), 'PU-1107 Section 3 化学品名称数据严禁加粗');

  const pu2341Buf = await fs.readFile(pu2341Path);
  const pu2341Eng = await loadDocx(pu2341Buf, 'PU-2341E.docx');
  const sec14 = pu2341Eng.records.find((r) => r.sectionNumber === 14);
  assert.ok(sec14, 'PU-2341E 缺少 Section 14');
  assert.ok(sec14.rows[2].cells[0].paragraphs.length >= 3, 'PU-2341E Section 14 row 2 未识别到多段落');
  assert.equal(sec14.rows[3].cells[0].text.trim(), '', 'PU-2341E Section 14 row 3 应为空行');
  assert.equal(normalizedSequence(sec14.rows[0].cells[0].paragraphs[0], sec14.rows[0].cells[0]), null, 'PU-2341E Section 14 Row 0 不得提取序号');

  // Font-weight fidelity regression assertions:
  // 1. Section 16 disclaimer unbolded
  const sec16 = pu2341Eng.records.find((r) => r.sectionNumber === 16);
  assert.ok(sec16, 'PU-2341E 缺少 Section 16');
  const sec16Html = renderParagraph(sec16.rows[1].cells[0].paragraphs[0], sec16.rows[1].cells[0], sec16, pu2341Eng.roleStyles, true, sec16.rows[1]);
  assert.ok(sec16Html.includes('font-weight:normal'), 'PU-2341E Section 16 免责声明必须为常规粗细 (normal)');
  assert.ok(!sec16Html.includes('font-weight:700'), 'PU-2341E Section 16 免责声明严禁非法加粗 (700)');

  // 2. Section 11 toxicological study text unbolded and spacer lines preserved
  const sec11 = pu2341Eng.records.find((r) => r.sectionNumber === 11);
  assert.ok(sec11, 'PU-2341E 缺少 Section 11');
  const sec11Html = renderParagraph(sec11.rows[1].cells[0].paragraphs[0], sec11.rows[1].cells[0], sec11, pu2341Eng.roleStyles, true, sec11.rows[1]);
  assert.ok(sec11Html.includes('font-weight:normal'), 'PU-2341E Section 11 毒理学说明正文必须为常规粗细 (normal)');
  assert.ok(!sec11Html.includes('font-weight:700'), 'PU-2341E Section 11 毒理学说明正文严禁非法加粗 (700)');

  const sec11Cell = sec11.rows[1].cells[0];
  const sec11Spacers = sec11Cell.paragraphs.filter((p) => !(p.text || p.rawText || '').trim());
  assert.equal(sec11Spacers.length, 17, 'PU-2341E Section 11 应识别到 17 处源文件空行间隔');
  const renderedSpacers = sec11Cell.paragraphs
    .map((p) => renderParagraph(p, sec11Cell, sec11, pu2341Eng.roleStyles, false, sec11.rows[1]))
    .filter((html) => html.includes('paragraph-spacer'));
  assert.equal(renderedSpacers.length, 17, 'PU-2341E Section 11 的 17 处空行必须全部渲染为 paragraph-spacer');
  assert.ok(renderedSpacers.every((html) => html.includes('min-height:1.2em') && html.includes('&nbsp;')), '所有空行占位符必须具备确定行高并填充不可折叠字符');

  // 3. Section 8 Row 2 note unbolded, glove specs unbolded, 建议 bold
  const sec8 = pu2341Eng.records.find((r) => r.sectionNumber === 8);
  assert.ok(sec8, 'PU-2341E 缺少 Section 8');
  const sec8R2Html = renderParagraph(sec8.rows[2].cells[0].paragraphs[0], sec8.rows[2].cells[0], sec8, pu2341Eng.roleStyles, true, sec8.rows[2]);
  assert.ok(sec8R2Html.includes('font-weight:normal'), 'PU-2341E Section 8 EC接触限值说明必须为常规粗细 (normal)');
  assert.ok(!sec8R2Html.includes('font-weight:700'), 'PU-2341E Section 8 EC接触限值说明严禁加粗');
  const sec8R7Html = renderParagraph(sec8.rows[7].cells[0].paragraphs[0], sec8.rows[7].cells[0], sec8, pu2341Eng.roleStyles, true, sec8.rows[7]);
  assert.ok(sec8R7Html.includes('font-weight:normal'), 'PU-2341E Section 8 手套规格数据必须为常规粗细 (normal)');
  assert.ok(!sec8R7Html.includes('font-weight:700'), 'PU-2341E Section 8 手套规格数据严禁加粗');
  const sec8R10Html = renderParagraph(sec8.rows[10].cells[0].paragraphs[0], sec8.rows[10].cells[0], sec8, pu2341Eng.roleStyles, true, sec8.rows[10]);
  assert.ok(sec8R10Html.includes('font-weight:700'), 'PU-2341E Section 8 建议标签必须保持合法加粗 (700)');

  // 4. Section 3 Row 4 ingredients data unbolded
  const sec3 = pu2341Eng.records.find((r) => r.sectionNumber === 3);
  assert.ok(sec3, 'PU-2341E 缺少 Section 3');
  const sec3R4Html = renderParagraph(sec3.rows[4].cells[0].paragraphs[0], sec3.rows[4].cells[0], sec3, pu2341Eng.roleStyles, true, sec3.rows[4]);
  assert.ok(sec3R4Html.includes('font-weight:normal'), 'PU-2341E Section 3 组分化学品名称数据必须为常规粗细 (normal)');
  assert.ok(!sec3R4Html.includes('font-weight:700'), 'PU-2341E Section 3 组分化学品名称数据严禁加粗');

  // 5. Section 2 hazard descriptions unbolded
  const sec2 = pu2341Eng.records.find((r) => r.sectionNumber === 2);
  assert.ok(sec2, 'PU-2341E 缺少 Section 2');
  const sec2R1P3 = sec2.rows[1].cells[0].paragraphs.find(p => p.text.includes('根据GHS不属于危害化学品'));
  assert.ok(sec2R1P3, 'PU-2341E Section 2 缺少根据GHS不属于危害化学品描述段落');
  const sec2R1P3Html = renderParagraph(sec2R1P3, sec2.rows[1].cells[0], sec2, pu2341Eng.roleStyles, false, sec2.rows[1]);
  assert.ok(sec2R1P3Html.includes('font-weight:normal'), 'PU-2341E Section 2 危害性说明必须为常规粗细 (normal)');
  assert.ok(!sec2R1P3Html.includes('font-weight:700'), 'PU-2341E Section 2 危害性说明严禁加粗');

  // 6. Section 1 Row 1: sequence prefix is bold, label is bold, value is normal
  const sec1 = pu2341Eng.records.find((r) => r.sectionNumber === 1);
  assert.ok(sec1, 'PU-2341E 缺少 Section 1');
  const sec1LabelHtml = renderParagraph(sec1.rows[1].cells[0].paragraphs[0], sec1.rows[1].cells[0], sec1, pu2341Eng.roleStyles, true, sec1.rows[1]);
  assert.ok(sec1LabelHtml.includes('class="sequence-run"'), 'PU-2341E Section 1 标签单元格应包含序号前缀');
  assert.ok(sec1LabelHtml.includes('font-weight:700'), 'PU-2341E Section 1 序号与标签文本必须保持加粗');
  const sec1ValHtml = renderParagraph(sec1.rows[1].cells[1].paragraphs[0], sec1.rows[1].cells[1], sec1, pu2341Eng.roleStyles, true, sec1.rows[1]);
  assert.ok(sec1ValHtml.includes('font-weight:normal'), 'PU-2341E Section 1 产品名称值文本必须为常规粗细');
  assert.ok(!sec1ValHtml.includes('font-weight:700'), 'PU-2341E Section 1 产品名称值文本严禁加粗');

  // 7. Section 15: parent tier, flush-left, no sequence prefix, bold retained for bold rows
  const sec15 = pu2341Eng.records.find((r) => r.sectionNumber === 15);
  assert.ok(sec15, 'PU-2341E 缺少 Section 15');
  const sec15R2Html = renderParagraph(sec15.rows[2].cells[0].paragraphs[0], sec15.rows[2].cells[0], sec15, pu2341Eng.roleStyles, true, sec15.rows[2]);
  assert.ok(sec15R2Html.includes('label-parent-row'), 'PU-2341E Section 15 其它的规定必须为 parent tier 顶格');
  assert.ok(sec15R2Html.includes('font-weight:700'), 'PU-2341E Section 15 其它的规定应保持源文档加粗');
  const sec15R4Html = renderParagraph(sec15.rows[4].cells[0].paragraphs[0], sec15.rows[4].cells[0], sec15, pu2341Eng.roleStyles, true, sec15.rows[4]);
  assert.ok(sec15R4Html.includes('font-weight:normal'), 'PU-2341E Section 15 法规清单条目必须为常规粗细 (normal)');
  assert.ok(!sec15R4Html.includes('font-weight:700'), 'PU-2341E Section 15 法规清单条目严禁加粗');

  // 8. Row 0 protection
  const sec1R0Html = renderParagraph(sec1.rows[0].cells[0].paragraphs[0], sec1.rows[0].cells[0], sec1, pu2341Eng.roleStyles, true, sec1.rows[0]);
  assert.ok(sec1R0Html.includes('label-title-row'), 'Row 0 必须具备 label-title-row 类');
  assert.ok(sec1R0Html.includes('font-weight:700'), 'Row 0 必须保持加粗');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}

// 9. Smart Matching Intermediate Layer Assertions
{
  // Test Section 9 test condition decoupling
  const phDecoupled = decoupleSection9Condition('pH值（1%水溶液）：', '7.5 - 8.5');
  assert.equal(phDecoupled.conditionQualifier, '（1%水溶液）', 'Section 9 pH测试条件未正确分离');
  assert.equal(phDecoupled.coreLabel, 'pH值：', 'Section 9 pH核心标签未规整');
  assert.equal(phDecoupled.value, '7.5 - 8.5', 'Section 9 pH数值未保留');

  const viscDecoupled = decoupleSection9Condition('9.17 粘度（25℃，4号转子）：', '1500 mPa.s');
  assert.equal(viscDecoupled.conditionQualifier, '（25℃，4号转子）', 'Section 9 粘度测试条件未正确解耦');

  // Test Section 2 P-statements grouping into 4 standard blocks
  const pInput = `
    预防措施：避免吸入粉尘。作业后彻底清洗。
    事故响应：如误吸入：转移至空气新鲜处。如误吞咽：立即就医。
    安全储存：存放在阴凉通风良好处。
    废弃处置：处置内容物与容器依照地方规定。
  `;
  const pGrouped = groupPrecautionaryStatements(pInput);
  assert.ok(pGrouped.includes('预防措施：'), '防范说明缺少预防措施块');
  assert.ok(pGrouped.includes('事故响应：'), '防范说明缺少事故响应块');
  assert.ok(pGrouped.includes('安全储存：'), '防范说明缺少安全储存块');
  assert.ok(pGrouped.includes('废弃处置：'), '防范说明缺少废弃处置块');

  // Test missing/unmeasured detection
  assert.equal(isMissingOrUnmeasured('无数据'), true, '无数据应判定为缺失');
  assert.equal(isMissingOrUnmeasured('未测定'), true, '未测定应判定为缺失');
  assert.equal(isMissingOrUnmeasured('-'), true, '横线占位符应判定为缺失');
  assert.equal(isMissingOrUnmeasured('7.5 - 8.5'), false, '有效测定值不得误判为缺失');

  // Test end-to-end matching against embedded CN template
  const cnTplSource = await fs.readFile(path.join(templateDir, '正式模板_MSDS_CN_冠志(1).docx'));
  const inspectEngine = await loadDocx(cnTplSource, '正式模板_MSDS_CN_冠志(1).docx');
  const matchResult = runSmartMatching(inspectEngine.records);

  assert.equal(matchResult.success, true, '智能匹配执行应成功');
  assert.equal(matchResult.matchedSections.length, 16, '智能匹配应覆盖全部 16 章节');
  assert.ok(matchResult.summary.matchedFields > 20, '智能匹配标准字段命中数异常偏低');

  // Test handoff to a fresh template editor working copy
  const editorEngine = await loadDocx(cnTplSource, '正式模板_MSDS_CN_冠志(1).docx');
  const handoffRes = applyMatchResultToEditor(matchResult, editorEngine);
  assert.equal(handoffRes.success, true, '匹配结果向编辑器注入失败');
  assert.ok(handoffRes.injectedCount > 10, '编辑器注入字段数异常偏低');

  // Ensure no audit errors after handoff
  const auditErrors = auditEngine(editorEngine);
  assert.equal(auditErrors.length, 0, `注入后编辑器存在 ${auditErrors.length} 个审计结构违规`);

  // 10. Global Matching Engine Constraints Assertions
  // 10.1 Decomposition & Bold Demotion rule (>10 chars & parent label context)
  const normFact = decomposeRunsToFact({
    runs: [
      { bold: true, text: '产品名称：' },
      { bold: false, text: '环保聚氨酯' },
    ],
  });
  assert.equal(normFact.rawLabel, '产品名称：', '常规短加粗文本应识别为标签');
  assert.equal(normFact.rawValue, '环保聚氨酯', '普通文本应识别为数值');

  const longBoldFact = decomposeRunsToFact({
    runs: [
      { bold: true, text: '本产品含有微量挥发性有机化合物请注意通风使用' },
    ],
  });
  assert.equal(longBoldFact.rawLabel, '', '超出10个字的长加粗文本严禁被误判为标签');
  assert.equal(longBoldFact.isDemotedFromBold, true, '超出10个字的长加粗文本必须标记为降级');
  assert.equal(longBoldFact.rawValue, '本产品含有微量挥发性有机化合物请注意通风使用', '降级长文本应归入数值');

  const childBoldFact = decomposeRunsToFact(
    { runs: [{ bold: true, text: 'PU-2346' }] },
    { hasParentLabel: true }
  );
  assert.equal(childBoldFact.rawLabel, '', '同行中已有父级标签时后续加粗文本严禁判为标签');
  assert.equal(childBoldFact.rawValue, 'PU-2346', '同行后续加粗文本应归入数值');

  // 10.2 Context-aware safe colon split (time & ratio protection)
  const timeSplit = safeColonSplit('操作时间： 12:00 - 14:00');
  assert.equal(timeSplit.label, '操作时间', '冒号切分应保留标签');
  assert.equal(timeSplit.value, '12:00 - 14:00', '时间冒号 12:00 严禁被误切');

  const ratioSplit = safeColonSplit('混合配比： 1:1');
  assert.equal(ratioSplit.label, '混合配比', '冒号切分应保留标签');
  assert.equal(ratioSplit.value, '1:1', '比例冒号 1:1 严禁被误切');

  // 10.3 Numbering prefix stripping
  const prefix1 = stripNumberingPrefix('1.1 中文名称：');
  assert.equal(prefix1.coreLabel, '中文名称：', '应剥离 1.1 前缀');
  assert.equal(prefix1.prefix, '1.1', '应提取 1.1 前缀');

  const prefix2 = stripNumberingPrefix('（1）气味：');
  assert.equal(prefix2.coreLabel, '气味：', '应剥离全角括号序号前缀');

  // 10.4 Typographic sanitation (zero-width & tight slash compounds fidelity)
  const cleanSym = sanitizeTypographyAndSymbols('无色\u200b透明液体，通风/排气良好，密度 1.05 g/cm³');
  assert.ok(!cleanSym.includes('\u200b'), '零宽字符必须被剔除');
  assert.ok(cleanSym.includes('通风/排气良好'), '紧凑固定搭配斜杠严禁被破坏分行');
  assert.ok(cleanSym.includes('1.05 g/cm³'), '度量衡单位必须保真');

  // 10.5 Substantive Negative Findings Protection & Missing differentiation
  assert.equal(isSubstantiveNegativeFinding('初沸点以下无闪点'), true, '初沸点以下无闪点必须为实质否定结论');
  assert.equal(isMissingOrUnmeasured('初沸点以下无闪点'), false, '实质否定结论严禁判定为缺失！');
  assert.equal(isSubstantiveNegativeFinding('无危险反应'), true, '无危险反应必须受保护');
  assert.equal(isSubstantiveNegativeFinding('非危险品'), true, '非危险品必须受保护');
  assert.equal(isPureMissingValue('无数据'), true, '无数据应为纯缺失');
  assert.equal(isSubstantiveNegativeFinding('无数据'), false, '无数据非实质否定结论');

  // 10.6 Conflict detection
  const conflictCheck = detectSlotConflicts([
    { value: '1.05 g/cm³' },
    { value: '1.08 g/cm³' },
  ]);
  assert.equal(conflictCheck.hasConflict, true, '不同实质数值必须判定为冲突');

  const dedupCheck = detectSlotConflicts([
    { value: '1.05 g/cm³' },
    { value: '1.05  g/cm³' },
  ]);
  assert.equal(dedupCheck.hasConflict, false, '实质等价数值应自动去重');
  assert.equal(dedupCheck.resolvedValue, '1.05 g/cm³');

  // 10.7 OW-029 Non-positional semantic slot resolution
  const resolvedSlot = resolveSlotBySemantics('9.6 闪点：', 9);
  assert.equal(resolvedSlot?.slot?.key, 'flash_point', '非物理行号绑定应由语义精准对齐');

  // 11. Multi-format Source Viewer & UI Width Allocation Assertions
  const cssContent = await fs.readFile(path.join(webRoot, 'src', 'styles.css'), 'utf-8');
  assert.ok(cssContent.includes('matching-grid-all-three'), '必须定义 matching-grid-all-three 布局');
  assert.ok(cssContent.includes('minmax(520px, 1.45fr)'), '原版式列必须获得保底 >= 520px 与 1.45fr 倾斜权重');
  assert.ok(cssContent.includes('preview-expanded'), '必须支持 preview-expanded 聚焦展宽模式');
  assert.ok(cssContent.includes('pdf-viewer-shell'), '必须包含 pdf-viewer-shell 样式');
  assert.ok(cssContent.includes('preview-type-badge'), '必须包含 preview-type-badge 格式徽标样式');

  const mainContent = await fs.readFile(path.join(webRoot, 'src', 'main.js'), 'utf-8');
  assert.ok(mainContent.includes('loadSourcePreviewFile'), 'main.js 必须具备 loadSourcePreviewFile 多格式解析加载器');
  assert.ok(mainContent.includes('.pdf'), 'main.js 必须开放 .pdf 文件接收');
  assert.ok(mainContent.includes('native-pdf-frame'), 'main.js 必须支持 native-pdf-frame 原生阅览挂载');
  assert.ok(mainContent.includes('preview-expanded'), 'main.js 必须支持 preview-expanded 展宽双态切换');
}

console.log('SMOKE_PASS: all embedded templates and sample files verified cleanly.');
