import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';
import { renderParagraph, renderEditorCell, splitLabelSequence } from '../src/render-utils.js';

console.log('=================================================================');
console.log('MSDS STUDIO 全三大视图表格标签中文首字对齐专项自动化测试');
console.log('=================================================================\n');

// 1. 基准文档与模板载入
const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const srcPath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const srcBuf = await fs.readFile(srcPath);

const srcEngine = await loadDocx(srcBuf, 'PU-2341E.docx');
const tplEngine = await loadDocx(tplBuf, 'template.docx');

const matchResult = runSmartMatching(srcEngine.records);
applyMatchResultToEditor(matchResult, tplEngine);

// =====================================================================
// 检验 1：工具函数 splitLabelSequence 正确性
// =====================================================================
console.log('--- 验证 1：splitLabelSequence 序号与标签拆分器 ---');
const split1 = splitLabelSequence('1.1  产品名称：');
assert.equal(split1.sequence, '1.1  ');
assert.equal(split1.labelText, '产品名称：');

const split10 = splitLabelSequence('10.1 化学稳定性：');
assert.equal(split10.sequence, '10.1  ');
assert.equal(split10.labelText, '化学稳定性：');

const splitNoNum = splitLabelSequence('中文名称：');
assert.equal(splitNoNum.sequence, '');
assert.equal(splitNoNum.labelText, '中文名称：');

const splitChild = splitLabelSequence('呼吸系统防护：');
assert.equal(splitChild.sequence, '');
assert.equal(splitChild.labelText, '呼吸系统防护：');
console.log('✓ splitLabelSequence 序号与纯正文拆分器校验通过！\n');

// =====================================================================
// 检验 2：01 DOCX 识别视图 (Inspector) 标签中文首字槽位一致性
// =====================================================================
console.log('--- 验证 2：01 DOCX 识别视图标签网格双槽位结构 ---');
const s1Raw = srcEngine.records.find((r) => r.sectionNumber === 1 && r.kind === 'table');
assert(s1Raw, 'DOCX 识别 Section 1 必须存在');

// 检查行 1 (带序号: 1.1产品名称：)
const s1r1Html = renderParagraph(s1Raw.rows[1].cells[0].paragraphs[0], s1Raw.rows[1].cells[0], s1Raw, srcEngine.roleStyles, false, s1Raw.rows[1]);
assert.ok(s1r1Html.includes('class="label-line-grid'), '1.1 产品名称 必须使用 label-line-grid');
assert.ok(s1r1Html.includes('class="sequence-run"'), '序号必须位于 sequence-run 槽位');
assert.ok(s1r1Html.includes('class="label-text-slot"'), '正文必须位于 label-text-slot 槽位');
assert.ok(s1r1Html.includes('1.1'), '序号槽必须包含 1.1');
assert.ok(s1r1Html.includes('产品名称：'), '正文槽必须包含产品名称：');

// 检查行 2 (无序号子行: 中文名称：)
const s1r2Html = renderParagraph(s1Raw.rows[2].cells[0].paragraphs[0], s1Raw.rows[2].cells[0], s1Raw, srcEngine.roleStyles, false, s1Raw.rows[2]);
assert.ok(s1r2Html.includes('class="label-line-grid'), '中文名称 必须同样使用 label-line-grid 保持垂直共线');
assert.ok(s1r2Html.includes('empty-slot'), '中文名称 必须具备 empty-slot 占位槽');
assert.ok(s1r2Html.includes('class="label-text-slot"'), '中文名称 正文必须置于 label-text-slot 槽内');
assert.ok(s1r2Html.includes('中文名称：'), '正文槽必须包含中文名称：');

// 检查行 3 (无序号子行: 化学品分类：)
const s1r3Html = renderParagraph(s1Raw.rows[3].cells[0].paragraphs[0], s1Raw.rows[3].cells[0], s1Raw, srcEngine.roleStyles, false, s1Raw.rows[3]);
assert.ok(s1r3Html.includes('class="label-line-grid'), '化学品分类 必须使用 label-line-grid');
assert.ok(s1r3Html.includes('empty-slot'), '化学品分类 必须具备 empty-slot 占位槽');

// 检查 Section 8 PPE 标签 (无序号行: 呼吸系统防护：, 手部防护：)
const s8Raw = srcEngine.records.find((r) => r.sectionNumber === 8 && r.kind === 'table');
if (s8Raw) {
  const ppeRow = s8Raw.rows.find((r) => r.cells.some((c) => /呼吸系统防护/i.test(c.text)));
  if (ppeRow) {
    const ppeHtml = renderParagraph(ppeRow.cells[0].paragraphs[0], ppeRow.cells[0], s8Raw, srcEngine.roleStyles, false, ppeRow);
    assert.ok(ppeHtml.includes('class="label-line-grid'), 'Section 8 呼吸系统防护 必须使用 label-line-grid');
    assert.ok(ppeHtml.includes('empty-slot'), 'Section 8 呼吸系统防护 必须具备 empty-slot');
  }
}
console.log('✓ 01 DOCX 识别视图带序号与无序号标签首字双槽位核验通过！\n');

// =====================================================================
// 检验 3：02 智能匹配工作台 (Smart Matching) 原始表与模板表首字对齐
// =====================================================================
console.log('--- 验证 3：02 智能匹配工作台双表首字对齐结构 ---');
const tplS1 = tplEngine.records.find((r) => r.sectionNumber === 1 && r.kind === 'table');

// 标准模板行 1 (1.1  产品名称：)
const tplS1r1Html = renderParagraph(tplS1.rows[1].cells[0].paragraphs[0], tplS1.rows[1].cells[0], tplS1, tplEngine.roleStyles, false, tplS1.rows[1]);
assert.ok(tplS1r1Html.includes('class="label-line-grid'), '标准表 1.1 产品名称 必须使用 label-line-grid');
assert.ok(tplS1r1Html.includes('1.1'), '标准表 序号槽必须包含 1.1');

// 标准模板行 2 (中文名称：)
const tplS1r2Html = renderParagraph(tplS1.rows[2].cells[0].paragraphs[0], tplS1.rows[2].cells[0], tplS1, tplEngine.roleStyles, false, tplS1.rows[2]);
assert.ok(tplS1r2Html.includes('class="label-line-grid'), '标准表 中文名称 必须使用 label-line-grid');
assert.ok(tplS1r2Html.includes('empty-slot'), '标准表 中文名称 必须具备 empty-slot');
assert.ok(tplS1r2Html.includes('中文名称：'), '标准表 正文槽必须包含中文名称：');

// 跨 Section 10 序号位数变化核验 (10.1 化学稳定性： vs 1.1)
const tplS10 = tplEngine.records.find((r) => r.sectionNumber === 10 && r.kind === 'table');
const tplS10r1Html = renderParagraph(tplS10.rows[1].cells[0].paragraphs[0], tplS10.rows[1].cells[0], tplS10, tplEngine.roleStyles, false, tplS10.rows[1]);
assert.ok(tplS10r1Html.includes('class="label-line-grid'), '标准表 10.1 必须使用 label-line-grid');
assert.ok(tplS10r1Html.includes('10.1'), '标准表 序号槽必须包含 10.1');
console.log('✓ 02 智能匹配工作台原始表与标准表网格双槽位核验通过！\n');

// =====================================================================
// 检验 4：03 模板编辑器 (Template Editor) 锁定态与编辑态首字对齐
// =====================================================================
console.log('--- 验证 4：03 模板编辑器首字对齐与双槽位网格 ---');
// 4.1 锁定状态下 (allowLabelEdit: false)
const editorR1Locked = renderEditorCell(tplS1, tplS1.rows[1], tplS1.rows[1].cells[0], 10000, false, tplEngine.roleStyles, false, { allowLabelEdit: false });
assert.ok(editorR1Locked.includes('class="label-line-grid'), '编辑器锁定态 1.1 必须使用 label-line-grid');
assert.ok(editorR1Locked.includes('sequence-run') || editorR1Locked.includes('sequence-slot'), '编辑器锁定态 1.1 必须具备 sequence-slot 或 sequence-run');
assert.ok(editorR1Locked.includes('label-text-slot'), '编辑器锁定态 1.1 必须具备 label-text-slot');

const editorR2Locked = renderEditorCell(tplS1, tplS1.rows[2], tplS1.rows[2].cells[0], 10000, false, tplEngine.roleStyles, false, { allowLabelEdit: false });
assert.ok(editorR2Locked.includes('class="label-line-grid'), '编辑器锁定态 中文名称 必须使用 label-line-grid');
assert.ok(editorR2Locked.includes('empty-slot'), '编辑器锁定态 中文名称 必须具备 empty-slot 占位槽');
assert.ok(editorR2Locked.includes('label-text-slot'), '编辑器锁定态 中文名称 必须具备 label-text-slot');

// 4.2 允许编辑状态下 (allowLabelEdit: true)
const mockCellWithLabel = {
  ...tplS1.rows[1].cells[0],
  labelText: '1.1  产品名称：',
};
const editorR1Edit = renderEditorCell(tplS1, tplS1.rows[1], mockCellWithLabel, 10000, false, tplEngine.roleStyles, false, { allowLabelEdit: true });
assert.ok(editorR1Edit.includes('class="label-line-grid'), '编辑器编辑态 1.1 必须使用 label-line-grid');
assert.ok(editorR1Edit.includes('is-editable-label'), '编辑器编辑态 必须包含可编辑标签输入框');
assert.ok(editorR1Edit.includes('class="label-text-slot"'), '编辑器编辑态 编辑输入框必须严格约束在 label-text-slot 槽内');

const mockCellNoNum = {
  ...tplS1.rows[2].cells[0],
  labelText: '中文名称：',
};
const editorR2Edit = renderEditorCell(tplS1, tplS1.rows[2], mockCellNoNum, 10000, false, tplEngine.roleStyles, false, { allowLabelEdit: true });
assert.ok(editorR2Edit.includes('class="label-line-grid'), '编辑器编辑态 中文名称 必须使用 label-line-grid');
assert.ok(editorR2Edit.includes('empty-slot'), '编辑器编辑态 中文名称 必须具备 empty-slot');
console.log('✓ 03 模板编辑器锁定态与编辑态双槽位网格核验通过！\n');

// =====================================================================
// 检验 5：CSS 样式表变量与规则核验
// =====================================================================
console.log('--- 验证 5：CSS 样式表与几何规约核验 ---');
const cssPath = new URL('../src/styles.css', import.meta.url);
const cssContent = await fs.readFile(cssPath, 'utf-8');

assert.ok(cssContent.includes('--sequence-width: 2.8rem;'), '断言：CSS 必须声明 --sequence-width: 2.8rem;');
assert.ok(cssContent.includes('.sequence-slot.empty-slot {'), '断言：CSS 必须声明 .sequence-slot.empty-slot');
assert.ok(cssContent.includes('visibility: hidden !important;'), '断言：empty-slot 必须设置 visibility: hidden');
assert.ok(!cssContent.includes('padding-left: 2.2rem !important;'), '断言：严禁出现旧的 2.2rem 偏位缩进');
console.log('✓ CSS 样式表空槽位、无偏位与几何规约核验通过！\n');

console.log('=================================================================');
console.log('🎉 MSDS STUDIO 三大视图表格标签中文首字对齐 100% 全部通过！');
console.log('=================================================================');
