import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A';
const userSourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx';

async function generatePu202a() {
  console.log(`>>> [PIPELINE] 读取源文件: ${userSourcePath}`);
  const sourceBuffer = await fs.readFile(userSourcePath);

  // 1. 清理历史遗留及备份碎片，严禁残留 _源文件留存 或 (最新) 等冗余文件 (遵守 G-01 纯净公理)
  const existingFiles = await fs.readdir(targetDir);
  for (const f of existingFiles) {
    if (f.includes('源文件留存') || f.includes('副本') || f.includes('手做') || f.includes('匹配') || f.endsWith('.tmp') || f.startsWith('~$')) {
      await fs.unlink(path.join(targetDir, f)).catch(() => {});
      console.log(`>>> [CLEAN] 已彻底清理冗余碎片: ${f}`);
    }
  }

  // 2. 启动标准 8 格式流水线生产 (PU-202A 通栏规范驱动)
  console.log(`>>> [PIPELINE] 启动标准 8 格式流水线生产 (Section 2 & 11 全通栏)...`);
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'PU-202A',
    cnGroundTruthPath: userSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'PU-202A',
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
  console.log('>>> [AUDIT] 启动双极双层深度审计...');
  const auditRes = await runBipolarBilayerAudit(targetDir, 'PU-202A');
  if (!auditRes.success) {
    throw new Error(`【终审拦截】PU-202A 交付物双极双层审计失败，存在 ${auditRes.failCount} 项违章！`);
  }

  // 4. 验证目录纯净度 (严格且仅有 8 个物理文件)
  const finalFiles = (await fs.readdir(targetDir)).filter(f => !f.startsWith('.'));
  console.log(`>>> [PURITY] 目标目录实测文件总数: ${finalFiles.length} 个`);
  if (finalFiles.length !== 8) {
    throw new Error(`【G-01 纯净拦截】目标目录文件数异常: 实测 ${finalFiles.length} 项 (必须严格等于 8 项): ${JSON.stringify(finalFiles)}`);
  }

  console.log('>>> [SUCCESS] 🎉 PU-202A 8 格式标准通栏交付物全部成功生成并通过机械终审！');
}

generatePu202a().catch(err => {
  console.error('>>> [ERROR] 流水线执行失败:', err);
  process.exit(1);
});
