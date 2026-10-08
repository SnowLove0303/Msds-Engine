import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor, cleanSlateTemplate } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== MSDS STUDIO 模板残留清零与零臆造端到端自动化测试 ===\n');

// 1. 验证内嵌初始模板确实包含历史示范幽灵数据（确认为基准对照）
const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const pristineEngine = await loadDocx(tplBuf, 'template.docx');
const pristineText = pristineEngine.records.flatMap((r) => r.rows ? r.rows.flatMap((row) => row.cells.map((c) => c.text)) : [r.text]).join(' ');

assert(pristineText.includes('二乙二醇单丁醚'), '基准断言：原始模板中必须包含示范词二乙二醇单丁醚');
assert(pristineText.includes('成分1'), '基准断言：原始模板中必须包含示范词成分1');
assert(pristineText.includes('3,306'), '基准断言：原始模板中必须包含示范词3,306');
assert(pristineText.includes('六亚甲基-1,6-二异氰酸酯'), '基准断言：原始模板中必须包含示范词六亚甲基-1,6-二异氰酸酯');
console.log('✓ 原始模板基准对照确认完成（内嵌示例数据存在于未清空模板中）');

// 2. 验证 cleanSlateTemplate 独立执行后的彻底清零效果
const cleanTestEngine = await loadDocx(tplBuf, 'template.docx');
cleanSlateTemplate(cleanTestEngine);
const cleanText = cleanTestEngine.records.flatMap((r) => r.rows ? r.rows.flatMap((row) => row.cells.map((c) => c.text)) : [r.text]).join(' ');

assert(!cleanText.includes('二乙二醇单丁醚'), '清零断言：二乙二醇单丁醚必须被清空');
assert(!cleanText.includes('成分1'), '清零断言：成分1必须被清空');
assert(!cleanText.includes('3,306'), '清零断言：3,306必须被清空');
assert(!cleanText.includes('六亚甲基-1,6-二异氰酸酯'), '清零断言：六亚甲基-1,6-二异氰酸酯必须被清空');
assert(!cleanText.includes('蓝鳃太阳鱼'), '清零断言：蓝鳃太阳鱼必须被清空');
console.log('✓ cleanSlateTemplate 独立清零协议测试通过（所有示范残留彻底消除）\n');

// 3. 全量真实样本端到端反向残留排查与真实注入断言
const sampleFiles = [
  {
    name: 'PU-1007 msds_CN 冠志.docx',
    path: 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1007 msds_CN 冠志.docx',
    expectedModel: 'PU-1007',
  },
  {
    name: 'PU-1036 msds_CN 冠志.docx',
    path: 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_CN 冠志.docx',
    expectedModel: 'PU-1036',
  },
  {
    name: 'PU-202A msds_CN 冠志.docx',
    path: 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-202A msds_CN 冠志.docx',
    expectedModel: 'PU-202A',
  },
  {
    name: 'PA-3617 MSDS-CN 国彩.docx',
    path: 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3617 MSDS-CN 国彩.docx',
    expectedModel: 'PA-3617',
  },
  {
    name: 'PA-3615 MSDS（冠志）.docx',
    path: 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3615 MSDS（冠志）.docx',
    expectedModel: 'PA-3615',
  },
];

for (const sample of sampleFiles) {
  try {
    const sBuf = await fs.readFile(sample.path);
    const sEngine = await loadDocx(sBuf, sample.name);
    const tEngine = await loadDocx(tplBuf, 'template.docx');

    const matchResult = runSmartMatching(sEngine.records);
    const injectRes = applyMatchResultToEditor(matchResult, tEngine);

    const fullText = tEngine.records.flatMap((r) => r.rows ? r.rows.flatMap((row) => row.cells.map((c) => c.text)) : [r.text]).join(' ');

    // 严苛反残留断言：绝不能出现模板历史旧示范词
    assert(!fullText.includes('二乙二醇单丁醚'), `${sample.name}: 注入后禁止包含二乙二醇单丁醚`);
    assert(!fullText.includes('成分1'), `${sample.name}: 注入后禁止包含成分1`);
    assert(!fullText.includes('3,306 mg/kg'), `${sample.name}: 注入后禁止包含3,306 mg/kg`);
    assert(!fullText.includes('蓝鳃太阳鱼'), `${sample.name}: 注入后禁止包含蓝鳃太阳鱼`);
    assert(!fullText.includes('六亚甲基-1,6-二异氰酸酯'), `${sample.name}: 注入后禁止包含六亚甲基-1,6-二异氰酸酯`);

    // 真实有效注入断言
    assert(fullText.includes(sample.expectedModel), `${sample.name}: 注入后必须包含真实型号 ${sample.expectedModel}`);
    assert(injectRes.injectedCount >= 50, `${sample.name}: 有效注入字段数必须 >= 50 (实际 ${injectRes.injectedCount})`);

    console.log(`✓ [PASS] ${sample.name} -> 注入字段: ${injectRes.injectedCount}, 剪枝: ${injectRes.prunedCount}, 零幽灵残留`);
  } catch (err) {
    console.error(`✗ [FAIL] ${sample.name}:`, err.message);
    throw err;
  }
}

console.log('\n========================================');
console.log('ALL REGRESSION TESTS PASSED! 模板旧数据残留清零与零臆造验证 100% 达标！');
console.log('========================================\n');
