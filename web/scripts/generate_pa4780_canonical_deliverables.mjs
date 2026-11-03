import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4780';
const userSourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4780/PA-4780 msds_CN 冠志.docx';

const detailParagraphsCn = [
  '乙二醇丁醚（2-丁氧基乙醇）：\n急性毒性：经口（大鼠）LD50：＞2000 mg/kg；经皮（大鼠/兔）LD50：＞2000 mg/kg；吸入（大鼠）LC50：＞2.2 mg/l/4h\n皮肤刺激：造成皮肤刺激\n眼睛刺激：造成严重的眼睛刺激\n致敏性：皮肤接触无致敏性\n致突变性：在AMES试验中无致突变性。',
  '环氧改性丙烯酸聚合物：\n急性毒性：经口（大鼠）LD50：＞5000 mg/kg\n皮肤刺激：无刺激\n致敏性：无致敏性。'
];

const detailParagraphsEn = [
  '2-Butoxyethanol (Ethylene glycol monobutyl ether):\nAcute toxicity: Oral (rat) LD50: > 2,000 mg/kg; Dermal (rat/rabbit) LD50: > 2,000 mg/kg; Inhalation (rat) LC50: > 2.2 mg/l/4h\nSkin irritation: Causes skin irritation\nEye irritation: Causes serious eye irritation\nSensitization: Not sensitizing to skin\nMutagenicity: Ames test negative.',
  'Epoxy modified acrylic polymer:\nAcute toxicity: Oral (rat) LD50: > 5,000 mg/kg\nSkin irritation: Non-irritating\nSensitization: Non-sensitizing.'
];

async function generatePa4780() {
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
    modelCode: 'PA-4780',
    cnGroundTruthPath: userSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'PA-4780',
      isHazardous: true,
      detailParagraphs: detailParagraphsCn,
      detailParagraphsEn: detailParagraphsEn
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
  const auditRes = await runBipolarBilayerAudit(targetDir, 'PA-4780');
  if (!auditRes.success) {
    throw new Error(`【终审拦截】PA-4780 交付物双极双层审计失败，存在 ${auditRes.failCount} 项违章！`);
  }

  // 4. 验证目录纯净度 (严格且仅有 8 个物理文件)
  const finalFiles = (await fs.readdir(targetDir)).filter(f => !f.startsWith('.'));
  console.log(`>>> [PURITY] 目标目录实测文件总数: ${finalFiles.length} 个`);
  if (finalFiles.length !== 8) {
    throw new Error(`【G-01 纯净拦截】目标目录文件数异常: 实测 ${finalFiles.length} 项 (必须严格等于 8 项): ${JSON.stringify(finalFiles)}`);
  }

  console.log('>>> [SUCCESS] 🏆 PA-4780 标准 8 格式交付物全部受控生成并通过全景机械终审！');
}

generatePa4780().catch(err => {
  console.error('>>> [ERROR] 流水线执行失败:', err);
  process.exit(1);
});
