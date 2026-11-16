import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { translateSection9Item } from '../src/pipeline-engine.js';
import { translateChemicalTerm } from '../src/context-governor.js';
import { auditTranslationDualDisplay } from '../scripts/audit_translation_dual_display.mjs';

console.log('========================================================================');
console.log('       翻译底层执行写入与机械审计逐行双重视图全套测试 (REQ-01, REQ-04)   ');
console.log('========================================================================\n');

// 1. 测试 Section 9.3 pH 稀释条件转译 (P01 根治)
console.log('[TEST 1] Section 9.3 pH 稀释条件完整性断言:');
{
  const res1 = translateSection9Item('9.3', 'pH 值', '7-9（按 1:10 的比例用水稀释）');
  console.log('  ↳ 7-9（按 1:10 的比例用水稀释） ->', res1);
  assert.equal(res1.enLabel, 'pH value:');
  assert.ok(res1.enVal.includes('diluted with water at a ratio of 1:10'), `Expected dilution condition in enVal: ${res1.enVal}`);
  assert.ok(res1.enVal.startsWith('7-9'), `Expected 7-9 prefix: ${res1.enVal}`);

  const res2 = translateSection9Item('9.3', 'pH 值', '7-9 （1%水溶液）');
  console.log('  ↳ 7-9 （1%水溶液） ->', res2);
  assert.equal(res2.enLabel, 'pH value:');
  assert.ok(res2.enVal.includes('1% aqueous solution'), `Expected 1% aqueous solution: ${res2.enVal}`);

  const res3 = translateSection9Item('9.3', 'pH 值（1%水溶液）：', '7.0-9.0');
  console.log('  ↳ pH 值（1%水溶液）： 7.0-9.0 ->', res3);
  assert.equal(res3.enLabel, 'pH value:');
  assert.ok(res3.enVal.includes('1% aqueous solution'), `Expected 1% aqueous solution from label: ${res3.enVal}`);

  const res4 = translateSection9Item('9.3', 'pH 值', '7.0-9.0');
  console.log('  ↳ 7.0-9.0 ->', res4);
  assert.equal(res4.enLabel, 'pH value:');
  assert.equal(res4.enVal, '7.0-9.0');
  console.log('  ✅ [PASS] pH 条件转译全覆盖且条件 100% 忠实保留\n');
}

// 2. 测试 Section 9.11 相对密度 vs 密度
console.log('[TEST 2] Section 9.11 相对密度标签与数值单位断言:');
{
  const res1 = translateSection9Item('9.11', '相对密度', '约 1.06 g/cm3');
  console.log('  ↳ 相对密度：约 1.06 g/cm3 ->', res1);
  assert.equal(res1.enLabel, 'Relative density:');
  assert.equal(res1.enVal, 'Approx. 1.06 g/cm³');

  const res2 = translateSection9Item('9.11', '密度', '约 1.06 g/cm3');
  console.log('  ↳ 密度：约 1.06 g/cm3 ->', res2);
  assert.equal(res2.enLabel, 'Density:');
  assert.equal(res2.enVal, 'Approx. 1.06 g/cm³');
  console.log('  ✅ [PASS] 相对密度与密度规范区分\n');
}

// 3. 测试 Section 3.2 化学品规范名 (P03 根治)
console.log('[TEST 3] Section 3.2 化学品规范英文名统一断言 (N,N-Dimethylethanolamine):');
{
  const dmae1 = translateChemicalTerm('N,N-二甲基乙醇胺');
  console.log('  ↳ N,N-二甲基乙醇胺 ->', dmae1);
  assert.equal(dmae1, 'N,N-Dimethylethanolamine');

  const dmae2 = translateChemicalTerm('二甲基乙醇胺');
  console.log('  ↳ 二甲基乙醇胺 ->', dmae2);
  assert.equal(dmae2, 'N,N-Dimethylethanolamine');

  const dmae3 = translateChemicalTerm('7-9 （按1:10的比例用水稀释）');
  console.log('  ↳ 7-9 （按1:10的比例用水稀释） ->', dmae3);
  assert.ok(dmae3.includes('diluted with water at a ratio of 1:10'));
  console.log('  ✅ [PASS] 化学品名称与稀释短语标准化映射 100% 满分\n');
}

// 4. 测试变异反欺诈与告警熔断门禁 (Mutation Sanity Gate)
console.log('[TEST 4] 变异反欺诈与告警熔断门禁验证:');
{
  // 模拟对 PA-3615 历史交付物的审计，必须准确报警 1 处未转译水溶液条件的漏译！
  const pa3615Cn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3615/PA-3615 msds_CN 冠志.docx';
  const pa3615En = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3615/PA-3615 msds_EN Guanzhi.docx';

  if (fs.existsSync(pa3615Cn) && fs.existsSync(pa3615En)) {
    const summary = await auditTranslationDualDisplay(pa3615Cn, pa3615En, { silent: true });
    console.log('  ↳ 对历史 PA-3615 产出物实测:');
    console.log(`    总核验条目: ${summary.totalRowsAudited}, 满分通过: ${summary.passed}, 报警项数: ${summary.alarms}`);
    // 历史产出物中 Section 9.3 遗漏了 1%水溶液 条件，机械审计必须能精准捕获报警并返回 exitCode == 1
    assert.equal(summary.alarms, 1, '必须精准捕获 1 处历史未修复的条件漏译缺陷！');
    assert.equal(summary.exitCode, 1, '存在漏译告警时 exitCode 必须等于 1 (熔断门禁生效)！');
    console.log('  ✅ [PASS] 变异反欺诈熔断门禁生效：成功拦截条件漏译缺陷！\n');
  } else {
    console.log('  ⚠️ 跳过历史文件核验 (文件不存在)\n');
  }
}

console.log('========================================================================');
console.log('🏆 [ALL TESTS PASSED] 翻译底层执行写入与机械审计逐行双重对照测试全部满分通过！');
console.log('========================================================================');
