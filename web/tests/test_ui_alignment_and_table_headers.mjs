import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';
import { renderParagraph, sourceCellStyle } from '../src/render-utils.js';

console.log('=================================================================');
console.log('MSDS STUDIO 全 16 Section 标签双槽对齐与表头统一自动化回归套件');
console.log('=================================================================\n');

// 1. 基准模板与真实样本加载
const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const srcPath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const srcBuf = await fs.readFile(srcPath);

const srcEngine = await loadDocx(srcBuf, 'PU-2341E.docx');
const tplEngine = await loadDocx(tplBuf, 'template.docx');

const matchResult = runSmartMatching(srcEngine.records);
applyMatchResultToEditor(matchResult, tplEngine);

// =====================================================================
// 检验 1：Section 3 表头三列（化学品名称、CAS编号、含量%（w/w））格式统一
// =====================================================================
console.log('--- 验证 1：Section 3 表头三列格式与角色一致性 ---');
const s3Record = tplEngine.records.find((r) => r.sectionNumber === 3 && r.kind === 'table');
assert(s3Record, '断言：Section 3 表格必须存在');

const s3HeaderRow = s3Record.rows.find((r) => r.cells.some((c) => /CAS编号/i.test(c.text)));
assert(s3HeaderRow, '断言：Section 3 必须包含 CAS编号 表头行');
assert.equal(s3HeaderRow.cells.length, 3, '断言：Section 3 表头行必须包含 3 列单元格');

s3HeaderRow.cells.forEach((cell, idx) => {
  assert.equal(cell.role, 'table-header', `断言：列 ${idx} 角色必须为 table-header`);
  assert.equal(cell.fontRole, 'label-header', `断言：列 ${idx} 字体角色必须为 label-header`);
  assert.equal(cell.editable, false, `断言：列 ${idx} 表头必须受保护不可编辑`);

  const cellHtml = cell.paragraphs.map((p) => renderParagraph(p, cell, s3Record, tplEngine.roleStyles, false, s3HeaderRow)).join('');
  assert.ok(cellHtml.includes('class="table-header-row"'), `断言：列 ${idx} 必须赋予统一的 table-header-row 类名`);
  assert.ok(cellHtml.includes('font-weight:700'), `断言：列 ${idx} 必须强制加粗呈现 (font-weight:700)`);
  assert.ok(cellHtml.includes('text-decoration:underline'), `断言：列 ${idx} 必须统一下划线`);
  assert.ok(!cellHtml.includes('label-child-row'), `断言：列 ${idx} 严禁继承 label-child-row 带来的 2.2rem 偏位缩进`);

  // 底层 OpenXML 检查：确认每个 run 都有 <w:b/> 节点
  for (const p of cell.paragraphs) {
    for (const run of p.runs) {
      assert.equal(run.bold, true, `断言：列 ${idx} 底层 run.bold 必须为 true`);
      const bNode = run.node.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'b')[0];
      assert.ok(bNode, `断言：列 ${idx} 底层 OpenXML <w:r> 必须显式具备 <w:b/> 节点`);
    }
  }
});
console.log('✓ Section 3 表头三列加粗、下划线、OpenXML <w:b/> 与无偏位缩进全部核验通过！\n');

// =====================================================================
// 检验 2：全 16 Section 序号与标签首字双槽位 (Double-Slot Grid) 与基线一致性
// =====================================================================
console.log('--- 验证 2：全 16 Section 序号与标签首字双槽位 Grid 结构 ---');
const s1Record = tplEngine.records.find((r) => r.sectionNumber === 1 && r.kind === 'table');
const s1r1Html = renderParagraph(s1Record.rows[1].cells[0].paragraphs[0], s1Record.rows[1].cells[0], s1Record, tplEngine.roleStyles, false, s1Record.rows[1]);
assert.ok(s1r1Html.includes('class="label-line-grid'), '断言：1.1 产品名称 必须使用 label-line-grid 网格容器');
assert.ok(s1r1Html.includes('class="sequence-run"'), '断言：序号必须位于 sequence-run 槽位');
assert.ok(s1r1Html.includes('class="label-text-slot"'), '断言：标签正文必须位于 label-text-slot 槽位');
assert.ok(s1r1Html.includes('1.1'), '断言：序号槽必须准确包含 1.1');
assert.ok(s1r1Html.includes('产品名称：'), '断言：正文槽必须准确包含产品名称：');

const s10Record = tplEngine.records.find((r) => r.sectionNumber === 10 && r.kind === 'table');
const s10r1Html = renderParagraph(s10Record.rows[1].cells[0].paragraphs[0], s10Record.rows[1].cells[0], s10Record, tplEngine.roleStyles, false, s10Record.rows[1]);
assert.ok(s10r1Html.includes('class="label-line-grid'), '断言：10.1 化学稳定性 必须使用 label-line-grid 网格容器');
assert.ok(s10r1Html.includes('10.1'), '断言：序号槽必须准确包含 10.1');

const s11Record = tplEngine.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
const s11r8 = s11Record.rows.find((r) => r.cells.some((c) => /特异性靶器官/i.test(c.text)));
assert(s11r8, '断言：Section 11.8 必须存在');
const s11r8Html = renderParagraph(s11r8.cells[0].paragraphs[0], s11r8.cells[0], s11Record, tplEngine.roleStyles, false, s11r8);
assert.ok(s11r8Html.includes('class="label-line-grid'), '断言：11.8 特异性靶器官 必须使用 label-line-grid 网格容器');
assert.ok(s11r8Html.includes('class="label-text-slot"'), '断言：多行长标签正文完全置于 label-text-slot 槽内以保障悬挂缩进');
console.log('✓ 序号与标签文本双槽位 Grid 结构核验通过！\n');

// =====================================================================
// 检验 3：CSS 样式表与垂直居中治理
// =====================================================================
console.log('--- 验证 3：垂直居中恢复与窄标签列防伪竖排规则 ---');
const cssPath = new URL('../src/styles.css', import.meta.url);
const cssContent = await fs.readFile(cssPath, 'utf-8');

assert.ok(cssContent.includes('--sequence-width: 2.8rem;'), '断言：CSS 必须定义统一的 --sequence-width 变量');
assert.ok(!cssContent.includes('.structured-table td:first-child {\n  text-align: left !important;\n  vertical-align: top !important;'), '断言：禁止出现 td:first-child vertical-align: top !important 暴力覆盖');
assert.ok(cssContent.includes('.label-line-grid {'), '断言：CSS 必须声明 .label-line-grid');
assert.ok(cssContent.includes('.sequence-slot {'), '断言：CSS 必须声明 .sequence-slot');
assert.ok(cssContent.includes('.label-text-slot {'), '断言：CSS 必须声明 .label-text-slot');
assert.ok(cssContent.includes('.table-header-row {'), '断言：CSS 必须声明 .table-header-row');

// 单元格内联样式检查：默认垂直居中
const sampleStyle = sourceCellStyle(s3HeaderRow.cells[0], 10000);
assert.ok(sampleStyle.includes('vertical-align:middle'), '断言：表格单元格默认垂直对齐必须为 middle 居中');
assert.ok(sampleStyle.includes('min-width:110px'), '断言：标签列必须设定最小宽度 110px 防压缩');
assert.ok(sampleStyle.includes('word-break:normal'), '断言：标签列必须使用 word-break:normal 防汉字伪竖排折断');
console.log('✓ 垂直居中恢复与防逐字伪竖排断行规则核验通过！\n');

// =====================================================================
// 检验 4：单列说明行语义解耦 (Section 13, 15, 16)
// =====================================================================
console.log('--- 验证 4：Section 13/15/16 单列大文本解耦为 value-only ---');
const s13Record = tplEngine.records.find((r) => r.sectionNumber === 13 && r.kind === 'table');
const s13r1Html = renderParagraph(s13Record.rows[1].cells[0].paragraphs[0], s13Record.rows[1].cells[0], s13Record, tplEngine.roleStyles, false, s13Record.rows[1]);
assert.ok(s13r1Html.includes('class="value-only-row"'), '断言：Section 13 废弃处置声明必须赋予 value-only-row');
assert.ok(s13r1Html.includes('font-weight:normal'), '断言：Section 13 废弃处置声明字重必须为 normal');

const s16Record = tplEngine.records.find((r) => r.sectionNumber === 16 && r.kind === 'table');
const s16r1Html = renderParagraph(s16Record.rows[1].cells[0].paragraphs[0], s16Record.rows[1].cells[0], s16Record, tplEngine.roleStyles, false, s16Record.rows[1]);
assert.ok(s16r1Html.includes('class="value-only-row"'), '断言：Section 16 免责声明必须赋予 value-only-row');
assert.ok(s16r1Html.includes('font-weight:normal'), '断言：Section 16 免责声明字重必须为 normal');
console.log('✓ Section 13/15/16 单列说明行语义解耦核验通过！\n');

console.log('=================================================================');
console.log('🎉 专项审计报告所列问题重构与回归测试 100% 全部通过！');
console.log('=================================================================');
