import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runMasterMsdsAudit } = await import('./run_master_msds_audit.mjs');

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8123';
const userSourcePath = 'E:/冠志/TDS MSDS (2)/待处理文件/BL-8123/中文版/BL-8123 msds_CN 冠志.docx';

async function generateBl8123() {
  console.log(`📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...`);
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${userSourcePath}`);
  const sourceBuffer = await fs.readFile(userSourcePath);

  // 1. 确保目标目录存在
  await fs.mkdir(targetDir, { recursive: true });

  // 2. 启动标准 8 格式流水线生产
  console.log(`🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线 (BL-8123)...`);
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'BL-8123',
    cnGroundTruthPath: userSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'BL-8123',
      isHazardous: false,
      isNonHazardousComposite: true
    }
  });

  console.log('>>> [PIPELINE] 流水线执行完成，返回结果:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  // 3. 执行全量主审计套件自检 (136 项断言)
  console.log(`\n🛡️ [MSDS-Studio Phase 11] 启动集中式中央主审计套件自检...`);
  const auditRes = await runMasterMsdsAudit({
    model: 'BL-8123',
    targetDir,
    sourceDocx: userSourcePath
  });

  if (!auditRes.success) {
    throw new Error(`主审计套件未通过: 存在 ${auditRes.failCount} 项真实缺陷！`);
  }

  console.log('\n🎉 BL-8123 8 份标准交付物重新编译并 100% 审计通过！');
}

generateBl8123().catch(err => {
  console.error('❌ Generation / Audit failed:', err);
  process.exit(1);
});
