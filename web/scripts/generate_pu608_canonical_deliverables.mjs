import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608';
const userSourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';

async function generatePu608() {
  console.log(`📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...`);
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${userSourcePath}`);
  const sourceBuffer = await fs.readFile(userSourcePath);

  // 1. 确保目标目录存在且清空历史杂件 (符合 G-01 纯净公理)
  await fs.mkdir(targetDir, { recursive: true });
  const existingFiles = await fs.readdir(targetDir);
  for (const f of existingFiles) {
    if (f.includes('源文件留存') || f.includes('副本') || f.includes('手做') || f.includes('匹配') || f.endsWith('.tmp') || f.startsWith('~$')) {
      await fs.unlink(path.join(targetDir, f)).catch(() => {});
      console.log(`>>> [CLEAN] 已清理冗余历史碎片: ${f}`);
    }
  }

  // 2. 启动标准 8 格式流水线生产
  console.log(`🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线...`);
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'PU-608',
    cnGroundTruthPath: userSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'PU-608',
      isHazardous: true
    }
  });

  console.log('>>> [PIPELINE] 流水线执行完成，返回结果:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  if (!result.success || result.deliverables?.length !== 8) {
    throw new Error(`交付物数量异常: 期望 8 项，实得 ${result.deliverables?.length} 项`);
  }

  // 3. 执行双极双层机械终审
  console.log(`🛡️ [MSDS-Studio Phase 11~12] 启动双极双层全景机械深度终审...`);
  const auditRes = await runBipolarBilayerAudit(targetDir, 'PU-608');
  if (!auditRes.success) {
    throw new Error(`【终审拦截】PU-608 交付物双极双层审计失败，存在 ${auditRes.failCount} 项违章！`);
  }

  // 4. 验证目录纯净度 (严格且仅有 8 个物理文件)
  const finalFiles = (await fs.readdir(targetDir)).filter(f => !f.startsWith('.'));
  console.log(`>>> [PURITY] 目标目录实测文件总数: ${finalFiles.length} 个`);
  if (finalFiles.length !== 8) {
    throw new Error(`【G-01 纯净拦截】目标目录文件数异常: 实测 ${finalFiles.length} 项 (必须严格等于 8 项): ${JSON.stringify(finalFiles)}`);
  }

  console.log('>>> [SUCCESS] 🏆 PU-608 标准 8 格式交付物全部受控生成并通过全景机械终审！');
}

generatePu608().catch(err => {
  console.error('>>> [ERROR] 流水线执行失败:', err);
  process.exit(1);
});
