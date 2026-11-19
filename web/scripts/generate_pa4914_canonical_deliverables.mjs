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
  buildBaseChineseEngine,
  buildBaseEnglishEngine,
  enforceStructuralTypographyInvariants,
  enforceGlobalLeftAlignmentAndCleanIndent,
  assertDeliverableQuality,
  standardizeEnglishTypographyAndLabels,
  assertZeroChinese,
  GHS_H_TO_CATEGORY_EN
} = await import('../src/pipeline-engine.js');

const {
  loadDocx,
  addRowAfter,
  deleteRow,
  writeCellValue,
  updateHeaderFooterData,
  enforceTableStandardBorders,
  enableCrossPageBreaksForAllSections,
  renumberRecord
} = await import('../src/docx-engine.js');

const {
  bindEntityPresetToDocument,
  applyGlobalTypographyProjection
} = await import('../src/universal-editor-primitives.js');

const { getPresetById } = await import('../src/msds-db.js');
const { convertBatchDocxToPdf } = await import('../src/pdf-converter.js');
const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
const { auditTranslationDualDisplay } = await import('./audit_translation_dual_display.mjs');

const modelCode = 'PA-4914';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx';
const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

// 动态扩展导出的 GHS 分类英译字典
GHS_H_TO_CATEGORY_EN['H303'] = 'Acute toxicity, Oral (Category 5), H303';
GHS_H_TO_CATEGORY_EN['H305'] = 'Aspiration hazard (Category 2), H305';

function isEnglishContext() {
  const stack = new Error().stack || '';
  return stack.includes('buildBaseEnglishEngine');
}

// 建立全量保真、中英双语自适应的 Section 2 覆写对象
const section2Override = {
  get categories() {
    if (isEnglishContext()) {
      return [
        'Flammable liquid (Category 3), H226.',
        'Acute toxicity, Oral (Category 5), H303.',
        'Aspiration hazard (Category 2), H305.',
        'Acute toxicity, Inhalation (Category 3).',
        'Skin corrosion/irritation (Category 3), H316.',
        'Serious eye damage/eye irritation (Category 2A), H319.',
        'Specific target organ toxicity - single exposure (Category 3), H336.'
      ];
    }
    return [
      '易燃液体，类别 3（H226）',
      '急性毒性（经口），类别 5（H303）',
      '吸入危险，类别 2（H305）',
      '急性毒性（吸入），类别 3',
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

function compactSection2Spacing(eng) {
  const s2 = eng.records.find(r => r.sectionNumber === 2);
  if (!s2 || !s2.rows) return;

  for (let rIdx = 1; rIdx < s2.rows.length; rIdx++) {
    const row = s2.rows[rIdx];
    if (!row.node) continue;

    const tcPr = row.node.getElementsByTagNameNS(W_NS, 'tcPr')[0];
    if (tcPr) {
      let tcMar = tcPr.getElementsByTagNameNS(W_NS, 'tcMar')[0];
      if (!tcMar) {
        tcMar = row.node.ownerDocument.createElementNS(W_NS, 'w:tcMar');
        tcPr.appendChild(tcMar);
      }
      let top = tcMar.getElementsByTagNameNS(W_NS, 'top')[0];
      if (!top) {
        top = row.node.ownerDocument.createElementNS(W_NS, 'w:top');
        tcMar.appendChild(top);
      }
      top.setAttributeNS(W_NS, 'w:w', '60');
      top.setAttributeNS(W_NS, 'w:type', 'dxa');

      let bottom = tcMar.getElementsByTagNameNS(W_NS, 'bottom')[0];
      if (!bottom) {
        bottom = row.node.ownerDocument.createElementNS(W_NS, 'w:bottom');
        tcMar.appendChild(bottom);
      }
      bottom.setAttributeNS(W_NS, 'w:w', '60');
      bottom.setAttributeNS(W_NS, 'w:type', 'dxa');
    }

    const ps = Array.from(row.node.getElementsByTagNameNS(W_NS, 'p'));
    for (const p of ps) {
      const text = (p.textContent || '').trim();
      if (/^(?:2\.[2-9]|(?:2\.\d+\s*)?(?:(?:GHS\s*)?标签要素|Label elements|GHS Label Elements|危险性说明|Hazard statements?|防范说明|Precautionary statements?|其他危害|其他危险|Other\s*Hazards?))/i.test(text)) {
        let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
        if (!pPr) {
          pPr = row.node.ownerDocument.createElementNS(W_NS, 'w:pPr');
          p.insertBefore(pPr, p.firstChild);
        }
        let spacing = pPr.getElementsByTagNameNS(W_NS, 'spacing')[0];
        if (!spacing) {
          spacing = row.node.ownerDocument.createElementNS(W_NS, 'w:spacing');
          pPr.appendChild(spacing);
        }
        spacing.setAttributeNS(W_NS, 'w:before', '100');
      }
    }
  }
}

function sanitizeClonedRow(row) {
  for (const c of row.cells) {
    c.editable = true;
    c.role = 'value';
    const p = c.node.getElementsByTagNameNS(W_NS, 'p')[0];
    if (p) {
      const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
      for (const r of runs) p.removeChild(r);
    }
  }
}

async function main() {
  console.log('========================================================================');
  console.log(`  PA-4914 正统 MSDS-Studio 7 阶流水线规范生产 (Canonical 7-Step Pipeline)`);
  console.log(`  源文件: ${sourcePath}`);
  console.log(`  目标目录: ${targetDir}`);
  console.log('========================================================================\n');

  if (!fsSync.existsSync(sourcePath)) {
    throw new Error(`源文件不存在: ${sourcePath}`);
  }
  await fs.mkdir(targetDir, { recursive: true });

  const srcBuf = await fs.readFile(sourcePath);
  const facts = {
    modelCode,
    isHazardous: true,
    isDangerousGoods: true,
    productName: '水溶性羟基丙烯酸树脂',
    productNameEn: 'Water-soluble hydroxy acrylic resin PA-4914',
    chemicalClassification: '丙烯酸聚合物',
    chemicalCategory: '丙烯酸聚合物',
    chemicalCategoryEn: 'Acrylic polymer.',
    categoryEn: 'Acrylic polymer.',
    appearanceOverride: '微黄色透明液体',
    appearanceEn: 'Yellowish transparent liquid.',
    dangerousGoods: {
      unNumber: '1866',
      properShippingNameCn: '树脂溶液，易燃',
      properShippingNameEn: 'RESIN SOLUTION, flammable',
      hazardClass: '3',
      packingGroup: 'III'
    },
    section2Override,
    toxicologyTableRows,
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
    section9Overrides: {
      '外观': '微黄色透明液体',
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
  };

  // 1. 建立中文基准引擎 (Step 1)
  console.log('>>> [Step 1] 建立中文基准引擎 (Base Chinese Engine)...');
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode,
    sourceDocxBuffer: srcBuf,
    facts
  });

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine._adaptiveRevisionDate || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2023') || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2024') || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveDate = !isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr;

  // 2. 规范强化与防污染治理 (Step 2)
  console.log('>>> [Step 2] 规范强化治理 (Section 1 / Section 8 / Section 9)...');
  
  // Section 1: 中文化学品分类补齐
  const s1Cn = baseCnEngine.records.find(r => r.sectionNumber === 1);
  if (s1Cn && s1Cn.rows.length >= 4) {
    for (const r of s1Cn.rows) {
      if (/化学品分类|产品类别/i.test(r.cells[0]?.text || '')) {
        writeCellValue(r.cells[1], '丙烯酸聚合物');
      }
    }
  }

  // Section 8: 工程控制与用户核心指定的 2 行 ACGIH 限值
  let s8Cn = baseCnEngine.records.find(r => r.sectionNumber === 8);
  if (s8Cn) {
    // 8.2 工程控制标准条文
    const engRowCn = s8Cn.rows.find(r => /工程控制/i.test(r.cells[0]?.text || ''));
    if (engRowCn && engRowCn.cells.length > 1) {
      engRowCn.cells[1].editable = true;
      writeCellValue(engRowCn.cells[1], '使用局部排风或全面通风，保持工作场所空气中浓度低于职业接触限值；工作场所设置洗眼器与安全淋浴设施。');
    }

    // 组分控制参数：清理可能残留的悬空行，恢复法定 14 行基准（第 0~13 行保留）
    while (s8Cn.rows.length > 14) {
      s8Cn = deleteRow(baseCnEngine, s8Cn, s8Cn.rows.length - 1);
    }

    // 利用 docx-engine 原语 addRowAfter 克隆第 13 行（物质/依据/类型/数值 4 列表头）
    // 注入 Row 14: 丙二醇甲醚 ACGIH TLVTN 100ppm,606 mg/m3
    s8Cn = addRowAfter(baseCnEngine, s8Cn, 13);
    const r14Cn = s8Cn.rows[14];
    sanitizeClonedRow(r14Cn);
    writeCellValue(r14Cn.cells[0], '丙二醇甲醚');
    writeCellValue(r14Cn.cells[1], 'ACGIH');
    writeCellValue(r14Cn.cells[2], 'TLVTN');
    writeCellValue(r14Cn.cells[3], '100ppm,606 mg/m3');

    // 注入 Row 15: 丙二醇甲醚 ACGIH TLVWN 150ppm,909 mg/m3
    s8Cn = addRowAfter(baseCnEngine, s8Cn, 14);
    const r15Cn = s8Cn.rows[15];
    sanitizeClonedRow(r15Cn);
    writeCellValue(r15Cn.cells[0], '丙二醇甲醚');
    writeCellValue(r15Cn.cells[1], 'ACGIH');
    writeCellValue(r15Cn.cells[2], 'TLVWN');
    writeCellValue(r15Cn.cells[3], '150ppm,909 mg/m3');
  }

  // Section 9: 外观恢复为微黄色透明液体
  const s9Cn = baseCnEngine.records.find(r => r.sectionNumber === 9);
  if (s9Cn) {
    const appRow = s9Cn.rows.find(r => /外观/i.test(r.cells[0]?.text || ''));
    if (appRow && appRow.cells.length > 1) {
      writeCellValue(appRow.cells[1], '微黄色透明液体');
    }
  }

  compactSection2Spacing(baseCnEngine);
  baseCnEngine.refresh();

  // 3. 建立英文基准引擎 (Step 3)
  console.log('>>> [Step 3] 建立英文基准引擎 (Base English Engine)...');
  const baseEnEngine = await buildBaseEnglishEngine({
    modelCode,
    baseCnEngine,
    facts,
    revisionDate: effectiveDate
  });

  // Section 8 EN 强化：2 行 ACGIH 限值（工程控制已由 buildBaseEnglishEngine 自动从中文版精确转译）
  let s8En = baseEnEngine.records.find(r => r.sectionNumber === 8);
  if (s8En) {
    while (s8En.rows.length > 14) {
      s8En = deleteRow(baseEnEngine, s8En, s8En.rows.length - 1);
    }

    s8En = addRowAfter(baseEnEngine, s8En, 13);
    const r14En = s8En.rows[14];
    sanitizeClonedRow(r14En);
    writeCellValue(r14En.cells[0], 'Propylene glycol monomethyl ether');
    writeCellValue(r14En.cells[1], 'ACGIH');
    writeCellValue(r14En.cells[2], 'TLVTN');
    writeCellValue(r14En.cells[3], '100ppm, 606 mg/m3');

    s8En = addRowAfter(baseEnEngine, s8En, 14);
    const r15En = s8En.rows[15];
    sanitizeClonedRow(r15En);
    writeCellValue(r15En.cells[0], 'Propylene glycol monomethyl ether');
    writeCellValue(r15En.cells[1], 'ACGIH');
    writeCellValue(r15En.cells[2], 'TLVWN');
    writeCellValue(r15En.cells[3], '150ppm, 909 mg/m3');
  }

  compactSection2Spacing(baseEnEngine);
  baseEnEngine.refresh();

  // 4. 探知说明行数量并准备硬性质量门禁事实
  const s12RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 12);
  let expectedS12PreamblesCount = 0;
  if (s12RecordForAudit) {
    for (let i = 1; i < s12RecordForAudit.rows.length; i++) {
      const t = s12RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|Ecotoxicity|Persistence|12\.\d/i.test(t)) break;
      if (t) expectedS12PreamblesCount++;
    }
  }

  const s11RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 11);
  let expectedS11PreamblesCount = 0;
  if (s11RecordForAudit) {
    for (let i = 1; i < s11RecordForAudit.rows.length; i++) {
      const t = s11RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|11\.\d|毒性[:：]|Toxicity[:：]|羟基|Hydroxy|二乙二醇|丙二醇|Propylene/i.test(t)) break;
      if (t) expectedS11PreamblesCount++;
    }
  }

  const sourceFactsForAudit = {
    expectedS11PreamblesCount,
    expectedS12PreamblesCount,
    expectedDate: effectiveDate,
    isNonHazardousComposite: false
  };

  // 5. 动态装配 Presets × Languages 各变体引擎 (4 DOCX) (Step 4)
  console.log('>>> [Step 4] 派生并装配 4 格式 DOCX (冠志/国彩 × 中/英)...');
  const resolvedPresets = [
    await getPresetById('preset_guanzhi_cn'),
    await getPresetById('preset_guocai_cn')
  ];

  const generatedVariants = [];

  for (const preset of resolvedPresets) {
    const entityData = preset.entityData || preset.entity || preset;

    // A. 派生装配中文版
    {
      const companyNameZh = entityData.name_zh || preset.name_zh || preset.name;
      const shortNameZh = entityData.shortName_zh || preset.shortName_zh || preset.shortName || companyNameZh;
      const fileName = `${modelCode} msds_CN ${shortNameZh}.docx`;

      const cnBuf = await baseCnEngine.exportArrayBuffer();
      const eng = await loadDocx(cnBuf, fileName);

      bindEntityPresetToDocument(eng, preset, { isEnglish: false, modelCode, revisionDate: effectiveDate });
      updateHeaderFooterData(eng, {
        model: modelCode,
        company: companyNameZh,
        title: '物料安全数据表',
        version: 'V1.0',
        docCode: `${modelCode}-MSDS`,
        revisionDate: effectiveDate,
        language: 'CN',
        entity: shortNameZh
      });

      for (const record of eng.records) {
        if (record.kind === 'table') enforceTableStandardBorders(record);
      }
      if (eng.documentXml) enableCrossPageBreaksForAllSections(eng);
      applyGlobalTypographyProjection(eng, false);
      enforceStructuralTypographyInvariants(eng, false);
      compactSection2Spacing(eng);

      const s9 = eng.records.find(r => r.sectionNumber === 9);
      if (s9) renumberRecord(s9);
      const s10 = eng.records.find(r => r.sectionNumber === 10);
      if (s10) renumberRecord(s10);

      enforceGlobalLeftAlignmentAndCleanIndent(eng, false);
      assertDeliverableQuality(eng, fileName, false, sourceFactsForAudit);

      generatedVariants.push({
        eng,
        fileName,
        lang: 'CN',
        preset,
        shortName: shortNameZh
      });
    }

    // B. 派生装配英文版
    {
      const companyNameEn = entityData.name_en || preset.name_en || preset.name;
      const shortNameEn = entityData.shortName_en || preset.shortName_en || preset.shortName || companyNameEn;
      const fileName = `${modelCode} msds_EN ${shortNameEn}.docx`;

      const enBuf = await baseEnEngine.exportArrayBuffer();
      const eng = await loadDocx(enBuf, fileName);

      bindEntityPresetToDocument(eng, preset, { isEnglish: true, modelCode, revisionDate: effectiveDate });
      updateHeaderFooterData(eng, {
        model: modelCode,
        company: companyNameEn,
        title: 'MATERIAL SAFETY DATA SHEET',
        version: 'V1.0',
        docCode: `${modelCode}-MSDS`,
        revisionDate: effectiveDate,
        language: 'EN',
        entity: shortNameEn
      });

      standardizeEnglishTypographyAndLabels(eng);
      const s9 = eng.records.find(r => r.sectionNumber === 9);
      if (s9) renumberRecord(s9);

      for (const record of eng.records) {
        if (record.kind === 'table') enforceTableStandardBorders(record);
      }
      if (eng.documentXml) enableCrossPageBreaksForAllSections(eng);
      applyGlobalTypographyProjection(eng, true);
      enforceStructuralTypographyInvariants(eng, true);
      compactSection2Spacing(eng);

      const s10 = eng.records.find(r => r.sectionNumber === 10);
      if (s10) renumberRecord(s10);

      enforceGlobalLeftAlignmentAndCleanIndent(eng, true);
      assertZeroChinese(eng, fileName);
      assertDeliverableQuality(eng, fileName, true, sourceFactsForAudit);

      generatedVariants.push({
        eng,
        fileName,
        lang: 'EN',
        preset,
        shortName: shortNameEn
      });
    }
  }

  // 6. 写入 4 个标准 DOCX (Step 5)
  console.log('>>> [Step 5] 批量极速写入 4 个标准 Word DOCX 交付物...');
  const convertInputs = [];
  for (const v of generatedVariants) {
    const buf = await v.eng.exportArrayBuffer();
    const docxPath = path.join(targetDir, v.fileName);
    await fs.writeFile(docxPath, Buffer.from(buf));
    console.log(`   - 已写入标准 Word: ${v.fileName} (${buf.byteLength} 字节)`);
    convertInputs.push({
      docxBuffer: buf,
      fileName: v.fileName,
      lang: v.lang,
      presetId: v.preset.id
    });
  }

  // 7. 批量无头转译 4 个矢量 PDF (Step 6)
  console.log('\n>>> [Step 6] 批量无头转译 4 个原生高保真矢量 PDF...');
  const pdfOutputs = await convertBatchDocxToPdf(convertInputs.map(ci => ({
    docxBuffer: ci.docxBuffer,
    fileName: ci.fileName
  })));

  for (let i = 0; i < pdfOutputs.length; i++) {
    const p = pdfOutputs[i];
    const finalPdfPath = path.join(targetDir, p.pdfName);
    if (p.pdfBuffer) {
      await fs.writeFile(finalPdfPath, p.pdfBuffer);
      console.log(`   - 已生成矢量 PDF: ${p.pdfName} (${p.size} 字节)`);
    }
  }

  // 8. 交付目录核验
  const allFiles = (await fs.readdir(targetDir)).filter(f => /msds/i.test(f) && (f.endsWith('.docx') || f.endsWith('.pdf')));
  console.log(`\n>>> [DELIVERY] 目标目录实测 MSDS 交付物总数: ${allFiles.length} 个`);
  allFiles.forEach(f => console.log(`   * ${f}`));
  if (allFiles.length !== 8) {
    throw new Error(`交付物数量异常: 实测 ${allFiles.length} 项 (期望 8 项)`);
  }

  // 9. 执行双极双层全景法医级深度主审计 (Step 7)
  console.log('\n========================================================================');
  console.log('>>> [Step 7] 启动双极双层全景法医级机械深度审计 (Bipolar Bilayer Audit)...');
  console.log('========================================================================');
  const auditRes = await runBipolarBilayerAudit(targetDir, modelCode);
  console.log('\n>>> [AUDIT 1 结论]: success =', auditRes.success, 'failCount =', auditRes.failCount);
  if (!auditRes.success) {
    throw new Error(`双极双层深度审计未通过，存在 ${auditRes.failCount} 项严重违章！`);
  }

  // 10. 执行中英双语逐句逐段法医级对照终审
  console.log('\n========================================================================');
  console.log('>>> [Step 7.2] 启动中英双语 103 行逐句双重对照法医检视...');
  console.log('========================================================================');
  const transRes = await auditTranslationDualDisplay(
    path.join(targetDir, `${modelCode} msds_CN 冠志.docx`),
    path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`)
  );
  console.log('\n>>> [AUDIT 2 结论]: alarms =', transRes.alarms);
  if (transRes.alarms > 0) {
    throw new Error(`中英逐句对照检视发现 ${transRes.alarms} 项致命报警！`);
  }

  console.log('\n🎉🎉🎉 [SUCCESS] 🏆 PA-4914 标准七流程步骤拓扑全套交付物生产完毕，并 100% 满分通过双重法医级终审！');
}

main().catch(err => {
  console.error('\n❌ [ERROR] 生成与审计过程中断:', err);
  process.exit(1);
});
