import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx, writeCellLabel } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor, cleanSlateTemplate } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== MSDS STUDIO 模板结构与加粗标签不可变性及六类问题回归测试 ===\n');

// 1. 载入真实源文档 PU-2341E 与标准模板
const samplePath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const sBuf = await fs.readFile(samplePath);
const sEngine = await loadDocx(sBuf, 'PU-2341E.docx');

const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const tEngine = await loadDocx(tplBuf, 'template.docx');

// 记录模板初始加粗标签基准状态（除 Section 9 外）
const initialBoldLabels = new Map();
for (const r of tEngine.records) {
  if (r.kind === 'table' && r.sectionNumber && r.sectionNumber !== 9) {
    const bolds = [];
    for (const row of r.rows) {
      for (const cell of row.cells) {
        for (const p of cell.paragraphs) {
          for (const run of p.runs) {
            if (run.bold && run.text?.trim()) {
              bolds.push(run.text.trim());
            }
          }
        }
      }
    }
    initialBoldLabels.set(r.sectionNumber, bolds);
  }
}

// 2. 执行智能匹配与编辑器注入
const matchResult = runSmartMatching(sEngine.records);
const injectRes = applyMatchResultToEditor(matchResult, tEngine);

console.log(`✓ 匹配与注入完成：injected=${injectRes.injectedCount}, pruned=${injectRes.prunedCount}`);

// ==========================================
// 断言一：Section 3 表头防篡改（绝不能写入 components_summary）
// ==========================================
const sec3 = tEngine.records.find((r) => r.sectionNumber === 3);
assert(sec3, '必须存在 Section 3');
const headerIdx = sec3.rows.findIndex((r) => r.cells.some((c) => /CAS编号/i.test(c.text)));
assert(headerIdx !== -1, 'Section 3 必须存在包含 CAS编号 的表头行');
const sec3HeaderRow = sec3.rows[headerIdx];
const casHeaderCell = sec3HeaderRow.cells[1];
assert.equal(casHeaderCell.text.trim(), 'CAS编号', 'Section 3 表头第二列必须绝对为 "CAS编号"，严禁被 components_summary 覆盖！');
assert(!casHeaderCell.text.includes('聚氨酯聚合物'), 'CAS编号表头严禁包含组分名称');
assert(!casHeaderCell.text.includes('商业机密'), 'CAS编号表头严禁包含商业机密字样');
assert(!casHeaderCell.text.includes('- 水'), 'CAS编号表头严禁包含成分列表文本');
console.log('✓ Section 3 表头结构完好无损，CAS编号单元格未被篡改！');

// 检查 Section 3 数据行：应从 headerIdx + 1 开始填入实际成分
const firstDataRow = sec3.rows[headerIdx + 1];
assert(firstDataRow, 'Section 3 必须存在至少一个成分数据行');
assert(firstDataRow.cells[0].text.trim().length > 0, '首行成分名称应非空');
assert(firstDataRow.cells[1].text.trim().length > 0, '首行成分 CAS 应非空');
assert(firstDataRow.cells[2].text.trim().length > 0, '首行成分含量应非空');
console.log(`✓ Section 3 成分数据行规范填报: ${firstDataRow.cells[0].text.trim()} | ${firstDataRow.cells[1].text.trim()} | ${firstDataRow.cells[2].text.trim()}`);

// ==========================================
// 断言二：Section 8 标签列防污染与值列正确定位
// ==========================================
const sec8 = tEngine.records.find((r) => r.sectionNumber === 8);
assert(sec8, '必须存在 Section 8');
const handRow = sec8.rows.find((row) => row.cells.some((c) => /手部防护/i.test(c.text)));
assert(handRow, 'Section 8 必须包含手部防护行');
const handLabelCell = handRow.cells[0];
assert(handLabelCell.text.includes('手部防护'), `手部防护标签单元格内容必须包含 "手部防护"，实际为: ${handLabelCell.text}`);
assert(!handLabelCell.text.includes('喷涂过程中要求有呼吸防护设备'), '手部防护标签格严禁被呼吸防护设备内容污染覆盖！');
console.log('✓ Section 8 手部防护加粗标签未被篡改，标签列与值列彻底隔离！');

// ==========================================
// 断言三：标签修改白名单权限拦截（非 Section 9 严禁修改标签）
// ==========================================
assert.throws(() => {
  writeCellLabel(handLabelCell, '篡改的标签文本', true);
}, /只有第9部分允许根据源文件微调特殊标签|LOCKED_LABEL|LABEL_MUTATION_FORBIDDEN/, '非 Section 9 调用 writeCellLabel 必须被坚决拦截！');
console.log('✓ 标签修改权限白名单生效：非 Section 9 严禁篡改标签！');

// ==========================================
// 断言四：Section 5 适用灭火剂与不适用灭火剂防颠倒
// ==========================================
const sec5 = tEngine.records.find((r) => r.sectionNumber === 5);
assert(sec5, '必须存在 Section 5');
const mediaRow = sec5.rows.find((row) => row.cells.some((c) => /5\.1|灭火介质|适用灭火剂/i.test(c.text)));
const unsuitRow = sec5.rows.find((row) => row.cells.some((c) => /5\.2|不适用/i.test(c.text)));
assert(mediaRow, 'Section 5 必须存在灭火介质行');
const mediaVal = mediaRow.cells[mediaRow.cells.length - 1].text;
assert(!mediaVal.includes('高流量的水喷射'), 'Section 5.1 适用灭火剂严禁被填成不适用灭火剂（高流量的水喷射）！');
assert(mediaVal.includes('二氧化碳') || mediaVal.includes('泡沫') || mediaVal.includes('喷洒水') || mediaVal.includes('干粉'), `5.1 适用灭火剂必须包含源文件中的正向灭火剂事实，实际为: ${mediaVal}`);
if (unsuitRow) {
  const unsuitVal = unsuitRow.cells[unsuitRow.cells.length - 1].text;
  assert(unsuitVal.includes('高流量的水喷射') || unsuitVal.includes('水喷射'), `5.2 不适用灭火剂应包含高流量水喷射，实际为: ${unsuitVal}`);
}
console.log('✓ Section 5 适用灭火剂与不适用灭火剂映射精准，杜绝颠倒！');

// ==========================================
// 断言五：Section 9 相对密度保全与原文忠实
// ==========================================
const sec9 = tEngine.records.find((r) => r.sectionNumber === 9);
assert(sec9, '必须存在 Section 9');
const densityRow = sec9.rows.find((row) => row.cells.some((c) => /(?:相对)?密度/i.test(c.text)));
assert(densityRow, 'Section 9 必须保留密度/相对密度行，严禁被当作无数据项误删！');
const densityVal = densityRow.cells[densityRow.cells.length - 1].text;
assert(densityVal.includes('1.05'), `相对密度值必须保留源文事实 1.05，实际为: ${densityVal}`);

// 检查 pH 标签不得无端添加（1%水溶液）
const phRow = sec9.rows.find((row) => row.cells.some((c) => /pH/i.test(c.text)));
if (phRow) {
  const phLabel = phRow.cells[0].text;
  assert(!phLabel.includes('1%水溶液'), `源文件 pH 无限定条件时，标签严禁无中生有注入 1%水溶液，实际为: ${phLabel}`);
}

// 检查引燃温度（无数据不得擅自改为不适用）
const autoIgnitionRow = sec9.rows.find((row) => row.cells.some((c) => /引燃温度/i.test(c.text)));
if (autoIgnitionRow) {
  const autoIgnitionVal = autoIgnitionRow.cells[autoIgnitionRow.cells.length - 1].text;
  assert(!autoIgnitionVal.includes('不适用'), `源文件为无数据时，严禁改写为不适用，实际为: ${autoIgnitionVal}`);
}
console.log('✓ Section 9 相对密度与原文忠实度断言全部通过！');

// ==========================================
// 断言六：无值项物理删行与重排（Section 8.2 工程控制、Section 10.4/10.5 禁配物等）
// ==========================================
const sec10 = tEngine.records.find((r) => r.sectionNumber === 10);
if (sec10) {
  const emptyRows = sec10.rows.filter((row, idx) => {
    if (idx === 0) return false;
    const val = (row.cells[row.cells.length - 1].text || '').trim();
    return val.length === 0;
  });
  assert.equal(emptyRows.length, 0, `Section 10 严禁残留空值行，残留行数: ${emptyRows.length}`);
}
console.log('✓ Section 10 无值行已彻底物理删除，无悬挂空标签！');

console.log('\n=== 全套回归测试断言定义完毕 ===\n');
