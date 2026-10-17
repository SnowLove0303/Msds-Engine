import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== 新算法训练材料（EP-1702 / EP-1704 / PU-2702 / PU-303C）全量对齐与回归验证 ===\n');

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const tplBuf = await fs.readFile(tplPath);

// -------------------------------------------------------------
// 1. 验证 EP-1702
// -------------------------------------------------------------
console.log('--- 1. 验证 EP-1702 ---');
const ep1702SrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx';
const ep1702SrcBuf = await fs.readFile(ep1702SrcPath);
const ep1702Src = await loadDocx(ep1702SrcBuf, 'EP-1702_src.docx');
const ep1702Tpl = await loadDocx(tplBuf, 'EP-1702_tpl.docx');

const ep1702Match = runSmartMatching(ep1702Src.records);
applyMatchResultToEditor(ep1702Match, ep1702Tpl);

// Section 9 必须为标准 20 行
const ep1702Sec9 = ep1702Tpl.records.find((r) => r.sectionNumber === 9 && r.kind === 'table');
assert.equal(ep1702Sec9.rows.length, 20, 'EP-1702 Section 9 必须严格为 20 行');

// Section 11 极简剪枝必须收缩为 2 行
const ep1702Sec11 = ep1702Tpl.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
assert.equal(ep1702Sec11.rows.length, 2, 'EP-1702 Section 11 无试验必须收缩为 2 行');
assert.ok(ep1702Sec11.rows[1].cells[0]?.text?.includes('该产品无可用的毒理学研究'), 'EP-1702 Section 11 必须包含无可用的毒理学研究说明');

// 全文档无 <w:cantSplit/> 限制
const ep1702CantSplits = ep1702Tpl.documentXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'cantSplit');
assert.equal(ep1702CantSplits.length, 0, 'EP-1702 表格行严禁包含 <w:cantSplit/>，必须允许跨页断行');

console.log('✅ EP-1702 验证通过');

// -------------------------------------------------------------
// 2. 验证 EP-1704 (EP-1740)
// -------------------------------------------------------------
console.log('--- 2. 验证 EP-1704 ---');
const ep1704SrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1704/EP-1740 msds_CN 冠志(源文件).docx';
const ep1704SrcBuf = await fs.readFile(ep1704SrcPath);
const ep1704Src = await loadDocx(ep1704SrcBuf, 'EP-1704_src.docx');
const ep1704Tpl = await loadDocx(tplBuf, 'EP-1704_tpl.docx');

const ep1704Match = runSmartMatching(ep1704Src.records);
applyMatchResultToEditor(ep1704Match, ep1704Tpl);

const ep1704Sec9 = ep1704Tpl.records.find((r) => r.sectionNumber === 9 && r.kind === 'table');
assert.equal(ep1704Sec9.rows.length, 20, 'EP-1704 Section 9 必须严格为 20 行');

const ep1704Sec11 = ep1704Tpl.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
assert.equal(ep1704Sec11.rows.length, 2, 'EP-1704 Section 11 无试验必须收缩为 2 行');

console.log('✅ EP-1704 验证通过');

// -------------------------------------------------------------
// 3. 验证 PU-2702 (富 OECD 试验)
// -------------------------------------------------------------
console.log('--- 3. 验证 PU-2702 ---');
const pu2702SrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-2702/PU-2702 msds_CN 冠志(源文件）.docx';
const pu2702SrcBuf = await fs.readFile(pu2702SrcPath);
const pu2702Src = await loadDocx(pu2702SrcBuf, 'PU-2702_src.docx');
const pu2702Tpl = await loadDocx(tplBuf, 'PU-2702_tpl.docx');

const pu2702Match = runSmartMatching(pu2702Src.records);
applyMatchResultToEditor(pu2702Match, pu2702Tpl);

const pu2702Sec9 = pu2702Tpl.records.find((r) => r.sectionNumber === 9 && r.kind === 'table');
assert.equal(pu2702Sec9.rows.length, 20, 'PU-2702 Section 9 必须严格为 20 行');

const pu2702Sec11 = pu2702Tpl.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
assert.equal(pu2702Sec11.rows.length, 17, 'PU-2702 Section 11 必须完美对齐为 17 行拓扑');

// 校验 11.6 体外遗传毒性合并了 Ames 471 与 染色体畸变 473
const rowInVitro = pu2702Sec11.rows[9];
assert.ok(rowInVitro.cells[0]?.text?.includes('11.6  体外遗传毒性：'), 'Row 9 必须为 11.6 体外遗传毒性');
assert.ok(rowInVitro.cells[1]?.text?.includes('OECD化学品测试指南471'), 'Row 9 必须包含 Ames 471 试验');
assert.ok(rowInVitro.cells[1]?.text?.includes('OECD化学品测试指南473'), 'Row 9 必须包含 染色体畸变 473 试验');

// 校验 11.7 体内基因毒性
const rowInVivo = pu2702Sec11.rows[10];
assert.ok(rowInVivo.cells[0]?.text?.includes('11.7  体内基因毒性：'), 'Row 10 必须为 11.7 体内基因毒性');
assert.ok(rowInVivo.cells[1]?.text?.includes('无数据资料'), 'Row 10 必须为无数据资料');

// 校验 11.8 致癌性 与 11.9 生殖毒性
assert.ok(pu2702Sec11.rows[11].cells[0]?.text?.includes('11.8  致癌性：'), 'Row 11 必须顺延为 11.8 致癌性');
assert.ok(pu2702Sec11.rows[12].cells[0]?.text?.includes('11.9  生殖毒性：'), 'Row 12 必须顺延为 11.9 生殖毒性');

console.log('✅ PU-2702 验证通过');

// -------------------------------------------------------------
// 4. 验证 PU-303C (GHS 象形图跨文档克隆)
// -------------------------------------------------------------
console.log('--- 4. 验证 PU-303C ---');
const pu303cSrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-303C/PU-303C msds_CN 冠志（源文件）.docx';
const pu303cSrcBuf = await fs.readFile(pu303cSrcPath);
const pu303cSrc = await loadDocx(pu303cSrcBuf, 'PU-303C_src.docx');
const pu303cTpl = await loadDocx(tplBuf, 'PU-303C_tpl.docx');

const pu303cMatch = runSmartMatching(pu303cSrc.records);
assert.ok(pu303cMatch.sourceEngine != null, 'PU-303C sourceEngine 必须成功绑定');

const picItem = pu303cMatch.matchedSections.find((s) => s.sectionNumber === 2)?.matchedRows.find((r) => r.key === 'pictogram');
assert.ok(picItem?.drawingNode != null, 'PU-303C Section 2 必须提取到象形图 drawingNode');

applyMatchResultToEditor(pu303cMatch, pu303cTpl);

const pu303cSec2 = pu303cTpl.records.find((r) => r.sectionNumber === 2 && r.kind === 'table');
const picRow = pu303cSec2.rows.find((r) => /象形图/i.test(r.cells[0]?.text || ''));
assert.ok(picRow, 'PU-303C Section 2 象形图行必须存在');

const picValCell = picRow.cells[picRow.cells.length - 1];
assert.ok((picValCell.images?.length || 0) > 0, '目标单元格必须持有 images 数组，供 UI 渲染真实 <img>');
assert.ok((picValCell.relationships?.length || 0) > 0, '目标单元格必须注册 relationship');
assert.ok(picValCell.text.trim() === '' || picValCell.text.trim() === '[象形图]', '真实图片注入后，文本应为空或标准图片占位符');

// 导出为 ArrayBuffer 并重新加载验证持久化保真度
const exportedBuf = await pu303cTpl.exportArrayBuffer();
const reloadedDoc = await loadDocx(exportedBuf, 'PU-303C_exported.docx');
const reloadedSec2 = reloadedDoc.records.find((r) => r.sectionNumber === 2 && r.kind === 'table');
const reloadedPicRow = reloadedSec2.rows.find((r) => /象形图/i.test(r.cells[0]?.text || ''));
const drawingsInDoc = reloadedPicRow.cells[reloadedPicRow.cells.length - 1].node.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'drawing');
assert.equal(drawingsInDoc.length, 1, '导出后的 DOCX 必须包含克隆的 <w:drawing> 图片节点');

console.log('✅ PU-303C 验证通过');

console.log('\n🎉 全部算法训练材料（EP-1702、EP-1704、PU-2702、PU-303C）100% 对齐并通过校验！');
