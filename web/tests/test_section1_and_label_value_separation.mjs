import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor, runAutomatedAudits } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== MSDS STUDIO 全16SECTION标签/加粗项与值严格隔离专项回归测试 ===\n');

// 1. 载入真实源文档 PU-2341E 与标准中文模板
const samplePath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const sBuf = await fs.readFile(samplePath);
const sEngine = await loadDocx(sBuf, 'PU-2341E.docx');

const tplCnBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const tplCnEngine = await loadDocx(tplCnBuf, 'template_cn.docx');

const tplEnBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_EN_冠志(1).docx', import.meta.url));
const tplEnEngine = await loadDocx(tplEnBuf, 'template_en.docx');

// 执行智能匹配
const matchResult = runSmartMatching(sEngine.records);

// ========================================================
// 测试套件 1: 中文模板 Section 1 专属插槽分流与题头空白保全
// ========================================================
console.log('【测试套件 1】中文模板 Section 1 路由分流验证...');
const injectResCn = applyMatchResultToEditor(matchResult, tplCnEngine);
assert(injectResCn.success, '中文模板注入必须成功');

const sec1Cn = tplCnEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 1);
assert(sec1Cn, '中文模板必须存在 Section 1 表格');

// 检查第 1 行：1.1  产品名称：
const row1 = sec1Cn.rows[1];
assert(row1, 'Section 1 必须存在第 1 行');
const row1Label = (row1.cells[0]?.text || '').trim();
const row1Val = (row1.cells[1]?.text || '').trim();
assert(row1Label.includes('产品名称'), `第 1 行必须为产品名称题头，实际为: ${row1Label}`);
assert.equal(row1Val, '', `【关键断言】第 1 行 1.1 产品名称： 的值单元格必须严格为空，严禁被注入产品名称！实际为: "${row1Val}"`);

// 检查第 2 行：中文名称：
const row2 = sec1Cn.rows[2];
assert(row2, 'Section 1 必须存在第 2 行');
const row2Label = (row2.cells[0]?.text || '').trim();
const row2Val = (row2.cells[1]?.text || '').trim();
assert(row2Label.includes('中文名称'), `第 2 行必须为中文名称，实际为: ${row2Label}`);
assert(row2Val.includes('聚氨酯分散体 PU-2341E') || (row2Val.includes('聚氨酯分散体') && row2Val.includes('PU-2341E')),
  `【关键断言】第 2 行 中文名称： 必须注入产品名称与型号，实际为: "${row2Val}"`);

// 检查第 3 行：化学品分类：
const row3 = sec1Cn.rows[3];
const row3Val = (row3.cells[1]?.text || '').trim();
assert.equal(row3Val, '聚氨酯分散体', `第 3 行化学品分类必须正确注入，实际为: "${row3Val}"`);

// 检查第 4 行：1.2  产品使用建议和使用限制：
const row4 = sec1Cn.rows[4];
const row4Val = (row4.cells[1]?.text || '').trim();
assert.equal(row4Val, '油墨', `第 4 行使用建议必须正确注入，实际为: "${row4Val}"`);

// 检查第 5 行：1.3  供应商信息：
const row5 = sec1Cn.rows[5];
const row5Val = (row5.cells[1]?.text || '').trim();
assert.equal(row5Val, '', `第 5 行 1.3 供应商信息： 题头值格必须为空，实际为: "${row5Val}"`);

console.log('✓ 中文模板 Section 1 专属插槽分流验证全部通过！');

// ========================================================
// 测试套件 2: 英文模板 Section 1 弹性回退兼容性
// ========================================================
console.log('\n【测试套件 2】英文模板 Section 1 兼容性验证...');
const injectResEn = applyMatchResultToEditor(matchResult, tplEnEngine);
assert(injectResEn.success, '英文模板注入必须成功');

const sec1En = tplEnEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 1);
assert(sec1En, '英文模板必须存在 Section 1 表格');
const enRow1 = sec1En.rows[1];
const enRow1Val = (enRow1.cells[1]?.text || '').trim();
// 英文模板无独立的 Chinese name 行，产品名称应回退注入至 1.1 Product name：
assert(enRow1Val.length > 0, `英文模板无中文名称行时，1.1 Product name： 应接收产品名称，实际为: "${enRow1Val}"`);
console.log('✓ 英文模板 Section 1 兼容性验证通过！');

// ========================================================
// 测试套件 3: 全 16 个 Section 标签与值严格隔离断言
// ========================================================
console.log('\n【测试套件 3】全 16 个 Section 标签与值严格隔离深审计...');

for (let s = 1; s <= 16; s++) {
  const table = tplCnEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === s);
  if (!table) continue;

  for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
    const row = table.rows[rIdx];

    // 1. 验证首列标签没有被覆盖为非标签数据
    if (row.cells.length >= 2) {
      const labelCell = row.cells[0];
      const valCell = row.cells[row.cells.length - 1];

      // 若 labelCell 声明为标签或有冒号，确保其不包含换行长文等值内容
      if (labelCell.kind === 'label-only' || labelCell.labelText) {
        assert(!labelCell.text.includes('聚氨酯分散体 PU-2341E'), `Sec ${s} 第 ${rIdx} 行标签格严禁混入产品全称！`);
        assert(!labelCell.text.includes('喷涂过程中要求有呼吸防护设备'), `Sec ${s} 第 ${rIdx} 行标签格严禁混入防护设备说明！`);
        assert(!labelCell.text.includes('半数致死剂量'), `Sec ${s} 第 ${rIdx} 行标签格严禁混入毒性数据！`);
      }
    }

    // 2. Section 8 专属暴露控制大类题头断言
    if (s === 8 && rIdx === 1) {
      if (row.cells.length > 1) {
        const r1Val = (row.cells[1]?.text || '').trim();
        assert.equal(r1Val, '', `Section 8.1 暴露控制 大类题头值必须为空！实际为: "${r1Val}"`);
      } else {
        assert(row.cells[0].text.includes('8.1') && row.cells[0].text.includes('暴露控制'),
          `Section 8.1 题头文本应保持为大类题头，实际为: "${row.cells[0].text}"`);
      }
    }

    // 3. Section 11 多列嵌套结构断言（急性毒性与生殖毒性）
    if (s === 11 && row.cells.length === 3) {
      const col0 = row.cells[0].text.trim();
      const col1 = row.cells[1].text.trim();
      const col2 = row.cells[2].text.trim();
      if (/急性毒性/i.test(col0)) {
        assert(col1.includes('经口'), `Section 11 急性毒性第2列必须为子标签 "经口："，实际为: "${col1}"`);
        assert(col2.includes('LD50') || col2.includes('2,000') || col2.includes('mg/kg'), `Section 11 急性毒性值必须写入第3列，实际为: "${col2}"`);
      }
      if (/生殖毒性/i.test(col0)) {
        assert(col1.includes('生育力'), `Section 11 生殖毒性第2列必须为子标签 "生育力"，实际为: "${col1}"`);
      }
    }

    // 4. Section 15 结构性子题头断言
    if (s === 15) {
      const cell0Txt = (row.cells[0]?.text || '').trim();
      if (/其它的规定|符合下列法规要求/i.test(cell0Txt)) {
        assert(!cell0Txt.includes('国务院令344号') && !cell0Txt.includes('GB/T 16483'),
          `Section 15 结构性子题头严禁被具体法规条款覆盖！实际为: "${cell0Txt}"`);
      }
    }
  }
}
console.log('✓ 全 16 个 Section 标签与值严格隔离逐行断言全部通过！');

// ========================================================
// 测试套件 4: 自动化多维度质量审计器 (runAutomatedAudits)
// ========================================================
console.log('\n【测试套件 4】运行全局自动化质量审计器...');
const auditRes = runAutomatedAudits(tplCnEngine, matchResult);
if (!auditRes.passed) {
  console.error('全局审计发现的问题:', auditRes.issues);
}
assert(auditRes.passed, `全局质量审计器必须 100% 通过！问题数: ${auditRes.issueCount}`);
console.log('✓ runAutomatedAudits 质量审计全部通过！');

console.log('\n=== 全部专项回归测试 100% 验证通过 ===\n');
