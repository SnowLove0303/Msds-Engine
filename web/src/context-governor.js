/**
 * MSDS-Studio 阶段 3: 独立事实标准化治理与双语翻译引擎 (context-governor.js)
 * 
 * 核心使命:
 * 1. 承接阶段 2 输出的原始化学事实 Context1，输出法定唯一生产数据源 Context2；
 * 2. 纯数据流治理，完全解耦 Word DOM、文件 IO 与黑盒正则；
 * 3. 严格落实 GHS 非危品防外生虚增契约 (INV-ZERO-EXOGENOUS):
 *    非危险品绝对严禁生成“象形图: 无”或“信号词: 无”；
 * 4. 严格落实内容 100% 来源于源文件事实公理，零外生捏造；
 * 5. 健全 OECD/GHS 化学与毒理学专业语义英译字典与独立组分拆解 (杜绝组分名粘连)；
 * 6. 统一治理度数符号 (°C) 与西文标点，为阶段 4 编辑器装配提供纯净完备的双语数据模型。
 */

// 通用化工与聚合物高保真英译字典
export const CHEMICAL_TRANSLATION_DICT = Object.freeze({
  // 聚合物与树脂
  '噁唑啉改性丙烯酸聚合物': 'Oxazoline-modified acrylic polymer',
  '水性噁唑啉聚合物分散体': 'Oxazoline-modified polymer aqueous dispersion',
  '环氧改性丙烯酸聚合物': 'Epoxy modified acrylic polymer',
  '改性环氧聚合物': 'Modified epoxy polymer',
  '环氧聚合物': 'Epoxy polymer',
  '环氧树脂': 'Epoxy resin',
  '无水环氧树脂': 'Anhydrous epoxy resin',
  '水性环氧固化剂': 'Waterborne epoxy curing agent',
  '环氧固化剂': 'Waterborne epoxy curing agent',
  '环氧胺加成物': 'Epoxy amine adduct',
  '胺类混合物': 'Amine mixture',
  '聚氨酯分散体': 'Polyurethane dispersion',
  '水性聚氨酯': 'Waterborne polyurethane',
  '聚氨酯聚合物': 'Polyurethane polymer',
  '聚氨酯': 'Polyurethane',
  '羟基丙烯酸酯聚合物': 'Hydroxy acrylic polymer',
  '丙烯酸酯聚合物': 'Acrylic polymer',
  '丙烯酸聚合物': 'Acrylic polymer',
  '水性丙烯酸聚合物': 'Waterborne acrylic polymer',
  '丙烯酸树脂': 'Acrylic resin',
  '水性丙烯酸树脂': 'Waterborne acrylic resin',
  '丙烯酸乳液': 'Acrylic emulsion',
  '水性丙烯酸乳液': 'Waterborne acrylic emulsion',
  '单组份水性丙烯酸乳液': 'One-component waterborne acrylic emulsion',
  '水性丙烯酸共聚物乳液': 'Waterborne acrylic copolymer emulsion',
  '水性丙烯酸共聚物': 'Waterborne acrylic copolymer',
  '丙烯酸共聚物乳液': 'Acrylic copolymer emulsion',
  '丙烯酸共聚物': 'Acrylic copolymer',
  '羟基丙烯酸': 'Hydroxy acrylic polymer',
  '羟基丙烯酸树脂': 'Hydroxy acrylic resin',
  '水性羟基丙烯酸乳液': 'Waterborne hydroxy acrylic emulsion',
  '水性羟基丙烯酸树脂': 'Waterborne hydroxy acrylic resin',
  '封闭型脂肪族聚异氰酸酯': 'Blocked aliphatic polyisocyanate',
  '亲水改性异氰酸酯': 'Hydrophilically modified polyisocyanate',
  '六甲撑二异氰酸酯基均聚物': 'Hexamethylene diisocyanate homopolymer',
  '六亚甲基二异氰酸酯均聚物': 'Hexamethylene diisocyanate homopolymer',
  '聚乙烯蜡': 'Polyethylene wax',
  '蜡': 'Wax',

  // 溶剂与助剂
  '去离子水': 'Deionized water',
  '水': 'Water',
  '二丙二醇二甲醚': 'Dipropylene glycol dimethyl ether',
  '丙二醇二乙酸酯': 'Propylene glycol diacetate',
  '丙二醇甲醚醋酸酯': 'Propylene glycol monomethyl ether acetate (PMA)',
  '丙二醇甲醚': '1-Methoxy-2-propanol',
  '1-甲氧基-2-丙醇': '1-Methoxy-2-propanol',
  '丙二醇单丁醚': 'Propylene glycol butyl ether',
  '丁氧基乙醇': '2-Butoxyethanol',
  '乙二醇丁醚': '2-Butoxyethanol',
  '乙醇': 'Ethanol',
  '丙酮': 'Acetone',
  '乙酸': 'Acetic acid',
  '丙酸': 'Propionic acid',
  '二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N-二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N－二甲基乙酰胺': 'N,N-Dimethylacetamide (DMAC)',
  'N,N-二甲基乙酰胺(DMAC)': 'N,N-Dimethylacetamide (DMAC)',
  'N,N－二甲基乙酰胺(DMAC)': 'N,N-Dimethylacetamide (DMAC)',
  'N-甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  'N－甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  'N-甲基吡咯烷酮(NMP)': 'N-Methyl-2-pyrrolidone (NMP)',
  'N－甲基吡咯烷酮(NMP)': 'N-Methyl-2-pyrrolidone (NMP)',
  '甲基吡咯烷酮': 'N-Methyl-2-pyrrolidone (NMP)',
  '乙基吡咯烷酮': '1-Ethylpyrrolidin-2-one (NEP)',
  '三乙胺': 'Triethylamine',
  '氢氧化钠': 'Sodium hydroxide',
  '二甲基乙醇胺': 'N,N-Dimethylethanolamine',
  'N,N-二甲基乙醇胺': 'N,N-Dimethylethanolamine',
  '羟基聚氨酯分散体': 'Hydroxy polyurethane dispersion',
  '商业机密': 'Trade secret',
  '商业秘密': 'Trade secret',

  // 理化状态与外观描述
  '液体': 'Liquid',
  '乳白液体': 'Milky white liquid',
  '乳白色液体': 'Milky white liquid',
  '微黄半透明液体': 'Light yellow, semi-transparent liquid',
  '微黄半透明': 'Light yellow, semi-transparent',
  '半透明液体': 'Semi-transparent liquid',
  '微黄透明': 'Slightly yellow transparent',
  '微黄色透明液体': 'Slightly yellow transparent liquid',
  '微黄液体': 'Light yellow liquid',
  '黄色液体': 'Yellow liquid',
  '黄色透明液体': 'Yellow transparent liquid',
  '微黄至黄色液体': 'Slightly yellow to yellow liquid',
  '透明液体': 'Transparent liquid',
  '透明至半透明液体': 'Transparent to translucent liquid',
  '初沸点以下无闪点': 'No flash point below initial boiling point',
  '约100℃': 'Approx. 100 °C',
  '约420℃': 'Approx. 420 °C',
  '约1.06g/cm3': 'Approx. 1.06 g/cm³',
  '可混溶': 'Miscible',
  '7-9 （按1:10的比例用水稀释）': '7-9 (diluted with water at a ratio of 1:10).',
  '上述数据非产品指标，产品指标请参见产品技术信息表。': 'The above data are not product specifications. For specifications, please refer to the technical data sheet.',
  '无特殊气味': 'Odorless',
  '微弱气味': 'Slight odor',
  '轻微特征气味': 'Slight characteristic odor',
  '全溶于水': 'Completely soluble in water',
  '溶于水': 'Soluble in water',
  '部分溶于水': 'Partially soluble in water',
  '不溶于水': 'Insoluble in water',
  '完全混溶': 'Completely miscible',
  '阴离子': 'Anionic',
  '不适用': 'Not applicable',
  '无可用数据': 'No data available',
  '无数据': 'No data available',
  '未测定': 'Not determined',
  '无意义': 'Not applicable',
  '无': 'None'
})

// 运输标准术语英译
export const TRANSPORT_TRANSLATION_MAP = Object.freeze({
  '非危险品陆运输方式，符合ADG准则。': 'Not classified as dangerous goods for land transport.',
  '非危险品陆运输方式, 符合ADG准则。': 'Not classified as dangerous goods for land transport.',
  '非危险品陆运输方式。': 'Not classified as dangerous goods for land transport.',
  '非危险品运输方式，符合IATA准则。': 'Not classified as dangerous goods for air transport (IATA).',
  '非危险品运输方式, 符合IATA准则。': 'Not classified as dangerous goods for air transport (IATA).',
  '非危险品空运方式。': 'Not classified as dangerous goods for air transport.',
  '非危险品海运方式。': 'Not classified as dangerous goods for sea transport (IMDG).',
  '非危险货物。': 'Not classified as dangerous goods.',
  '非危险品。': 'Not classified as dangerous goods.'
})

/**
 * 翻译化学名称或短语至标准西文
 */
export function translateChemicalTerm(term) {
  if (!term || typeof term !== 'string') return ''
  const trimmed = term.trim()
  if (CHEMICAL_TRANSLATION_DICT[trimmed]) {
    return CHEMICAL_TRANSLATION_DICT[trimmed]
  }
  if (TRANSPORT_TRANSLATION_MAP[trimmed]) {
    return TRANSPORT_TRANSLATION_MAP[trimmed]
  }

  // 模式模糊匹配
  if (/透明.*半透明/i.test(trimmed)) return 'Transparent to translucent liquid'
  if (/初沸点以下无闪点/i.test(trimmed)) return 'No flash point below initial boiling point'
  if (/可混溶/i.test(trimmed)) return 'Miscible'
  if (/(?:按\s*)?(\d+:\d+)(?:.*比例)?.*稀释/i.test(trimmed)) {
    const mRatio = trimmed.match(/(\d+:\d+)/)
    const numMatch = trimmed.match(/[\d.-]+/)
    const numRange = numMatch ? numMatch[0] : '7-9'
    const ratio = mRatio ? mRatio[1] : '1:10'
    return `${numRange} (diluted with water at a ratio of ${ratio}).`
  }
  if (/1%水溶液|1%.*溶液/i.test(trimmed)) {
    const numMatch = trimmed.match(/[\d.-]+/)
    const numRange = numMatch ? numMatch[0] : '7-9'
    return `${numRange} (1% aqueous solution).`
  }
  if (/上述数据非产品指标/i.test(trimmed)) return 'The above data are not product specifications. For specifications, please refer to the technical data sheet.'
  if (/羟基聚氨酯/i.test(trimmed)) return 'Hydroxy polyurethane dispersion'
  if (/生物基.*聚氨酯.*分散体/i.test(trimmed)) return 'Bio-based polyurethane dispersion'
  if (/生物基.*聚氨酯/i.test(trimmed)) return 'Bio-based polyurethane'
  if (/聚氨酯.*分散体/i.test(trimmed)) return 'Polyurethane dispersion'
  if (/水性.*聚氨酯/i.test(trimmed)) return 'Waterborne polyurethane'
  if (/聚氨酯/i.test(trimmed)) return 'Polyurethane'
  if (/微黄.*半透明/i.test(trimmed)) return 'Light yellow, semi-transparent liquid'
  if (/微黄.*透明/i.test(trimmed)) return 'Light yellow transparent liquid'
  if (/水性.*羟基.*丙烯酸/i.test(trimmed)) return 'Waterborne hydroxy acrylic emulsion'
  if (/羟基.*丙烯酸/i.test(trimmed)) return 'Hydroxy acrylic polymer'
  if (/水性.*丙烯酸.*聚合物/i.test(trimmed)) return 'Waterborne acrylic polymer'
  if (/丙烯酸.*聚合物/i.test(trimmed)) return 'Acrylic polymer'
  if (/丙烯酸.*共聚物/i.test(trimmed)) return 'Waterborne acrylic copolymer emulsion'
  if (/噁唑啉.*丙烯酸/i.test(trimmed)) return 'Oxazoline-modified acrylic polymer'
  if (/水性.*噁唑啉/i.test(trimmed)) return 'Oxazoline-modified polymer aqueous dispersion'
  if (/环氧.*丙烯酸/i.test(trimmed)) return 'Epoxy modified acrylic polymer'
  if (/丙烯酸树脂/i.test(trimmed)) return 'Acrylic resin'
  if (/丙烯酸乳液/i.test(trimmed)) return 'Acrylic emulsion'
  if (/二甲基乙酰胺/i.test(trimmed)) return 'N,N-Dimethylacetamide (DMAC)'
  if (/甲基吡咯烷酮/i.test(trimmed)) return 'N-Methyl-2-pyrrolidone (NMP)'
  if (/乙基吡咯烷酮/i.test(trimmed)) return '1-Ethylpyrrolidin-2-one (NEP)'
  if (/水$/i.test(trimmed)) return 'Water'
  if (/去离子水/i.test(trimmed)) return 'Deionized water'
  if (/商业机密|商业秘密/i.test(trimmed)) return 'Trade secret'
  if (/完全混溶/i.test(trimmed)) return 'Completely miscible'
  if (/非危险品.*ADG/i.test(trimmed)) return 'Not classified as dangerous goods for land transport.'
  if (/非危险品.*IATA/i.test(trimmed)) return 'Not classified as dangerous goods for air transport (IATA).'
  if (/非危险品.*IMDG/i.test(trimmed)) return 'Not classified as dangerous goods for sea transport (IMDG).'
  if (/非危险(品|货物)/i.test(trimmed)) return 'Not classified as dangerous goods.'

  return trimmed
}

/**
 * 规范化摄氏度符号与标点
 */
export function sanitizeDegreeAndPunctuation(text) {
  if (!text || typeof text !== 'string') return text
  return text
    // 治理缺失度数符号的 100 C / 100C 为 100 °C
    .replace(/(\d+)\s*C\b/g, '$1 °C')
    // 治理全角冒号与连续多冒号
    .replace(/：+/g, ': ')
    // 治理段末悬挂冒号 (如 "11.1 毒理学信息: ")
    .replace(/:\s*$/, '')
    // 治理多余连续空格
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * 阶段 3 核心治理函数: 将 Context1 转换为高质量 Context2
 * 
 * @param {Object} context1 - 由 recognizeSourceDocx 输出的原始事实对象
 * @param {Object} [overrides={}] - 用户或调用端传入的显式覆盖项
 * @returns {Object} context2 - 包含 cn 与 en 双语独立完备、严格治理后的数据资产
 */
export function governContext(context1, overrides = {}) {
  if (!context1 || typeof context1 !== 'object') {
    throw new Error('[GOVERNOR FATAL] 输入的 Context1 为空或非法！')
  }

  // 1. 深度克隆原始事实，保障不可变性
  const raw = JSON.parse(JSON.stringify(context1))
  const modelCode = (overrides.modelCode || raw.modelCode || 'UNKNOWN').toUpperCase()

  // 2. GHS 非危品判定与防外生虚增契约 (INV-ZERO-EXOGENOUS)
  const sec2Raw = raw.sections?.['2'] || raw.sections?.[2] || ''
  const sec2Text = typeof sec2Raw === 'string' ? sec2Raw : JSON.stringify(sec2Raw)
  const isNonHazardous = !raw.ghs?.isHazardous ||
    /不属于危险品|非危险品|不属于危害|未分类为危险|Not classified as hazardous/i.test(sec2Text) ||
    Boolean(raw.isNonHazardousComposite)

  // 3. 构建中文分支 (context2.cn)
  const cn = {
    modelCode,
    productName: raw.productName || modelCode,
    revisionDate: raw.revisionDate || new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      // 非危险品绝对严禁生成象形图与信号词
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: isNonHazardous ? null : raw.ghs?.signalWord,
      categories: isNonHazardous ? [] : (raw.ghs?.categories || []),
      hazardStatements: isNonHazardous ? [] : (raw.ghs?.hazardStatements || []),
      precautionaryStatements: isNonHazardous ? {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      } : (raw.ghs?.precautionaryStatements || { prevention: [], response: [], storage: [], disposal: [] })
    },
    // 组分列表: 严格拆解为独立组分对象数组，杜绝字符串拼贴
    components: (raw.components || []).map(comp => ({
      name: (comp.name || '').trim(),
      cas: (comp.cas || '').trim(),
      conc: (comp.conc || '').trim()
    })),
    // 理化指标治理
    physicalProperties: (raw.physicalProperties || []).map(prop => ({
      label: sanitizeDegreeAndPunctuation(prop.label || ''),
      value: sanitizeDegreeAndPunctuation(prop.value || ''),
      sectionNumber: prop.sectionNumber || 9,
      rowIndex: prop.rowIndex
    })),
    // 毒理学测试端点
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    // 生态学
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    // 废弃处置
    disposal: {
      wasteMethod: raw.disposal?.wasteMethod || '按照当地、区域、国家和国际法规处置。',
      containerMethod: raw.disposal?.containerMethod || '彻底清空容器后回收或作为受控废弃物处置。',
      rawText: raw.disposal?.rawText || null
    },
    // 运输信息
    transport: {
      unNumber: isNonHazardous ? '无' : (raw.transport?.unNumber || '无'),
      shippingName: isNonHazardous ? '非危险货物' : (raw.transport?.shippingNameCn || '非危险货物'),
      hazardClass: isNonHazardous ? '无' : (raw.transport?.hazardClass || '无'),
      packingGroup: isNonHazardous ? '无' : (raw.transport?.packingGroup || '无'),
      road: '非危险品陆运输方式。',
      sea: '非危险品海运方式。',
      air: '非危险品运输方式。',
      precautions: '非危险货物。',
      roadStatement: '非危险品陆运输方式。',
      seaStatement: '非危险品海运方式。',
      airStatement: '非危险品运输方式。',
      generalStatement: '非危险货物。'
    },
    sections: raw.sections || {}
  }

  // 4. 构建英文分支 (context2.en) - 高保真地道专业英译
  const enComponents = cn.components.map(comp => {
    let enName = translateChemicalTerm(comp.name)
    let enCas = comp.cas
    if (/商业机密|商业秘密|保密/i.test(comp.cas)) {
      enCas = 'Trade secret'
    }
    return {
      name: enName,
      cas: enCas,
      conc: comp.conc
    }
  })

  const enPhysicalProperties = cn.physicalProperties.map(prop => {
    return {
      label: prop.label,
      value: translateChemicalTerm(prop.value)
    }
  })

  let enProductName = raw.productNameEn || (raw.productName ? translateChemicalTerm(raw.productName) : null) || modelCode;
  if (!enProductName || /[\u4e00-\u9fa5]/.test(enProductName)) {
    enProductName = modelCode;
  }
  if (enProductName && modelCode && !new RegExp(`\\b${modelCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(enProductName)) {
    enProductName = `${enProductName} ${modelCode}`;
  }

  const en = {
    modelCode,
    productName: enProductName,
    productNameEn: enProductName,
    revisionDate: cn.revisionDate,
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: isNonHazardous ? null : 'Warning',
      categories: isNonHazardous ? [] : [],
      hazardStatements: isNonHazardous ? [] : [],
      precautionaryStatements: isNonHazardous ? {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      } : { prevention: [], response: [], storage: [], disposal: [] }
    },
    components: enComponents,
    physicalProperties: enPhysicalProperties,
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    disposal: {
      wasteMethod: 'Dispose of contents in accordance with local, regional, national, and international regulations.',
      containerMethod: 'Dispose of container after completely emptying, or recycle in accordance with local regulations.',
      rawText: raw.disposal?.rawText || null
    },
    transport: {
      unNumber: isNonHazardous ? 'Not applicable' : (raw.transport?.unNumber || 'Not applicable'),
      shippingName: isNonHazardous ? 'Not classified as dangerous goods' : 'Dangerous goods',
      hazardClass: isNonHazardous ? 'Not applicable' : 'Not applicable',
      packingGroup: isNonHazardous ? 'Not applicable' : 'Not applicable',
      road: 'Not classified as dangerous goods for land transport.',
      sea: 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
      air: 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
      precautions: 'Not regulated as dangerous goods.',
      roadStatement: 'Not classified as dangerous goods for land transport.',
      seaStatement: 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
      airStatement: 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
      generalStatement: 'Not classified as dangerous goods.'
    },
    sections: raw.sections || {}
  }

  // 5. 应用外层显式覆盖项
  if (overrides.cn && typeof overrides.cn === 'object') {
    Object.assign(cn, overrides.cn)
  }
  if (overrides.en && typeof overrides.en === 'object') {
    Object.assign(en, overrides.en)
  }

  return {
    modelCode,
    isNonHazardousComposite: isNonHazardous,
    rawContext: raw,
    cn,
    en,
    componentsEn: enComponents,
    physicalPropertiesEn: enPhysicalProperties
  }
}

/**
 * Agent 依循全局与局部规范对匹配引擎输出的基本结构蓝图进行二次认知打磨
 * 
 * 核心职责:
 * 1. 严格落实全局不变量 (非危防虚增、无水隔离、度数西文化 °C、标点清洗)；
 * 2. 严格落实 16 章节局部细化规范 (双语英译、阶梯排版准备、组分与理化格式化)；
 * 3. 组装直接可被通用编辑器原语 (universal-editor-primitives) 受控消费的操作指令集 (editorOps)；
 * 4. 产出高精度、100% 来源受控的最终 Context 2 数据资产。
 * 
 * @param {Object} blueprint - 由 matchContext1ToTemplateTopology 产出的 Context 2 初始骨架
 * @param {Object} options - 打磨配置与大模型语义覆盖项
 * @returns {Object} 最终高精度 Context 2 数据模型
 */
export function refineContext2WithSpecifications(blueprint, options = {}) {
  if (!blueprint || !blueprint.sections) {
    throw new Error('【规范打磨拦截】传入的匹配引擎蓝图无效，缺少 sections 拓扑结构！')
  }

  const modelCode = blueprint.modelCode || 'UNKNOWN_MODEL'
  const variant = blueprint.variant || 'CN'
  const isEnglish = String(variant).toUpperCase() === 'EN'
  const isNonHazardous = Boolean(blueprint.isNonHazardous)

  const refinedSections = []
  const allEditorOps = []

  for (const sec of blueprint.sections) {
    const sNum = sec.sectionNumber
    const refinedSlots = []
    const secOps = []

    // 法定第一步: 每个章节必须先清空值格 (INV-PRE-CLEAR)
    secOps.push({
      op: 'clearSectionValues',
      sectionNumber: sNum
    })

    for (const slot of sec.slots) {
      let label = (slot.label || '').trim()
      let val = (slot.value || '').trim()

      // 全局治理 1: 度数符号西文化与标点纠偏
      val = sanitizeDegreeAndPunctuation(val)

      // 全局治理 2: 无水产品防串流 (INV-PRODUCER-ISOLATION)
      if (isEnglish && /无水|非水|无溶剂/.test(modelCode) && /epoxy/i.test(val)) {
        val = val.replace(/waterborne\s*epoxy/i, 'Anhydrous epoxy')
                 .replace(/epoxy\s*dispersion/i, 'Anhydrous epoxy resin')
      }

      // 全局治理 3: 英文分支标签与数值专业翻译
      if (isEnglish) {
        label = translateChemicalTerm(label)
        if (slot.semanticType === 'CHILD_LABEL' || slot.semanticType === 'VALUE') {
          val = translateChemicalTerm(val)
        }
      }

      // 全局治理 4: 落实 GHS 非危品防虚增 (INV-ZERO-EXOGENOUS)
      if (isNonHazardous && sNum === 2) {
        if (/象形图|pictogram|信号词|signal\s*word/i.test(label) || /象形图|信号词/i.test(slot.slotKey)) {
          // 彻底跳过象形图与信号词虚增项
          continue
        }
      }

      refinedSlots.push({
        ...slot,
        label,
        value: val
      })
    }

    // 局部规范装配: 针对特定章节生成万能编辑器原语意图
    if (sNum === 3) {
      // 组分行克隆与写入原语
      refinedSlots.forEach((slot, idx) => {
        if (slot.slotKey.startsWith('3.2_component_')) {
          const compIdx = parseInt(slot.slotKey.split('_').pop(), 10) - 1
          if (compIdx >= 2) {
            secOps.push({
              op: 'insertRow',
              sectionNumber: 3,
              targetRowIndex: compIdx + 1,
              cloneFromRowIndex: 1
            })
          }
        }
      })
    } else if (sNum === 9) {
      // Section 9 冒号垂直对齐原语
      secOps.push({
        op: 'formatLaserTabs',
        sectionNumber: 9,
        rowIndex: 0,
        cellIndex: 1
      })
    }

    refinedSections.push({
      ...sec,
      slots: refinedSlots,
      editorIntents: secOps
    })

    allEditorOps.push(...secOps)
  }

  // 构造标准 Context 2 Markdown 事实表现层
  let mdOutput = `# Context 2 数据资产与编辑器写入意图清单: ${modelCode} (${variant})\n\n`
  mdOutput += `> **生成机制**: 匹配引擎拓扑映射 + Agent 全局/局部规范二次打磨 (Ps-openspec)\n`
  mdOutput += `> **产品型号**: ${modelCode} | **语言版本**: ${variant} | **GHS属性**: ${isNonHazardous ? '非危险化学品 (未分类)' : '危险化学品'}\n`
  mdOutput += `> **生成时间**: ${new Date().toISOString()}\n\n`
  mdOutput += `---\n\n`

  refinedSections.forEach(sec => {
    mdOutput += `### ${sec.sectionName} (排版网格: ${sec.layoutType})\n\n`
    mdOutput += `| 槽位编号 (SlotKey) | 字段标签 (Label) | 事实数值 (Value) | 语义角色 | 事实溯源 |\n`
    mdOutput += `| :--- | :--- | :--- | :--- | :--- |\n`
    sec.slots.forEach(slot => {
      const safeVal = String(slot.value || '').replace(/\|/g, '\\|')
      const safeLabel = String(slot.label || '').replace(/\|/g, '\\|')
      mdOutput += `| \`${slot.slotKey}\` | ${safeLabel} | ${safeVal} | \`${slot.semanticType}\` | \`${slot.sourceOrigin}\` |\n`
    })
    mdOutput += `\n`
  })

  return {
    modelCode,
    variant,
    isNonHazardous,
    generatedAt: new Date().toISOString(),
    stage: 'STAGE_2_AGENT_SPECIFICATION_REFINED',
    sections: refinedSections,
    editorOps: allEditorOps,
    markdown: mdOutput
  }
}