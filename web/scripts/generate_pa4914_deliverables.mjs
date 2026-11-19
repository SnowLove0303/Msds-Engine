import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const {
  executeEightDeliverablesPipeline,
  GHS_H_TO_CATEGORY_EN
} = await import('../src/pipeline-engine.js');

const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
const { auditTranslationDualDisplay } = await import('./audit_translation_dual_display.mjs');

const modelCode = 'PA-4914';
const sourcePath = path.resolve(
  REPO_ROOT,
  '算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx'
);

const targetDir = path.resolve(
  REPO_ROOT,
  '算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914'
);

// 动态扩展导出的 GHS 分类翻译字典 (不修改底层源码)
GHS_H_TO_CATEGORY_EN['H303'] = 'Acute toxicity, Oral (Category 5), H303';
GHS_H_TO_CATEGORY_EN['H305'] = 'Aspiration hazard (Category 2), H305';

function isEnglishContext() {
  const stack = new Error().stack || '';
  return stack.includes('buildBaseEnglishEngine');
}

// 建立全量保真、零遗漏、中英双语自适应的 Section 2 覆写对象
const section2Override = {
  get categories() {
    if (isEnglishContext()) {
      return [
        'Flammable liquid (Category 3), H226',
        'Acute toxicity, Oral (Category 5), H303',
        'Aspiration hazard (Category 2), H305',
        'Skin corrosion/irritation (Category 3), H316',
        'Serious eye damage/eye irritation (Category 2A), H319',
        'Specific target organ toxicity - single exposure (Category 3), H336'
      ];
    }
    return [
      '易燃液体，类别 3（H226）',
      '急性毒性（经口），类别 5（H303）',
      '吸入危险，类别 2（H305）',
      '皮肤腐蚀/刺激，类别 3（H316）',
      '严重眼睛损伤/眼睛刺激性，类别 2A（H319）',
      '特异性靶器官系统毒性 一次接触，类别 3（H336）'
    ];
  },
  hazardousIngredients: '丙二醇甲醚',
  signalWord: '警告',
  get hazardStatements() {
    if (isEnglishContext()) {
      return [
        'H226 Flammable liquid and vapour.',
        'H303 May be harmful if swallowed.',
        'H305 May be harmful if swallowed and enters airways.',
        'H316 Causes mild skin irritation.',
        'H319 Causes serious eye irritation.',
        'H336 May cause drowsiness or dizziness.'
      ];
    }
    return [
      'H226 易燃液体和蒸气。',
      'H303 吞食可能有害。',
      'H305 如果吞食并进入呼吸道可能有害。',
      'H316 造成轻微皮肤刺激。',
      'H319 造成严重眼睛刺激。',
      'H336 可能引起昏睡或眩晕。'
    ];
  },
  get prevention() {
    if (isEnglishContext()) {
      return [
        'P210 Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.',
        'P233 Keep container tightly closed.',
        'P240 Ground and bond container and receiving equipment.',
        'P241 Use explosion-proof electrical/ventilating/lighting equipment.',
        'P242 Use non-sparking tools.',
        'P243 Take action to prevent static discharges.',
        'P261 Avoid breathing dust/fume/gas/mist/vapours/spray.',
        'P264 Wash hands thoroughly after handling.',
        'P271 Use only outdoors or in a well-ventilated area.',
        'P280 Wear protective gloves/clothing/eye protection/face protection.'
      ];
    }
    return [
      'P210 远离热源、热表面、火花、明火及其他点火源。禁止吸烟。',
      'P233 保持容器密闭。',
      'P240 容器和接收设备接地和等电位连接。',
      'P241 使用防爆的电气/通风/照明设备。',
      'P242 只能使用不产生火花的工具。',
      'P243 采取防止静电放电的措施。',
      'P261 避免吸入粉尘/烟/气体/烟雾/蒸气/喷雾。',
      'P264 操作后彻底清洗皮肤和受污染部位。',
      'P271 只能在室外或通风良好处使用。',
      'P280 戴防护手套/穿防护服/戴防护眼罩/戴防护面具。'
    ];
  },
  get response() {
    if (isEnglishContext()) {
      return [
        'P301+P310 IF SWALLOWED: Immediately call a POISON CENTER or doctor/physician.',
        'P331 Do NOT induce vomiting.',
        'P303+P361+P353 IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water [or shower].',
        'P304+P340 IF INHALED: Remove person to fresh air and keep comfortable for breathing.',
        'P305+P351+P338 IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.',
        'P312 Call a POISON CENTER/doctor if you feel unwell.',
        'P332+P313 If skin irritation occurs: Get medical advice/attention.',
        'P337+P313 If eye irritation persists: Get medical advice/attention.',
        'P370+P378 In case of fire: Use foam, dry powder or carbon dioxide to extinguish.'
      ];
    }
    return [
      'P301+P310 如误吞咽：立即呼叫解毒中心或医生。',
      'P331 禁止催吐。',
      'P303+P361+P353 如皮肤沾染：立即脱去所有沾染的衣物。用水清洗皮肤/淋浴。',
      'P304+P340 如误吸入：将人员转移至空气新鲜处，保持呼吸舒适的休息姿势。',
      'P305+P351+P338 如进入眼睛：用水小心冲洗几分钟。如戴隐形眼镜并可方便地取出，取出隐形眼镜。继续冲洗。',
      'P312 如感觉不适，呼叫解毒中心或医生。',
      'P332+P313 如发生皮肤刺激：求医/就诊。',
      'P337+P313 如眼睛刺激持续：求医/就诊。',
      'P370+P378 火灾时：使用干砂、干粉或抗溶性泡沫灭火。'
    ];
  },
  get storage() {
    if (isEnglishContext()) {
      return [
        'P403+P233 Store in a well-ventilated place. Keep container tightly closed.',
        'P403+P235 Store in a well-ventilated place. Keep cool.',
        'P405 Store locked up.'
      ];
    }
    return [
      'P403+P233 存放在通风良好的地方。保持容器密闭。',
      'P403+P235 存放在通风良好的地方。保持低温。',
      'P405 加锁存放。'
    ];
  },
  get disposal() {
    if (isEnglishContext()) {
      return [
        'P501 Dispose of contents/container to an approved waste disposal plant.'
      ];
    }
    return [
      'P501 将内容物/容器交由有资质的经批准的危险废物处理厂处置。'
    ];
  },
  otherHazards: '2.5 其他危害：无适用资料。'
};

const toxicologyTableRows = [
  { cells: ['该产品无可用的毒理学研究。'] },
  { cells: ['类似产品的风险评估数据：'] },
  { cells: ['11.1  急性毒性：', '无数据'] },
  { cells: ['11.2  主要皮肤刺激性：', '轻微刺激'] },
  { cells: ['11.3  主要粘膜刺激性：', '轻微刺激'] },
  { cells: ['11.4  致敏性：', '无数据'] },
  { cells: ['11.5  致突变性：', '无数据'] }
];

async function main() {
  console.log(`============================================================`);
  console.log(`🚀 [MSDS-Studio] 启动 PA-4914 全量保真、零遗漏八格式标准交付物生产流程`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 源文件路径: ${sourcePath}`);
  console.log(`   • 交付目录: ${targetDir}`);
  console.log(`============================================================\n`);

  if (!fsSync.existsSync(sourcePath)) {
    console.error(`❌ 源文件不存在: ${sourcePath}`);
    process.exit(1);
  }

  await fs.mkdir(targetDir, { recursive: true });

  const sourceBuffer = await fs.readFile(sourcePath);

  console.log(`>>> [PIPELINE] 启动标准 8 格式流水线覆写生产...`);
  const result = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode,
      productName: '水溶性羟基丙烯酸树脂',
      productNameEn: 'Water-soluble hydroxy acrylic resin',
      chemicalClassification: '丙烯酸聚合物',
      chemicalClassificationEn: 'Acrylic polymer',
      isHazardous: true,
      isDangerousGoods: true,
      signalWord: '警告',
      components: [
        { name: '丙烯酸树脂', cas: '商业机密', conc: '48~52' },
        { name: '丙二醇甲醚', cas: '107-98-2', conc: '44~48' },
        { name: 'N,N-二甲基乙醇胺', cas: '108-01-0', conc: '1~3' }
      ],
      enComponents: [
        { name: 'Acrylic resin', cas: 'Trade secret', conc: '48~52' },
        { name: 'Propylene glycol monomethyl ether', cas: '107-98-2', conc: '44~48' },
        { name: 'N,N-Dimethylethanolamine', cas: '108-01-0', conc: '1~3' }
      ],
      appearanceOverride: '透明液体',
      appearanceEn: 'Transparent liquid',
      section2Override,
      toxicologyTableRows,
      section9Overrides: {
        '外观': '透明液体',
        '气味': '无数据',
        '嗅觉阀值': '无数据',
        '嗅觉阈值': '无数据',
        'PH值': '6-9',
        'pH值': '6-9',
        '离子性': '阴离子',
        '初沸点': '约120℃',
        '闪点': '约40℃',
        '蒸发速率': '无数据',
        '可燃性': '不适用',
        '可燃性（固态、气态）': '不适用',
        '燃烧值': '无数据',
        '相对蒸气密度': '无数据',
        '水溶性': '完全混溶',
        '表面张力': '无数据',
        '自燃温度': '无数据',
        '引燃温度': '约278℃',
        '动力粘度': '＜10000 mPa.s',
        '固体含量': '50±2%',
        '分解温度': '无数据',
        '爆炸特性': '无数据',
        '粉尘爆炸级别': '不适用',
        '其他信息': '上述数据非产品指标，产品指标请参见产品技术信息表。'
      }
    }
  });

  console.log('\n>>> [PIPELINE] 流水线底层生产完成:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  // 严格核验 MSDS 交付物数量为 8
  const files = (await fs.readdir(targetDir)).filter(f => /msds.*(?:冠志|国彩|guanzhi|guocai)/i.test(f) && (f.endsWith('.docx') || f.endsWith('.pdf')));
  console.log(`>>> [DELIVERY] 目标目录实测 MSDS 交付物总数: ${files.length} 个`);
  if (files.length !== 8) {
    throw new Error(`MSDS 交付物数量异常: 实测 ${files.length} 个 (期望 8 个)`);
  }

  // 启动双极双层法医级全景深度终审
  console.log(`🛡️ [MSDS-Studio Phase 11~12] 启动双极双层全景法医级深度终审...`);
  const auditRes = await runBipolarBilayerAudit(targetDir, modelCode);
  if (!auditRes.success) {
    throw new Error(`【终审拦截】PA-4914 双极双层深度审计未通过，存在 ${auditRes.failCount} 项违章！`);
  }

  // 启动逐句逐行双语对照终审
  console.log(`\n🔍 [MSDS-Studio Phase 12] 启动中英逐句双重对照法医检视...`);
  const transRes = await auditTranslationDualDisplay(
    path.join(targetDir, `${modelCode} msds_CN 冠志.docx`),
    path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`)
  );
  if (transRes.alarms > 0) {
    throw new Error(`【终审拦截】PA-4914 中英逐句对照检视发现 ${transRes.alarms} 项致命报警！`);
  }

  console.log(`\n🎉 [SUCCESS] 🏆 PA-4914 全量保真、零遗漏标准 8 格式交付物全量生成并 100% 满分通过法医级深度终审，退出码 0！`);
}

main().catch(err => {
  console.error('\n❌ [MSDS-Studio FATAL ERROR]:', err);
  process.exit(1);
});
