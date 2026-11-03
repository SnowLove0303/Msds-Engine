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

// 1. 基于 2-丁氧基乙醇 (CAS: 111-76-2) 国际权威数据库全维扩充 Section 2
const section2Override = {
  categories: [
    '急性毒性（经口），类别 4（H302）',
    '急性毒性（经皮），类别 4（H312）',
    '急性毒性（吸入），类别 4（H332）',
    '皮肤腐蚀/刺激，类别 2（H315）',
    '严重眼睛损伤/眼睛刺激性，类别 2A（H319）',
    '对水环境有慢性危害，类别 3（H412）'
  ],
  hazardousIngredients: '2-丁氧基乙醇',
  signalWord: '警告',
  hazardStatements: [
    'H302 吞咽有害。',
    'H312 皮肤接触有害。',
    'H332 吸入有害。',
    'H315 造成皮肤刺激。',
    'H319 造成严重眼睛刺激。',
    'H412 对水生生物有害并具有长期持续影响。'
  ],
  prevention: [
    'P261 避免吸入粉尘/烟/气体/烟雾/蒸气/喷雾。',
    'P264 操作后彻底清洗皮肤和受污染部位。',
    'P270 使用本品时不得进食、饮水或吸烟。',
    'P271 只能在室外或通风良好处使用。',
    'P273 避免释放到环境中。',
    'P280 戴防护手套/穿防护服/戴防护眼罩/戴防护面具。'
  ],
  response: [
    'P301+P312+P330 如误吞咽：如感觉不适，呼救解毒中心或医生；彻底漱口。',
    'P302+P352 如皮肤沾染：用大量肥皂和水清洗。',
    'P304+P340+P312 如误吸入：将人员转移至空气新鲜处，保持呼吸舒适的休息姿势；如感觉不适，呼救解毒中心或医生。',
    'P305+P351+P338 如进入眼睛：用水小心冲洗几分钟。如戴隐形眼镜并可方便地取出，取出隐形眼镜。继续冲洗。',
    'P332+P313 如发生皮肤刺激：求医/就诊。',
    'P337+P313 如眼睛刺激持续：求医/就诊。',
    'P362+P364 脱去污染的衣服，清洗后方可重新使用。'
  ],
  storage: [
    'P403+P233 存放在通风良好的地方。保持容器密闭。'
  ],
  disposal: [
    'P501 将内容物/容器交由有资质的经批准的危险废物处理厂处置。'
  ],
  otherHazards: '2.3 其他危险：无适用资料。'
};

// 2. 对齐 PU-608 规范升级 Section 11 为 15 行结构化端点插槽表格 (Paradigm 2)
const toxicologyTableRows = [
  { cells: ['该产品无可用的毒理学研究。'] },
  { cells: ['以下为2-丁氧基乙醇（CAS号：111-76-2）的毒理学参考数据：'] },
  { cells: ['11.1  急性毒性：', '经口：', '半数致死剂量（LD50）/大鼠：1,746 mg/kg。'] },
  { cells: ['吸入：', '半数致死浓度（LC50）/4 h/大鼠：＞2.2 mg/L（蒸气）。'] },
  { cells: ['经皮：', '半数致死剂量（LD50）/兔：＞2,000 mg/kg。'] },
  { cells: ['11.2  主要皮肤刺激性：', '物种：兔子\n分类：刺激皮肤\n结果：造成皮肤刺激'] },
  { cells: ['11.3  主要眼睛刺激性：', '物种：兔子\n分类：刺激眼睛\n结果：严重的眼睛刺激'] },
  { cells: ['11.4  致敏性：', '物种：豚鼠\n分类：不是皮肤过敏物质\n结果：未引起实验室动物过敏'] },
  { cells: ['11.5  致突变性：', '在 Ames 试验中未见致突变影响。体外染色体畸变试验阴性。'] },
  { cells: ['11.6  致癌性：', '国际癌症研究机构（IARC）归为第 3 类（对人类致癌性尚不能分类）。动物试验未见致癌影响。'] },
  { cells: ['11.7  生殖毒性：', '生育力：', '动物试验未见对生育力的损害风险。'] },
  { cells: ['致畸形：', '动物试验未见特异性致畸效应。'] },
  { cells: ['11.8  特异性靶器官系统毒性（一次接触/反复接触）：', '可能造成呼吸道刺激，可能引起昏睡或眩晕。反复接触可见红细胞溶血及继发性肝肾影响。'] },
  { cells: ['11.9  吸入危险：', '无数据资料。'] },
  { cells: ['11.10 附加信息：', '2-丁氧基乙醇有经皮吸收危险。'] }
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
      section2Override,
      toxicologyTableRows
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
