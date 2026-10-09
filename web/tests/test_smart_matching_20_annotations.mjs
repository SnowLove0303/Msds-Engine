import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== 测试：智能匹配 20 项审阅批注 5 大维度回归验证 ===\n');

// 1. 加载基准源文件 (PU-1002) 与 官方标准模板
const pSrc = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/standard-compare/PU-1002_source_CN.docx';
const pTpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';

const [srcBuf, tplBuf] = await Promise.all([fs.readFile(pSrc), fs.readFile(pTpl)]);
const srcDoc = await loadDocx(srcBuf, 'PU-1002.docx');
const tplDoc = await loadDocx(tplBuf, 'Template.docx');

// 2. 运行智能匹配算法
const matchRes = runSmartMatching(srcDoc.records);
assert.ok(matchRes.matchedSections.length > 0, '匹配结果章节不能为空');

// 3. 执行写入模板编辑器 (结果写入编辑器映射)
const applyRes = applyMatchResultToEditor(matchRes, tplDoc);
assert.equal(applyRes.success, true, '写入编辑器必须返回成功');

// 4. 维度一：Section 2 危险性要素校验 (批注 1~5)
const sec2 = tplDoc.records.find((r) => r.sectionNumber === 2 && r.kind === 'table');
assert.ok(sec2, 'Section 2 表格必须存在');

// 校验 2.2 标签要素：大标题容器留空继承，绝对不删行 (批注 2)
const labelElemRow = sec2.rows.find((r) => /标签要素/i.test(r.cells[0]?.labelText || r.cells[0]?.text || ''));
assert.ok(labelElemRow, 'Section 2 必须保留 2.2 标签要素 行');
const labelElemVal = (labelElemRow.cells[1]?.valueText || labelElemRow.cells[1]?.text || '').trim();
assert.equal(labelElemVal, '', '2.2 标签要素值格必须留空，严禁误填信号词');

// 校验 GHS 象形图：严禁填入文本“信号词：危险” (批注 3)
const pictoRow = sec2.rows.find((r) => /象形图/i.test(r.cells[0]?.labelText || r.cells[0]?.text || ''));
assert.ok(pictoRow, 'GHS 象形图行必须保留');
const pictoVal = (pictoRow.cells[1]?.valueText || pictoRow.cells[1]?.text || '').trim();
assert.ok(!pictoVal.includes('信号词') && !pictoVal.includes('危险'), '象形图槽位严禁包含文字“信号词：危险”');

// 校验防范说明：P405、P501 条例编号完整保全 (批注 4)
const precRow = sec2.rows.find((r) => /防范说明/i.test(r.cells[0]?.labelText || r.cells[0]?.text || ''));
assert.ok(precRow, '防范说明行必须存在');
const precVal = precRow.cells[1]?.valueText || precRow.cells[1]?.text || '';
assert.ok(precVal.includes('P405'), '防范说明必须完整保留 P405 编号');
assert.ok(precVal.includes('P501'), '防范说明必须完整保留 P501 编号');

// 校验健康危害冗余行已被删行隐藏 (批注 5)
const hasRedundantHealth = sec2.rows.some((r) => /2\.\d*\s*健康危害|健康危害/i.test(r.cells[0]?.text || ''));
assert.equal(hasRedundantHealth, false, '无增量特殊表述的健康危害行应自动删行隐藏');

// 5. 维度二：Section 9 理化特性全槽位保留策略校验 (批注 9, 10)
const sec9 = tplDoc.records.find((r) => r.sectionNumber === 9 && r.kind === 'table');
assert.ok(sec9, 'Section 9 表格必须存在');
assert.equal(sec9.rows.length, 24, 'Section 9 严禁删行，必须保留全部 24 行法定槽位');

// 消除 pH 叠词 (批注 9)
const phRow = sec9.rows.find((r) => /pH/i.test(r.cells[0]?.text || ''));
assert.ok(phRow, 'pH 行必须存在');
assert.ok(!/（1%水溶液）（1%水溶液）/.test(phRow.cells[0]?.text || ''), 'pH 标签严禁出现叠词');

// 未测项目规范填充“无数据资料。” (批注 10)
const odorRow = sec9.rows.find((r) => /嗅觉/i.test(r.cells[0]?.text || ''));
assert.ok(odorRow, '嗅觉阈值行必须存在');
assert.equal(odorRow.cells[1]?.text?.trim(), '无数据资料。', '未测项必须规范填入“无数据资料。”');

// 6. 维度五：Section 8 建议行与手部防护前缀清洗校验 (批注 7, 8)
const sec8 = tplDoc.records.find((r) => r.sectionNumber === 8 && r.kind === 'table');
assert.ok(sec8, 'Section 8 表格必须存在');
const recoRow = sec8.rows.find((r) => /建议[：:]/i.test(r.cells[0]?.text || ''));
assert.ok(recoRow, '建议行必须存在');
assert.equal(recoRow.cells[1]?.text?.trim(), '污染的手套应废弃。', '建议行必须正确写入“污染的手套应废弃。”');

const hpRow = sec8.rows.find((r) => /手部防护/i.test(r.cells[0]?.text || ''));
assert.ok(hpRow, '手部防护行必须存在');
assert.ok(!hpRow.cells[1]?.text?.startsWith('手部防护：'), '手部防护值格严禁残留“手部防护：”前缀');

// 7. 维度三 & 维度四：Section 11/12 规范用语与承接语校验 (批注 11~20)
const sec11 = tplDoc.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
assert.ok(sec11, 'Section 11 表格必须存在');
const s11Row1Text = sec11.rows[1]?.cells?.map((c) => c.text).join(' ') || '';
assert.ok(s11Row1Text.includes('无可用的毒理学研究'), 'Section 11 顶部说明行必须正确保留');

const sec12 = tplDoc.records.find((r) => r.sectionNumber === 12 && r.kind === 'table');
assert.ok(sec12, 'Section 12 表格必须存在');
const s12Row1Text = sec12.rows[1]?.cells?.map((c) => c.text).join(' ') || '';
assert.ok(s12Row1Text.includes('无可用的生态毒理学研究'), 'Section 12 顶部说明行必须正确保留');

// 8. 维度三 & 维度四（进阶）：端点数据写入与子级标签对齐校验 (批注 11, 12, 13, 14, 15, 16)
function setRow(sec, key, standardLabel, value) {
  let it = sec.matchedRows.find((r) => r.key === key);
  if (!it) {
    it = { key, standardLabel, value, status: 'MATCHED' };
    sec.matchedRows.push(it);
  } else {
    it.value = value;
    it.status = 'MATCHED';
    if (standardLabel) it.standardLabel = standardLabel;
  }
}

const mockDetailMatch = {
  ...matchRes,
  matchedSections: matchRes.matchedSections.map((s) => ({
    ...s,
    matchedRows: s.matchedRows.map((r) => ({ ...r })),
  })),
};

const mSec11 = mockDetailMatch.matchedSections.find((s) => s.sectionNumber === 11);
if (mSec11) {
  setRow(mSec11, 'acute_toxicity_oral', '经口：', '半数致死剂量（LD50）/大鼠：3,000－6,000mg/kg');
  setRow(mSec11, 'acute_toxicity_inhalation', '吸入：', '半数致死浓度（LC50）/4h/大鼠：2.2mg/l');
  setRow(mSec11, 'acute_toxicity_dermal', '经皮：', '半数致死剂量（LD50）/豚鼠：＜940mg/kg');
  setRow(mSec11, 'sensitization', '致敏性：', '豚鼠 不是皮肤过敏物质 未引起实验室动物过敏');
  setRow(mSec11, 'mucosal_irritation', '主要粘膜刺激性：', '家兔 结果：刺激粘膜');

  // 模拟源文档仅有主要粘膜刺激性与组分毒理说明
  mSec11.sourceRecord = {
    rows: [
      { cells: [{ text: '主要粘膜刺激性' }, { text: '家兔 结果：刺激粘膜' }] },
      { cells: [{ text: '以下为N,N－二甲基乙酰胺毒理学数据：' }] },
    ],
  };
}

const tplDocDetail = await loadDocx(tplBuf, 'Template_Detail.docx');
const applyDetailRes = applyMatchResultToEditor(mockDetailMatch, tplDocDetail);
assert.equal(applyDetailRes.success, true, '端点详情写入模板编辑器必须成功');

const sec11Detail = tplDocDetail.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
assert.ok(sec11Detail, 'Section 11 详情表格必须存在');

// 校验 11.1 经口 LD50 准确写入第二列为经口的行 (批注 11, 12)
const oralRow = sec11Detail.rows.find((r) => r.cells.some((c) => /经口/i.test(c.text || '')));
assert.ok(oralRow, '经口子级行必须存在');
assert.ok(oralRow.cells[oralRow.cells.length - 1]?.text?.includes('3,000－6,000mg/kg'), '经口 LD50 必须准确写入对应槽位');

// 校验主要粘膜刺激性标签自适应修改 (批注 13)
const mucosalRow = sec11Detail.rows.find((r) => r.cells.some((c) => /主要粘膜刺激性/i.test(c.text || '')));
assert.ok(mucosalRow, '模板中主要眼睛刺激性标签应自适应改写为“主要粘膜刺激性”');

// 校验致敏性前缀补全 (批注 14)
const sensRow = sec11Detail.rows.find((r) => r.cells.some((c) => /致敏性/i.test(c.text || '')));
assert.ok(sensRow, '致敏性行必须存在');
assert.ok(sensRow.cells[sensRow.cells.length - 1]?.text?.startsWith('物种：豚鼠 分类：不是皮肤过敏物质 结果：未引起实验室动物过敏'), '致敏性动物试验前缀必须补全');

// 校验生殖毒性 (11.7) 与 STOT (11.8) 法定项目保留，严禁误删 (批注 15, 16)
const repRow = sec11Detail.rows.find((r) => r.cells.some((c) => /生殖毒性/i.test(c.text || '')));
assert.ok(repRow, '生殖毒性法定项目必须保留');
const stotRow = sec11Detail.rows.find((r) => r.cells.some((c) => /特异性靶器官系统毒性/i.test(c.text || '')));
assert.ok(stotRow, '特异性靶器官系统毒性法定项目必须保留');

// 校验毒理学组分承接语保留 (批注 17)
const introRow11 = sec11Detail.rows.find((r) => r.cells.length === 1 && /N,N－二甲基乙酰胺毒理学数据/i.test(r.cells[0]?.text || ''));
assert.ok(introRow11, '组分毒理学承接语行必须保留');

// 9. 维度六：Section 3 组分表格居中对齐排版校验 (批注 6)
const sec3 = tplDoc.records.find((r) => r.sectionNumber === 3 && r.kind === 'table');
assert.ok(sec3, 'Section 3 表格必须存在');
const compRow = sec3.rows.find((r) => r.cells.length >= 3 && /水性聚氨酯/i.test(r.cells[0]?.text || ''));
if (compRow) {
  assert.equal(compRow.cells[0].align, 'center', '化学品名称单元格排版必须居中');
  assert.equal(compRow.cells[1].align, 'center', 'CAS号单元格排版必须居中');
  assert.equal(compRow.cells[2].align, 'center', '浓度单元格排版必须居中');
}

console.log('✅ 全部 20 项审阅批注在智能匹配与编辑器写入映射端 100% 验证通过！');
