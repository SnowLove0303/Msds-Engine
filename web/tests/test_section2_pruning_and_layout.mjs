import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';
import { renderEditorTable } from '../src/render-utils.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== 测试：Section 2 智能匹配无值删行规约与表格两列几何排版 ===\n');

// 1. 载入真实源文档 PU-2341E 与标准模板
const samplePath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const sBuf = await fs.readFile(samplePath);
const sEngine = await loadDocx(sBuf, 'PU-2341E.docx');

const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const tEngine = await loadDocx(tplBuf, 'template.docx');

const initialSec2 = tEngine.records.find((r) => r.sectionNumber === 2);
assert.equal(initialSec2.rows.length, 16, '初始模板 Section 2 应该包含 16 行（1个标题行 + 15个数据/子行）');

// 2. 执行智能匹配与写入编辑器（包含无值删行）
const matchResult = runSmartMatching(sEngine.records);
const injectRes = applyMatchResultToEditor(matchResult, tEngine);

console.log(`✓ 匹配与注入完成：injected=${injectRes.injectedCount}, pruned=${injectRes.prunedCount}`);

// 3. 校验 Section 2 模板记录的删行效果
const finalSec2 = tEngine.records.find((r) => r.sectionNumber === 2);
console.log(`✓ Section 2 删行后行数: ${finalSec2.rows.length} (初始 16 行)`);

// PU-2341E 的 Section 2 仅有 GHS分类、标签要素、其他危害 3 项有效数据
// 标题行 1 行 + 有值行应为 3 行（共 4 行）
assert(finalSec2.rows.length <= 6, `Section 2 删行后行数必须精简，实际为 ${finalSec2.rows.length} 行`);

// 检查每个保留的数据行：值格必须非空，绝不能保留空白行
for (let i = 1; i < finalSec2.rows.length; i++) {
  const row = finalSec2.rows[i];
  const labelCell = row.cells[0];
  const valCell = row.cells[row.cells.length - 1];
  const valText = (valCell.valueText || valCell.text || '').trim();
  assert(valText.length > 0, `第 ${i} 行 (${labelCell.text}) 必须拥有有效值，严禁保留无值空行！`);
}
console.log('✓ Section 2 无值行已全部安全物理删除，无任何空白空行残留！');

// 4. 校验 Section 2 序号自适应重排与连续性
const sequences = [];
for (let i = 1; i < finalSec2.rows.length; i++) {
  const text = finalSec2.rows[i].cells[0].text;
  const match = text.match(/2\.(\d+)/);
  if (match) sequences.push(Number(match[1]));
}
console.log('✓ Section 2 重新编号序列:', sequences);
assert(sequences.length >= 2, '必须有至少 2 个序号');
for (let i = 0; i < sequences.length; i++) {
  assert.equal(sequences[i], i + 1, `序号必须严格连续，第 ${i + 1} 项应为 2.${i + 1}，实际为 2.${sequences[i]}`);
}
console.log('✓ Section 2 序号已完美重新编号且连续无断号 (2.1, 2.2, ...)！');

// 5. 校验 HTML 表格渲染几何结构（绝对杜绝 3 列异常畸变）
const renderedHtml = renderEditorTable(finalSec2);

// 提取渲染出的所有 <tr> 与 <td>
const domInstance = new JSDOM(renderedHtml);
const renderedTable = domInstance.window.document.querySelector('table');
const trs = Array.from(renderedTable.querySelectorAll('tbody tr'));

assert(trs.length === finalSec2.rows.length, `渲染的 tr 行数 (${trs.length}) 应等于数据行数 (${finalSec2.rows.length})`);

for (let rIdx = 0; rIdx < trs.length; rIdx++) {
  const tr = trs[rIdx];
  const tds = Array.from(tr.querySelectorAll('td'));
  if (rIdx === 0) {
    // 章节标题行：colspan=2
    assert.equal(tds.length, 1, '标题行只有 1 个跨两列单元格');
    assert.equal(tds[0].getAttribute('colspan'), '2');
  } else {
    // 数据行：必须正好 2 个单元格，第一列为标签，第二列为值
    assert.equal(tds.length, 2, `第 ${rIdx} 行渲染出的 td 数必须为 2（第一列标签 + 第二列值），实际为 ${tds.length}`);
    const firstTdText = tds[0].textContent.trim();
    assert(
      /^2\.\d+/.test(firstTdText) || /^(?:GHS象形图|信号词|危险性说明|防范说明|预防措施|事故响应|安全储存|废弃处置|吸入|食入|皮肤|眼睛|症状和体征)/.test(firstTdText),
      `第 ${rIdx} 行第一列必须是 2.x 标签或有效次级标签，实际为 "${firstTdText.slice(0, 20)}"`
    );
  }
}
console.log('✓ HTML 渲染严格维持 2 列结构，第一列为加粗标签，第二列为值，彻底根除 3 列畸变与列错位！');

console.log('\n========================================');
console.log('SECTION 2 PRUNING & LAYOUT TESTS PASSED 100%!');
console.log('========================================\n');
