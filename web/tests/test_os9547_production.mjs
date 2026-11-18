import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import path from 'path';
import { executeEightDeliverablesPipeline } from '../src/pipeline-engine.js';
import { verifyAuditContract, planAuditTargets } from '../src/audit-planner.js';
import { runBipolarBilayerAudit } from '../scripts/audit_bipolar_bilayer.mjs';

const modelCode = 'OS-9547 PGDA80';
const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80';

console.log('=== 执行 OS-9547 PGDA80 标准化全量生成测试 ===\n');

const facts = {
  modelCode,
  productNameEn: 'Water-dispersible isocyanate crosslinker OS-9547 PGDA80',
  chemicalCategoryEn: 'Hydrophilically modified polyisocyanate',
  recommendedUseEn: 'Crosslinker for waterborne 2K polyurethane systems',
  viscosityOverride: '300±100 mPa·s',
  appearanceOverride: '无色至淡黄色透明粘稠液体',
  solidsOverride: '80±2%',
  densityOverride: '约 1.12 g/cm³',
  ncoOverride: '17.8±0.5%',
  section9Overrides: {
    '外观': '无色至淡黄色透明粘稠液体',
    '粘度|动力粘度': '300±100 mPa·s',
    '固体含量|固含': '80±2%',
    '密度': '约 1.12 g/cm³',
    'NCO': '17.8±0.5%'
  }
};

try {
  const res = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: sourceDocxPath,
    targetDir,
    facts
  });

  const deliverables = res?.deliverables || res || [];
  console.log('Pipeline successfully produced files:', deliverables.length);
  for (const r of deliverables) {
    console.log(`  - [${r.format?.toUpperCase() || 'FILE'}] ${r.name} (${r.size} bytes)`);
  }

  // 1. 运行双极双层全景机械深度审计 (强制级别门禁)
  console.log('\n--- 运行双极双层全景机械深度审计 (Mandatory Hard Blocker) ---');
  await runBipolarBilayerAudit(targetDir, modelCode);

  // 2. 运行 G-01 ~ G-40 终审门禁 (含 G-40 末页避免纯空检查)
  console.log('\n--- 运行 G-01 ~ G-40 终审门禁 ---');
  const contract = planAuditTargets(modelCode, facts);
  const auditRes = await verifyAuditContract(targetDir, contract);
  console.log('Audit Success:', auditRes.success);
  console.log('Failure count:', auditRes.failCount);
  if (auditRes.failures.length > 0) {
    console.log('Failures:', JSON.stringify(auditRes.failures, null, 2));
    process.exit(1);
  } else {
    console.log('Passes count:', auditRes.passes.length);
    auditRes.passes.forEach(p => console.log('✓', p));
  }
} catch (err) {
  console.error('Pipeline execution error:', err);
  process.exit(1);
}
