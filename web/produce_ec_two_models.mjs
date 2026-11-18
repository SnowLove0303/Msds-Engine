import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { executeEightDeliverablesPipeline } from './src/pipeline-engine.js';
import { runMasterMsdsAudit } from './scripts/run_master_msds_audit.mjs';

const SOURCE_BASE_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC';
const TARGET_BASE_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC';

const MODELS_CONFIG = [
  {
    modelCode: 'EC-1802',
    viscosity: '3000-30000 mPa.s'
  },
  {
    modelCode: 'EC-1803',
    viscosity: '3000-30000 mPa.s'
  }
];

async function runAll() {
  console.log('========================================================================');
  console.log('     MSDS Studio 工业级全量覆写批处理流水线：水性环氧固化剂 EC-1802 & EC-1803    ');
  console.log('========================================================================\n');

  const auditResults = [];

  for (const cfg of MODELS_CONFIG) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`>>> 开始生产型号: ${cfg.modelCode}`);
    console.log(`------------------------------------------------------------------------`);

    const sourceDir = path.join(SOURCE_BASE_DIR, cfg.modelCode);
    const targetDir = path.join(TARGET_BASE_DIR, cfg.modelCode);
    await fs.promises.mkdir(sourceDir, { recursive: true });
    await fs.promises.mkdir(targetDir, { recursive: true });

    const sourceDocxPath = path.join(sourceDir, `${cfg.modelCode} msds_CN 冠志.docx`);
    const backupDocxPath = path.join(sourceDir, `${cfg.modelCode} msds_CN 冠志_源文件留存.docx`);
    if (!fs.existsSync(backupDocxPath) && fs.existsSync(sourceDocxPath)) {
      await fs.promises.copyFile(sourceDocxPath, backupDocxPath);
      console.log(`[Backup] 成功保留源文件母本留存: ${backupDocxPath}`);
    }

    // 调用受控流水线生成 8 份标准交付物 (4 DOCX + 4 PDF)
    console.log(`[Pipeline] 启动受控八交付物流水线: ${cfg.modelCode}`);
    const pipelineRes = await executeEightDeliverablesPipeline({
      modelCode: cfg.modelCode,
      cnGroundTruthPath: sourceDocxPath,
      targetDir: targetDir,
      facts: {
        viscosityOverride: cfg.viscosity
      }
    });

    console.log(`[Pipeline] 交付物派生完毕, 生成数量: ${pipelineRes?.length || 0}`);

    // 运行集中式中央主审计套件 (runMasterMsdsAudit)
    console.log(`[MasterAudit] 对 ${cfg.modelCode} 运行中央主审计套件 135 项物理断言...`);
    const auditRes = await runMasterMsdsAudit({
      model: cfg.modelCode,
      targetDir: targetDir,
      sourceDocx: sourceDocxPath
    });

    auditResults.push({
      model: cfg.modelCode,
      success: auditRes.success,
      total: auditRes.totalAssertions,
      passed: auditRes.passCount + auditRes.whitelistPassCount,
      failed: auditRes.failCount
    });
  }

  console.log('\n========================================================================');
  console.log('                     EC-1802 & EC-1803 覆写与主审计汇总                       ');
  console.log('========================================================================');
  console.table(auditResults);

  const allPassed = auditResults.every(r => r.success);
  if (allPassed) {
    console.log('\n🎉🎉🎉 EC-1802 & EC-1803 100% 满分通过主审计套件验证！0 缺陷！🎉🎉🎉\n');
  } else {
    console.error('\n❌ 部分型号未通过主审计，请检查详细日志！\n');
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal batch execution error:', err);
  process.exit(1);
});
