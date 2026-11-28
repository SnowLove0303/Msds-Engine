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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __cgFilename = fileURLToPath(import.meta.url);
const __cgDirname = path.dirname(__cgFilename);
export const TRANSLATION_MEMORY_PATH = path.resolve(__cgDirname, 'translation-memory.json');

export function loadTranslationMemory() {
  try {
    if (fs.existsSync(TRANSLATION_MEMORY_PATH)) {
      const raw = JSON.parse(fs.readFileSync(TRANSLATION_MEMORY_PATH, 'utf8'));
      return raw && typeof raw === 'object' ? raw : {};
    }
  } catch {
    // 忽略损坏的记忆库，回退为空字典
  }
  return {};
}

/**
 * 将经过校验的 Agent 逐句英译沉淀至持久化映射数据库 (translation-memory.json)
 */
export function saveTranslationsToMemory(entries) {
  if (!entries || typeof entries !== 'object') return { added: 0, total: 0 };
  const current = loadTranslationMemory();
  let added = 0;
  for (const [k, v] of Object.entries(entries)) {
    if (k === 'byKey' || !v || typeof v !== 'string') continue;
    const normK = String(k).replace(/\r\n/g, '\n').trim();
    const normV = v.replace(/\r\n/g, '\n').trim();
    if (!normK || !normV || /[\u4e00-\u9fff]/.test(normV)) continue;
    if (current[normK] !== normV) {
      current[normK] = normV;
      added++;
    }
  }
  if (added > 0) {
    const sorted = Object.fromEntries(Object.keys(current).sort().map(key => [key, current[key]]));
    fs.writeFileSync(TRANSLATION_MEMORY_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  }
  return { added, total: Object.keys(current).length, path: TRANSLATION_MEMORY_PATH };
}

export const BASE_TRANSLATION_DICT_PATH = path.resolve(__cgDirname, 'base-translation-dict.json');

export function loadBaseTranslationDict() {
  try {
    if (fs.existsSync(BASE_TRANSLATION_DICT_PATH)) {
      const raw = JSON.parse(fs.readFileSync(BASE_TRANSLATION_DICT_PATH, 'utf8'));
      return raw && typeof raw === 'object' ? raw : {};
    }
  } catch {
    // 忽略损坏的基准词库
  }
  return {};
}

// 通用化工与聚合物高保真英译字典（已外置至 base-translation-dict.json，保留冻结导出向后兼容）
export const CHEMICAL_TRANSLATION_DICT = Object.freeze(loadBaseTranslationDict());

// 联合国危险货物正式运输名称中英标准目录
export const UN_PROPER_SHIPPING_NAMES = Object.freeze({
  '1866': { cn: '树脂溶液，易燃', en: 'RESIN SOLUTION, flammable' },
  '1993': { cn: '易燃液体，未另作规定的', en: 'FLAMMABLE LIQUID, N.O.S.' },
  '1263': { cn: '油漆或油漆相关材料', en: 'PAINT or PAINT RELATED MATERIAL' },
  '1139': { cn: '保护层防护液', en: 'COATING SOLUTION' }
})

// 运输标准术语英译
export const TRANSPORT_TRANSLATION_MAP = Object.freeze({
  '非危险品陆运输方式，符合ADG准则。': 'Not classified as dangerous goods for land transport, in accordance with the ADG Code.',
  '非危险品陆运输方式, 符合ADG准则。': 'Not classified as dangerous goods for land transport, in accordance with the ADG Code.',
  '非危险品陆运输方式。': 'Not classified as dangerous goods for land transport.',
  '非危险品运输方式，符合IATA准则。': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
  '非危险品运输方式, 符合IATA准则。': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
  '非危险品空运方式。': 'Not classified as dangerous goods for air transport.',
  '非危险品海运方式。': 'Not classified as dangerous goods for sea transport (IMDG).',
  '非危险品海运方式，符合IMDG准则。': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
  '非危险品海运方式, 符合IMDG准则。': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
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

  // 通用父子级标签归一化 (Hybrid Context 2 确定性底座：支持正斜杠/连字符/逗号等多样性写法统一归并为 父（子）：)
  if (/^急性毒性[（(]经口[)）][：:]?$/i.test(trimmed)) return 'Acute toxicity (oral)'
  if (/^急性毒性[（(]经皮[)）][：:]?$/i.test(trimmed)) return 'Acute toxicity (dermal)'
  if (/^急性毒性[（(]吸入[)）][：:]?$/i.test(trimmed)) return 'Acute toxicity (inhalation)'
  if (/^亚急性[，,\s]*亚慢性和延迟毒性[：:]?$/i.test(trimmed)) return 'Subacute, subchronic and delayed toxicity'
  if (/^生殖毒性[（(\s/]*生育力[)）]?[：:]?$/i.test(trimmed)) return 'Reproductive toxicity (fertility)'
  if (/^生殖毒性[（(\s/]*致畸形[)）]?[：:]?$/i.test(trimmed)) return 'Reproductive toxicity (teratogenicity)'
  if (/^STOT\s*评估\s*[（(\s\-–—]*(?:一次性接触|单次接触)[)）]?[：:]?$/i.test(trimmed)) return 'STOT assessment (single exposure)'
  if (/^STOT\s*评估\s*[（(\s\-–—]*(?:重复性接触|重复接触)[)）]?[：:]?$/i.test(trimmed)) return 'STOT assessment (repeated exposure)'
  if (/碳化二亚胺/i.test(trimmed)) {
    if (/脂肪族/i.test(trimmed)) return 'Aliphatic polycarbodiimide'
    if (/交联剂/i.test(trimmed)) return 'Carbodiimide crosslinker'
    return 'Polycarbodiimide'
  }
  if (/溶剂.*气味|溶剂/i.test(trimmed)) return 'Solvent odor'
  if (/半透明.*(?:粘稠|粘性)|(?:粘稠|粘性).*半透明/i.test(trimmed)) return 'Translucent viscous liquid'
  if (/透明.*(?:粘稠|粘性)|(?:粘稠|粘性).*透明/i.test(trimmed)) return 'Transparent viscous liquid'
  if (/粘稠.*液体|粘性.*液体/i.test(trimmed)) return 'Viscous liquid'
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
  if (/氨水/i.test(trimmed)) return 'Ammonia water'
  if (/去离子水/i.test(trimmed)) return 'Deionized water'
  if (/^水$|纯水|蒸馏水/i.test(trimmed)) return 'Water'
  if (/商业机密|商业秘密/i.test(trimmed)) return 'Trade secret'
  if (/完全混溶/i.test(trimmed)) return 'Completely miscible'
  if (/非危险品.*ADG/i.test(trimmed)) return 'Not classified as dangerous goods for land transport, in accordance with the ADG Code.'
  if (/非危险品.*IATA/i.test(trimmed)) return 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.'
  if (/非危险品.*IMDG/i.test(trimmed)) return 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.'
  if (/^非危险(?:品|货物)[。.]?$/i.test(trimmed)) return 'Not classified as dangerous goods.'
  if (/含聚碳酸酯结构.*多元醇.*聚合物/i.test(trimmed)) return 'Polycarbonate-containing polyol polymer'
  if (/含聚酯结构.*多元醇.*聚合物/i.test(trimmed)) return 'Polyester-containing polyol polymer'
  if (/多元醇.*分散体/i.test(trimmed)) return 'Polyol dispersion'
  if (/多元醇.*聚合物/i.test(trimmed)) return 'Polyol polymer'
  if (/丙烯酸.*多元醇/i.test(trimmed)) return 'Acrylic polyol'
  if (/多元醇/i.test(trimmed)) return 'Polyol'
  if (/树脂溶液/i.test(trimmed)) return 'Resin solution'
  if (/溶剂型.*丙烯酸/i.test(trimmed)) return 'Solvent-based acrylic resin'

  return trimmed
}

/**
 * 翻译 Section 3 组分附注（如中和剂成盐说明、特定浓度限值等）至标准西文
 */
export function translateSection3Notes(notesText) {
  if (!notesText || typeof notesText !== 'string') return '';
  const lines = notesText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const enLines = lines.map(line => {
    if (CHEMICAL_TRANSLATION_DICT[line]) return CHEMICAL_TRANSLATION_DICT[line];
    if (/羟基丙烯酸酯聚合物.*GHS危险性分类[：:\s]*不适用/i.test(line)) {
      return 'Hydroxyacrylate polymer GHS hazard classification: Not applicable.';
    }
    if (/请注意以下物质/i.test(line)) {
      return 'Please note the following substances:';
    }
    let res = line;
    if (/N,N[-－]?二甲基乙醇胺.*中和剂.*盐.*浓度/i.test(res)) {
      res = res
        .replace(/N,N[-－]?二甲基乙醇胺/g, 'N,N-Dimethylethanolamine')
        .replace(/，中和剂/g, ', neutralizer')
        .replace(/，已键合为盐/g, ', bonded as salt')
        .replace(/，质量浓度/g, ', mass concentration ')
        .replace(/小于/g, '< ')
        .replace(/大于/g, '> ');
    }
    if (/急性毒性[（(](?:经口|经皮|吸入)[)）]/.test(res)) {
      res = res
        .replace(/急性毒性[（(]经口[)）]/g, 'Acute toxicity (oral)')
        .replace(/急性毒性[（(]经皮[)）]/g, 'Acute toxicity (dermal)')
        .replace(/急性毒性[（(]吸入[)）]/g, 'Acute toxicity (inhalation)');
    }
    if (/GHS分类[：:\s]*/i.test(res)) {
      res = res
        .replace(/GHS分类[：:\s]*/i, 'GHS Classification: ')
        .replace(/依然液体|易燃液体/g, 'Flammable liquid ')
        .replace(/急性毒性/g, 'Acute toxicity ')
        .replace(/吸入性|吸入/g, 'Inhalation ')
        .replace(/经皮/g, 'Dermal ')
        .replace(/经口/g, 'Oral ')
        .replace(/皮肤腐蚀/g, 'Skin corrosion ')
        .replace(/皮肤刺激/g, 'Skin irritation ')
        .replace(/严重眼睛损伤|眼睛刺激/g, 'Eye damage/irritation ')
        .replace(/特异性靶器官系统毒性（一次接触）/g, 'STOT SE ')
        .replace(/特异性靶器官系统毒性（反复接触）/g, 'STOT RE ')
        .replace(/特异性靶器官毒性（一次接触）/g, 'STOT SE ')
        .replace(/特异性靶器官毒性（反复接触）/g, 'STOT RE ')
        .replace(/；/g, '; ');
    }
    if (/特定(?:阈值|浓度|极限)?浓度/i.test(res)) {
      res = res.replace(/特定(?:阈值|浓度|极限)?浓度[：:\s]*/i, 'Specific concentration limit: ');
    }
    if (/特异性靶器官系统毒性（一次接触）/i.test(res)) {
      res = res.replace(/特异性靶器官系统毒性（一次接触）/g, 'STOT SE ');
    }
    if (/特异性靶器官毒性（一次接触）/i.test(res)) {
      res = res.replace(/特异性靶器官毒性（一次接触）/g, 'STOT SE ');
    }
    res = res.replace(/CAS(?:号|编号)[：:\s]*保留/gi, 'CAS No.: Reserved');
    res = res.replace(/CAS(?:号|编号)[：:\s]*/gi, 'CAS No.: ');
    res = res.replace(/羟基丙烯酸酯聚合物/g, 'Hydroxyacrylate polymer');
    res = res.replace(/，/g, ', ');
    res = res.replace(/；/g, '; ');
    res = res.replace(/：/g, ': ');
    res = res.replace(/。/g, '. ');
    res = res.replace(/\s+/g, ' ').trim();
    return translateChemicalTerm(res) || res;
  });
  return enLines.join('\n');
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

export function normalizeParentChildLabel(rawEndpoint, semanticOverride = null) {
  if (semanticOverride?.parentConcept && semanticOverride?.childConcept) {
    return `${String(semanticOverride.parentConcept).trim()}（${String(semanticOverride.childConcept).trim()}）：`;
  }
  const stripped = String(rawEndpoint || '').replace(/^\d+\.\d+[\s\t]*/, '').replace(/[：:]+$/, '').trim();
  if (/^亚急性[，,\s]*亚慢性和延迟毒性$/i.test(stripped)) return '亚急性，亚慢性和延迟毒性';
  const parentChildMatch = stripped.match(/^(急性毒性|生殖毒性|STOT\s*评估)[，,\s\/\-–—]+(.+)$/i);
  if (parentChildMatch) {
    const parent = parentChildMatch[1].replace(/\s+/g, '');
    const child = parentChildMatch[2].replace(/^[（(]|[)）]$/g, '').trim();
    return `${parent}（${child}）：`;
  }
  const existingParenMatch = stripped.match(/^(急性毒性|生殖毒性|STOT\s*评估)\s*[（(]([^)）]+)[)）]$/i);
  if (existingParenMatch) {
    const parent = existingParenMatch[1].replace(/\s+/g, '');
    return `${parent}（${existingParenMatch[2].trim()}）：`;
  }
  return stripped ? `${stripped}：` : '';
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
    /不属于危险[品物]|非危险[品物]|不属于危害|未分类为危险|Not classified as hazardous/i.test(sec2Text) ||
    Boolean(raw.isNonHazardousComposite)

  // 运输分类独立判定 (非危化品或未归入危运)
  const isTransportNonDangerous = Boolean(raw.transport?.isNonDangerousGoods) ||
    !raw.transport?.unNumber ||
    raw.transport?.unNumber === '无' ||
    /非危险/i.test(raw.transport?.shippingNameCn || '') ||
    /非危险/i.test(raw.transport?.generalStatement || '')

  let rawRoad = raw.transport?.roadStatement || raw.transport?.road || '非危险品陆运输方式。'
  let rawSea = raw.transport?.seaStatement || raw.transport?.sea || '非危险品海运方式。'
  let rawAir = raw.transport?.airStatement || raw.transport?.air || '非危险品运输方式。'

  if (Array.isArray(raw.transport?.transportModes)) {
    for (const tm of raw.transport.transportModes) {
      if (/公路|陆运|铁路|road|rail/i.test(tm.mode || '')) {
        rawRoad = tm.description || rawRoad
      } else if (/海/i.test(tm.mode || '')) {
        rawSea = tm.description || rawSea
      } else if (/空/i.test(tm.mode || '')) {
        rawAir = tm.description || rawAir
      }
    }
  } else if (raw.transport?.transportModes && typeof raw.transport.transportModes === 'object') {
    rawRoad = raw.transport.transportModes.road || rawRoad
    rawSea = raw.transport.transportModes.sea || rawSea
    rawAir = raw.transport.transportModes.air || rawAir
  }

  const cleanUn = String(raw.transport?.unNumber || '').replace(/\D/g, '')
  const unProper = UN_PROPER_SHIPPING_NAMES[cleanUn]

  // 3. 构建中文分支 (context2.cn)
  const cn = {
    modelCode,
    productName: raw.productName || modelCode,
    chemicalClassification: raw.chemicalClassification || null,
    contactPhone: raw.contactPhone || null,
    emergencyPhone: raw.emergencyPhone || null,
    revisionDate: raw.revisionDate || new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      // 非危险品绝对严禁生成象形图
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: raw.ghs?.signalWord || null,
      categories: isNonHazardous ? [] : (raw.ghs?.categories || []),
      hazardStatements: (raw.ghs?.hazardStatements && raw.ghs.hazardStatements.length > 0)
        ? raw.ghs.hazardStatements
        : [],
      precautionaryStatements: raw.ghs?.precautionaryStatements || {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      },
      otherHazards: raw.ghs?.otherHazards || null,
      hazardousComponentsOnLabel: raw.ghs?.hazardousComponentsOnLabel || null
    },
    // 组分列表: 严格拆解为独立组分对象数组，杜绝字符串拼贴
    components: (raw.components || []).map(comp => ({
      name: (comp.name || '').trim(),
      cas: (comp.cas || '').trim(),
      conc: (comp.conc || '').trim()
    })),
    componentsNotes: Array.isArray(raw.componentsNotes) ? [...raw.componentsNotes] : [],
    otherHazards: raw.ghs?.otherHazards || null,
    hazardousComponentsOnLabel: raw.ghs?.hazardousComponentsOnLabel || null,
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
      unNumber: isTransportNonDangerous ? '无' : (raw.transport?.unNumber || '无'),
      shippingName: isTransportNonDangerous ? '非危险货物' : (raw.transport?.shippingNameCn || unProper?.cn || '非危险货物'),
      hazardClass: isTransportNonDangerous ? '无' : (raw.transport?.hazardClass || '无'),
      packingGroup: isTransportNonDangerous ? '无' : (raw.transport?.packingGroup || '无'),
      road: rawRoad,
      sea: rawSea,
      air: rawAir,
      precautions: raw.transport?.precautions || raw.transport?.specialPrecautions?.primaryCn || (isTransportNonDangerous ? '非危险货物。' : '参见第6-8节。'),
      roadStatement: rawRoad,
      seaStatement: rawSea,
      airStatement: rawAir,
      generalStatement: raw.transport?.generalStatement || (isTransportNonDangerous ? '非危险货物。' : '危险货物。')
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

  const enShippingName = isTransportNonDangerous
    ? 'Not classified as dangerous goods'
    : (raw.transport?.shippingNameEn && raw.transport.shippingNameEn !== 'CHEMICALS'
        ? raw.transport.shippingNameEn
        : (unProper?.en || (raw.transport?.shippingNameCn ? translateChemicalTerm(raw.transport.shippingNameCn) : 'Dangerous goods')));

  const en = {
    modelCode,
    productName: enProductName,
    productNameEn: enProductName,
    chemicalClassification: raw.chemicalClassification ? translateChemicalTerm(raw.chemicalClassification) : null,
    contactPhone: raw.contactPhone || null,
    emergencyPhone: raw.emergencyPhone || null,
    revisionDate: cn.revisionDate,
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: raw.ghs?.signalWord === '危险' ? 'Danger' : (raw.ghs?.signalWord === '警告' ? 'Warning' : (raw.ghs?.signalWord ? translateChemicalTerm(raw.ghs.signalWord) : null)),
      categories: isNonHazardous ? [] : (raw.ghs?.categories || []).map(c => translateChemicalTerm(c)),
      hazardStatements: (raw.ghs?.hazardStatements || []).map(h => ({
        code: h.code,
        text: translateChemicalTerm(h.text || '')
      })),
      precautionaryStatements: {
        prevention: (raw.ghs?.precautionaryStatements?.prevention || []).map(p => ({
          code: p.code,
          text: translateChemicalTerm(p.text || '')
        })),
        response: (raw.ghs?.precautionaryStatements?.response || []).map(p => ({
          code: p.code,
          text: translateChemicalTerm(p.text || '')
        })),
        storage: (raw.ghs?.precautionaryStatements?.storage || []).map(p => ({
          code: p.code,
          text: translateChemicalTerm(p.text || '')
        })),
        disposal: (raw.ghs?.precautionaryStatements?.disposal || []).map(p => ({
          code: p.code,
          text: translateChemicalTerm(p.text || '')
        }))
      },
      otherHazards: Array.isArray(raw.ghs?.otherHazards) ? raw.ghs.otherHazards.map(oh => translateChemicalTerm(oh)) : null,
      hazardousComponentsOnLabel: raw.ghs?.hazardousComponentsOnLabel ? translateChemicalTerm(raw.ghs.hazardousComponentsOnLabel) : null
    },
    components: enComponents,
    componentsNotes: Array.isArray(raw.componentsNotes) ? raw.componentsNotes.map(n => translateSection3Notes(n)) : [],
    otherHazards: Array.isArray(raw.ghs?.otherHazards) ? raw.ghs.otherHazards.map(oh => translateChemicalTerm(oh)) : null,
    hazardousComponentsOnLabel: raw.ghs?.hazardousComponentsOnLabel ? translateChemicalTerm(raw.ghs.hazardousComponentsOnLabel) : null,
    physicalProperties: enPhysicalProperties,
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    disposal: {
      wasteMethod: 'Dispose of contents in accordance with local, regional, national, and international regulations.',
      containerMethod: 'Dispose of container after completely emptying, or recycle in accordance with local regulations.',
      rawText: raw.disposal?.rawText || null
    },
    transport: {
      unNumber: isTransportNonDangerous ? 'Not applicable' : (raw.transport?.unNumber || 'Not applicable'),
      shippingName: enShippingName,
      hazardClass: isTransportNonDangerous ? 'Not applicable' : (raw.transport?.hazardClass || 'Not applicable'),
      packingGroup: isTransportNonDangerous ? 'Not applicable' : (raw.transport?.packingGroup || 'Not applicable'),
      road: translateChemicalTerm(rawRoad),
      sea: translateChemicalTerm(rawSea),
      air: translateChemicalTerm(rawAir),
      precautions: isTransportNonDangerous ? 'Not regulated as dangerous goods.' : (raw.transport?.specialPrecautions?.primaryEn || 'See sections 6-8.'),
      roadStatement: translateChemicalTerm(rawRoad),
      seaStatement: translateChemicalTerm(rawSea),
      airStatement: translateChemicalTerm(rawAir),
      generalStatement: isTransportNonDangerous ? 'Not classified as dangerous goods.' : 'Dangerous goods.'
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

/**
 * 16 章节全量结构化标注与规范化治理引擎 (Context 1 -> Context 2)
 * 严格依据全局/局部规范对 Context 1 原始网格进行逐行角色重分类、序号剥离、条件解耦、
 * 跨节附注迁移（如 S3 -> S2）、双语专业英译及编辑器原语意图生成，消除 Context 1 误分类。
 */
export function buildStructuredContext2(context1, options = {}) {
  if (!context1 || typeof context1 !== 'object' || !context1.sections) {
    throw new Error('[CONTEXT2 ERROR] 无效的 Context 1 输入，缺少 sections 结构');
  }

  const modelCode = context1.modelCode || 'UNKNOWN';
  const governed = governContext(context1);
  const annotatedSections = {};
  const editorOps = [];

  // Agent 逐句全量翻译注入字典 + 持久化翻译记忆库 (优先级: 本次 --translations > 记忆库 TM > 内置标准词典)
  const tm = loadTranslationMemory();
  const rawTrans = options?.translations && typeof options.translations === 'object' ? options.translations : {};
  const transByKey = rawTrans.byKey && typeof rawTrans.byKey === 'object' ? rawTrans.byKey : {};
  // @FIX_TAG(2026-11-23/context-governor/FIX-PUNCT-SPACE): 英文标点后粘连自愈、全角符号半角化与多余空格压缩
  const healEnSpacing = (str) => String(str ?? '')
    .replace(/℃/g, '°C')
    .replace(/＜/g, '<')
    .replace(/＞/g, '>')
    .replace(/\(\s*e\.\s*g\.,/gi, '(e.g.,')
    .replace(/Propylene glycol methyl ether acetate\b/gi, 'Propylene glycol monomethyl ether acetate (PMA)')
    .replace(/(\d)\s*mPa\.\s*s\b/gi, '$1 mPa·s')
    .replace(/mPa\.\s*s\b/gi, 'mPa·s')
    .replace(/(\d+(?:\.\d+)?)\s*(g\/cm3|g\/cm³)\b/gi, '$1 $2')
    .replace(/([a-z][.!?])([A-Za-z])/g, '$1 $2')
    .replace(/\(\s*e\.\s*g\.,/gi, '(e.g.,')
    .replace(/(\d)\s*mPa\.\s*s\b/gi, '$1 mPa·s')
    .replace(/mPa\.\s*s\b/gi, 'mPa·s')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const resolveEn = (cnText, fallbackEn, keyHint = null) => {
    if (keyHint && transByKey[keyHint]) return healEnSpacing(transByKey[keyHint]);
    const raw = String(cnText ?? '').replace(/\r\n/g, '\n').trim();
    if (!raw) return healEnSpacing(fallbackEn ?? '');
    if (rawTrans[raw]) return healEnSpacing(rawTrans[raw]);
    if (tm[raw]) return healEnSpacing(tm[raw]);
    const noColon = raw.replace(/[：:]$/, '').trim();
    if (rawTrans[noColon]) return healEnSpacing(rawTrans[noColon]);
    if (tm[noColon]) return healEnSpacing(tm[noColon]);
    return healEnSpacing(fallbackEn ?? '');
  };

  const STANDARD_SECTION_TITLE_EN = {
    1: '1. Identification of the Substance/Mixture and of the Company/Undertaking',
    2: '2. Hazards Identification',
    3: '3. Composition/Information on Ingredients',
    4: '4. First Aid Measures',
    5: '5. Firefighting Measures',
    6: '6. Accidental Release Measures',
    7: '7. Handling and Storage',
    8: '8. Exposure Controls/Personal Protection',
    9: '9. Physical and Chemical Properties',
    10: '10. Stability and Reactivity',
    11: '11. Toxicological Information',
    12: '12. Ecological Information',
    13: '13. Disposal Considerations',
    14: '14. Transport Information',
    15: '15. Regulatory Information',
    16: '16. Other Information'
  };

  const getRawRows = (s) => context1.sections?.[s]?.rows || context1.sections?.[String(s)]?.rows || [];

  // 辅助：提取并清洗序号 (如 "9.1. 外 观：" -> { seq: "9.1", cleanLabel: "外观：", indentDxa: 420 })
  const parseSeqLabel = (rawText) => {
    const t = String(rawText || '').trim();
    const m = t.match(/^(\d+\.\d+)[.\s\t]*(.*)$/);
    if (m) {
      const seq = m[1];
      const digits = seq.replace(/\D/g, '').length;
      const body = m[2].replace(/^[.\s\t]+/, '').trim();
      const label = body.endsWith('：') || body.endsWith(':') ? body : `${body}：`;
      return { isSeq: true, seq, label, cleanKey: label.replace(/[：:\s]/g, ''), indentDxa: digits >= 4 ? 560 : 420 };
    }
    return { isSeq: false, seq: null, label: t, cleanKey: t.replace(/[：:\s]/g, ''), indentDxa: 420 };
  };

  for (let s = 1; s <= 16; s++) {
    const rawSec = context1.sections?.[s] || context1.sections?.[String(s)] || { sectionNumber: s, title: `${s}.`, rows: [] };
    const rows = getRawRows(s);
    const items = [];

    // 前置值格清零意图
    editorOps.push({ op: 'clearSectionValues', sectionNumber: s });

    if (s === 2) {
      // Section 2: 依据全局/局部规范重组为独立自然通栏行并精确标注每行粗细与缩进层级
      items.push({
        rowIndex: 0,
        role: 'SECTION_HEADER',
        bold: true,
        textCn: rawSec.title || '2. 危险性概述',
        textEn: resolveEn(rawSec.title, STANDARD_SECTION_TITLE_EN[2], 'S2:R0'),
        placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
      });

      const polymerNote = (context1.componentsNotes || []).find(n => /聚合物.*分类|不适用/i.test(n));
      const saltNotes = (context1.componentsNotes || []).filter(n => n !== polymerNote);

      const rawS2Lines = [];
      for (const r of rows) {
        if (r.rowIndex === 0) continue;
        for (const c of (r.cells || [])) {
          if (c.text) {
            c.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => rawS2Lines.push(l));
          }
        }
      }

      // 通用清洗：拆解粘连标签行、修正已知 GHS 标准短语错字，并去除重复父级标题
      const s2Lines = [];
      const normalizeS2RawLine = (line) => line
        .replace(/宇防护服/g, '穿防护服')
        .replace(/P403\+\.P233/g, 'P403+P233')
        .replace(/废物外理厂/g, '废物处理厂');
      for (const rawLine of rawS2Lines) {
        const l = normalizeS2RawLine(rawLine);
        const jamMatch = l.match(/^(?:GHS-?象形图\s+)?(必须列在标签上的有害成[份分])[：:\s]+(危害性?说明[：:]?)$/i);
        if (jamMatch) {
          s2Lines.push(`${jamMatch[1]}：`);
          s2Lines.push(jamMatch[2]);
        } else {
          s2Lines.push(l);
        }
      }
      // 若源文仅提出"必须列在标签上的有害成分"且后面紧邻其他标签（无具体成分内容），自动补全为"必须列在标签上的有害成分：无"
      for (let i = 0; i < s2Lines.length; i++) {
        if (/^必须列在标签上的有害成[份分][：:]?$/i.test(s2Lines[i])) {
          const nextL = (s2Lines[i + 1] || '').trim();
          const nextIsSectionOrLabel = !nextL || /^(?:2\.\d+|危害性?说明|危险性?说明|防范说明|预防措施|事故响应|安全储存|安全存储|废弃处置|GHS|信号词|警告词|其他危[害险])/i.test(nextL);
          if (nextIsSectionOrLabel) {
            s2Lines[i] = '必须列在标签上的有害成分：无';
          }
        }
      }

      // 注入从 Section 3 迁移归位的附注（逐行拆分并独立标注）
      if (polymerNote && !s2Lines.some(l => l.includes('聚合物GHS危险性分类'))) {
        polymerNote.split(/\r?\n/).map(x => x.trim()).filter(Boolean).forEach(x => {
          if (!s2Lines.includes(x)) s2Lines.push(x);
        });
      }
      for (const sn of saltNotes) {
        sn.split(/\r?\n/).map(x => x.trim()).filter(Boolean).forEach(x => {
          if (!s2Lines.includes(x)) s2Lines.push(x);
        });
      }

      // @FIX_TAG(2026-11-24/context-governor/FIX-S2-COMPLETE-PARENTS): 若原文缺失 2.1/2.2 父级标签（如仅写"物质或混合物分类"或直接写"GHS象形图："），自动补全父级序号与"2.2 标签要素"，并将子标签归纳于其下；同时去除连续/重复的父级标题
      const hasClassSeq = s2Lines.some(l => /^2\.\d+\s*物质或混合物的?分类/i.test(l));
      for (let i = 0; i < s2Lines.length; i++) {
        if (!hasClassSeq && /^物质或混合物的?分类[：:]?$/i.test(s2Lines[i])) {
          s2Lines[i] = '2.1 物质或混合物的分类';
          break;
        }
      }
      const seenS2Headers = new Set();
      for (let i = s2Lines.length - 1; i >= 0; i--) {
        if (hasClassSeq && /^物质或混合物的?分类[：:]?$/i.test(s2Lines[i])) {
          s2Lines.splice(i, 1);
        }
      }
      const dedupedS2Lines = [];
      for (const l of s2Lines) {
        const hdrKey = l.replace(/[：:\s]/g, '');
        const isRepeatableHdr = /^(?:2\.\d+)?(?:物质或混合物的?分类|紧急情况概述|GHS?标签要素|标签要素|危害性说明|危险性说明|防范说明)$/i.test(hdrKey);
        if (isRepeatableHdr) {
          if (seenS2Headers.has(hdrKey)) continue;
          seenS2Headers.add(hdrKey);
        }
        dedupedS2Lines.push(l);
      }
      s2Lines.length = 0;
      s2Lines.push(...dedupedS2Lines);
      // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 2 非危险品必须忠实保留源文 2.2 标签要素 下的 GHS-象形图 及其值（如 根据GHS不属于危害化学品），严禁擅自删除
      if (!governed.cn.isHazardous) {
        const s2ChildLblRe = /^(?:GHS[-\s]*象形图|危险象形标记|信号词|警告词|必须列在标签上的有害成[份分])(?:[：:]\s*(?:无|None)?)?$/i;
        const s2AnyHeaderRe = /^(?:2\.\d+\s*|(?:GHS\s*)?标签要素|物质或混合物的?分类|GHS[-\s]*分类|GHS[-\s]*象形图|危险象形标记|信号词|警告词|必须列在标签上的有害成[份分]|危险性说明|危害性说明|防范说明|预防措施|事故响应|安全储存|安全存储|废弃处置|其他危害|其他危险)/i;
        for (let i = s2Lines.length - 1; i >= 0; i--) {
          if (s2ChildLblRe.test(s2Lines[i])) {
            const nextLine = (i + 1 < s2Lines.length) ? s2Lines[i + 1].trim() : '';
            const hasInlineVal = /[：:]\s*\S+/.test(s2Lines[i]) && !/[：:]\s*(?:无|None)\s*$/i.test(s2Lines[i]);
            const hasNextValue = Boolean(nextLine && !s2AnyHeaderRe.test(nextLine));
            if (!hasInlineVal && !hasNextValue) {
              s2Lines.splice(i, 1);
            }
          }
        }
      }
      // @ANTIGRAVITY_INVARIANT_LOCK_END
      const hasLabelParent = !governed.cn.isHazardous || s2Lines.some(l => /^(?:2\.\d+\s*)?(?:GHS\s*)?标签要素[：:]?$/i.test(l));
      if (!hasLabelParent) {
        const firstLabelChildIdx = s2Lines.findIndex(l => /^(?:GHS[-\s]*象形图|危险象形标记|警告词|信号词|必须列在标签上的有害成[份分])[：:]/i.test(l));
        if (firstLabelChildIdx >= 0) {
          s2Lines.splice(firstLabelChildIdx, 0, '2.2 标签要素');
        }
      }

      // @FIX_TAG(2026-11-24/context-governor/FIX-S2-P-SUBLABELS): 继承 pipeline-engine 规范，若 S2 存在 P2xx/P3xx/P4xx/P5xx 但缺失对应中文子标签，自动注入 预防措施：/事故响应：/安全储存：/废弃处置：
      const hasAnyPSubLabel = s2Lines.some(l => /^(?:预防措施|事故响应|安全储存|安全存储|废弃处置)[：:]?$/i.test(l));
      if (!hasAnyPSubLabel) {
        const pGroups = [
          { re: /^P2\d+/i, label: '预防措施：' },
          { re: /^P3\d+/i, label: '事故响应：' },
          { re: /^P4\d+/i, label: '安全储存：' },
          { re: /^P5\d+/i, label: '废弃处置：' }
        ];
        const insertedGroups = new Set();
        const expandedS2 = [];
        for (const l of s2Lines) {
          const matchedGroup = pGroups.find(g => g.re.test(l));
          if (matchedGroup && !insertedGroups.has(matchedGroup.label)) {
            insertedGroups.add(matchedGroup.label);
            expandedS2.push(matchedGroup.label);
          }
          expandedS2.push(l);
        }
        s2Lines.length = 0;
        s2Lines.push(...expandedS2);
      }

      for (let i = 0; i < s2Lines.length; i++) {
        s2Lines[i] = s2Lines[i].replace(/^(2\.\d+\s*(?:其他危害|其他危险))\s+([^：:].+)$/, '$1：$2');
      }

      const classifyS2Line = (line) => {
        const l = line.trim();
        // @FIX_TAG(2026-11-24/context-governor/FIX-S2-ROLE-CLASSIFY): 统一将 2.X 节标题及"物质或混合物分类/紧急情况概述"归为 PARENT_HEADER，将无序号的"危害性说明/防范说明/GHS分类/GHS-象形图"归为 SUB_LABEL_KV
        if (/^(?:2\.\d+\s*(?:紧急情况概述|物质或混合物的?分类|GHS\s*危险性类别|GHS\s*标签要素|标签要素|危险性说明|危害性说明|防范说明|其他危害|其他危险)(?:[：:].*)?|物质或混合物的?分类|GHS\s*标签要素|其他危害|其他危险)[：:]?$/i.test(l)) {
          return { subRole: 'PARENT_HEADER', boldLabel: true, indentDxa: 0 };
        }
        if (/^(?:危险象形标记|GHS[-\s]*象形图|GHS\s*危险性类别|警告词|信号词|必须列在标签上的有害成分|请注意以下物质|GHS[-\s]*分类|危险性说明|危害性说明|防范说明|预防措施|事故响应|安全储存|安全存储|废弃处置|物理化学危险|健康危害|环境危害|[^：\n]*聚合物GHS危险性分类)(?:[：:]|$)/i.test(l)) {
          return { subRole: 'SUB_LABEL_KV', boldLabel: true, boldValue: false, indentDxa: 480 };
        }
        return { subRole: 'VALUE_LINE', boldLabel: false, boldValue: false, indentDxa: 480 };
      };

      const cnAnnotated = s2Lines.map((l, idx) => {
        const meta = classifyS2Line(l);
        const kv = l.match(/^([^：:]+[：:])\s*(.*)$/);
        const labelPart = meta.boldLabel && kv ? kv[1] : (meta.boldLabel ? l : null);
        const valPart = meta.boldLabel && kv ? kv[2] : (meta.boldLabel ? '' : l);
        return {
          lineIndex: idx + 1,
          role: meta.subRole,
          labelCn: labelPart,
          valueCn: valPart,
          textCn: l,
          boldLabel: Boolean(meta.boldLabel),
          boldValue: Boolean(meta.boldValue),
          indentDxa: meta.indentDxa,
          textEn: resolveEn(l, translateChemicalTerm(l), `S2:L${idx + 1}`)
        };
      });

      items.push({
        rowIndex: 1,
        role: 'FULL_WIDTH_STRUCTURED',
        layout: '通栏大纲树状层级 (无内框虚线)',
        placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' },
        lines: cnAnnotated
      });
      editorOps.push({ op: 'renderFullWidthRow', sectionNumber: 2, isSection2: true });
    } else if (s === 3) {
      // Section 3: 剥离已迁移至 S2 的附注，保留纯粹的 3.1 / 3.2 / 表头 / 组分行（多行组分强制拆分为独立行）
      for (const r of rows) {
        const full = (r.cells || []).map(c => c.text || '').join(' ').trim();
        if (r.rowIndex === 0) {
          items.push({
            rowIndex: 0,
            role: 'SECTION_HEADER',
            bold: true,
            textCn: full,
            textEn: resolveEn(full, STANDARD_SECTION_TITLE_EN[3], 'S3:R0'),
            placement: { gridType: '1_COL_MERGED', colSpan: 3, targetCol: '0..2 (通栏合并)' }
          });
          continue;
        }
        if (/(?:请注意以下物质|中和剂|已键合为盐|聚合物GHS危险性分类)/i.test(full)) {
          items.push({ rowIndex: r.rowIndex, role: 'MIGRATED_TO_S2', bold: false, textCn: full, note: '已按规范迁移至 Section 2，Section 3 物理剔除' });
          continue;
        }
        if ((r.cells || []).length >= 3 && /化学品名称|CAS/i.test(full)) {
          items.push({
            rowIndex: r.rowIndex,
            role: 'TABLE_HEADER',
            bold: true,
            cellsCn: r.cells.map(c => c.text.trim()),
            cellsEn: ['Chemical name', 'CAS NO.', 'Concentration % (w/w)'],
            placement: { gridType: '3_COL_TABLE', colSpan: 1, targetCols: [0, 1, 2] }
          });
          continue;
        }
        if ((r.cells || []).length >= 3) {
          const nameCnRaw = r.cells[0]?.text?.trim() || '';
          const casRaw = r.cells[1]?.text?.trim() || '';
          const concRaw = r.cells[r.cells.length - 1]?.text?.trim() || '';
          const names = nameCnRaw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          const cass = casRaw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          const concs = concRaw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          const rowCount = Math.max(names.length, cass.length, concs.length, 1);
          for (let k = 0; k < rowCount; k++) {
            const nCn = names[k] ?? (rowCount === 1 ? nameCnRaw : '');
            const cCn = cass[k] ?? (rowCount === 1 ? casRaw : '');
            const pCn = concs[k] ?? (rowCount === 1 ? concRaw : '');
            const subRowIdx = rowCount === 1 ? r.rowIndex : `${r.rowIndex}.${k + 1}`;
            items.push({
              rowIndex: subRowIdx,
              role: 'COMPONENT_ROW',
              bold: false,
              cellsCn: [nCn, cCn, pCn],
              cellsEn: [
                resolveEn(nCn, translateChemicalTerm(nCn), `S3:R${subRowIdx}:C0`),
                resolveEn(cCn, translateChemicalTerm(cCn), `S3:R${subRowIdx}:C1`),
                resolveEn(pCn, translateChemicalTerm(pCn), `S3:R${subRowIdx}:C2`)
              ],
              placement: { gridType: '3_COL_TABLE', colSpan: 1, targetCols: [0, 1, 2] }
            });
          }
          continue;
        }
        const c0 = r.cells?.[0]?.text?.trim() || '';
        const c1 = r.cells?.[1]?.text?.trim() || '';
        const seqInfo = parseSeqLabel(c0);
        const lblEn = seqInfo.seq ? `${seqInfo.seq} ${translateChemicalTerm(seqInfo.label.replace(/[：:]/g, ''))}:` : translateChemicalTerm(seqInfo.label);
        items.push({
          rowIndex: r.rowIndex,
          role: seqInfo.isSeq ? 'SEQ_LABEL' : 'SUB_LABEL',
          seq: seqInfo.seq,
          labelCn: seqInfo.label,
          valueCn: c1,
          labelEn: resolveEn(seqInfo.label, lblEn, `S3:R${r.rowIndex}:L`),
          valueEn: resolveEn(c1, c1 ? translateChemicalTerm(c1) : '', `S3:R${r.rowIndex}:V`),
          boldLabel: true,
          boldValue: false,
          indentDxa: seqInfo.indentDxa,
          placement: { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } }
        });
      }
    } else if (s === 11) {
      // Section 11: 通用双范式动态判定（单物质端点 -> 标准 2 列分列；同一测试条件涉及 >=2 种物质 -> 通栏）
      // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 11 删去 11.1 毒理学效应干扰行，毒理学端点从 11.1 顺次编号；多途径/父子级标签（急性毒性、生殖毒性、STOT评估）统一转为 父（子）：，整体概念（亚急性，亚慢性和延迟毒性）不加冒号
      const semanticOverrides = options?.semanticOverrides || {};
      const normalizeS11EndpointLabel = (rawEndpoint) => {
        const strippedKey = String(rawEndpoint || '').replace(/^\d+\.\d+[\s\t]*/, '').replace(/[：:]+$/, '').trim();
        const ov = semanticOverrides[strippedKey] || semanticOverrides[rawEndpoint] || null;
        return normalizeParentChildLabel(rawEndpoint, ov);
      };
      const S11_ENDPOINT_RE = /^(?:急性毒性[，,\s]*(?:经口|经皮|吸入)|急性毒性[（(](?:经口|经皮|吸入)[)）]|原发性(?:皮肤|粘膜|黏膜|眼睛)刺激|皮肤刺激|眼睛刺激|致敏性|皮肤致敏性|亚急性[，,\s]*亚慢性和延迟毒性|致癌性|生殖毒性(?:\s*\/\s*|\s*[（(])(?:生育力|致畸形)[)）]?|体外遗传毒性|体内基因毒性|STOT\s*评估(?:\s*[-–—]\s*|\s*[（(])(?:一次性接触|重复性接触|单次接触|重复接触)[)）]?|吸入危害|CMR\s*评估)[：:]?$/i;
      const S11_SUB_LINE_RE = /^(?:半数致死|方法[：:]|物种[：:]|结果[：:]|分类[：:]|试验环境[：:]|评估[：:]|测试种类[：:]|代谢活化[：:]|致癌性[：:]|致突变性[：:]|致畸性[：:]|生殖毒性|根据Buehler|皮肤致敏性|对类似产品|基于现有数据|无数据资料|11\.\d+\s*)/i;
      const parsedBlocks = [];
      let curBlock = null;
      const introLines = [];
      const allRawLines11 = [];
      for (const r of rows.slice(1)) {
        const txt = (r.cells || []).map(c => c.text || '').join('\n').trim();
        if (!txt) continue;
        txt.split(/\r?\n/).map(l => l.trim()).forEach(l => allRawLines11.push(l));
      }
      const isSingleColSource11 = rows.slice(1).every(r => (r.cells || []).length === 1);
      if (isSingleColSource11 && allRawLines11.some(l => l && S11_ENDPOINT_RE.test(l))) {
        for (const line of allRawLines11) {
          if (!line) {
            if (curBlock && curBlock.bodyLines.length > 0 && curBlock.bodyLines[curBlock.bodyLines.length - 1] !== '') {
              curBlock.bodyLines.push('');
            }
            continue;
          }
          if (/^(?:该产品无可用的毒理学研究|下面是这些成分的毒理学数据)[。.]?$/i.test(line)) {
            introLines.push(line);
            continue;
          }
          if (/^11\.\d+\s*毒理学效应[：:]?$/i.test(line)) {
            continue;
          }
          if (S11_ENDPOINT_RE.test(line)) {
            while (curBlock && curBlock.bodyLines.length > 0 && curBlock.bodyLines[curBlock.bodyLines.length - 1] === '') {
              curBlock.bodyLines.pop();
            }
            curBlock = { endpoint: line, bodyLines: [], substances: new Set() };
            parsedBlocks.push(curBlock);
          } else if (curBlock) {
            curBlock.bodyLines.push(line);
            if (!S11_SUB_LINE_RE.test(line) && !/^(?:毒理学|LD50|LC50|>|<|≥|≤|\d)/i.test(line) && line.length <= 40) {
              curBlock.substances.add(line);
            }
          } else {
            introLines.push(line);
          }
        }
        if (curBlock) {
          while (curBlock.bodyLines.length > 0 && curBlock.bodyLines[curBlock.bodyLines.length - 1] === '') {
            curBlock.bodyLines.pop();
          }
        }
      }
      const hasMultiSubstanceBlock = parsedBlocks.some(b => b.substances.size >= 2);
      const isParadigm1 = (parsedBlocks.length === 0 && (
        context1.toxicology?.paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED' ||
        rows.filter(r => r.rowIndex >= 1).some(r => (r.cells || []).length === 1 && /毒性[：:]|刺激性[：:]|LD50/i.test(r.cells[0]?.text || ''))
      )) || hasMultiSubstanceBlock;

      items.push({
        rowIndex: 0,
        role: 'SECTION_HEADER',
        bold: true,
        textCn: rawSec.title || '11. 毒性资料',
        textEn: resolveEn(rawSec.title, STANDARD_SECTION_TITLE_EN[11], 'S11:R0'),
        placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
      });
      if (parsedBlocks.length > 0 && !hasMultiSubstanceBlock) {
        if (introLines.length > 0) {
          const introCn = introLines.join('\n');
          items.push({
            rowIndex: 1,
            role: 'EXPLANATION',
            boldLabel: false,
            textCn: introCn,
            textEn: resolveEn(introCn, introLines.map(l => translateChemicalTerm(l)).join('\n'), 'S11:INTRO'),
            placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
          });
        }
        parsedBlocks.forEach((blk, bIdx) => {
          const seqNum = `11.${bIdx + 1}`;
          const normLbl = normalizeS11EndpointLabel(blk.endpoint);
          const valCn = blk.bodyLines.join('\n');
          const valEn = blk.bodyLines.map(l => l ? resolveEn(l, translateChemicalTerm(l), `S11:B${bIdx}:${l.slice(0, 12)}`) : '').join('\n');
          const lblEnClean = translateChemicalTerm(normLbl.replace(/[：:]+$/, ''));
          const lblEn = normLbl.endsWith('：') ? `${seqNum} ${lblEnClean}:` : `${seqNum} ${lblEnClean}`;
          items.push({
            rowIndex: 2 + bIdx,
            role: 'SEQ_LABEL',
            seq: seqNum,
            labelCn: `${seqNum} ${normLbl}`,
            valueCn: valCn,
            labelEn: resolveEn(normLbl, lblEn, `S11:B${bIdx}:L`),
            valueEn: valEn,
            boldLabel: true,
            boldValue: false,
            indentDxa: 420,
            placement: { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } }
          });
        });
      // @ANTIGRAVITY_INVARIANT_LOCK_END
      } else if (isParadigm1) {
        items.push({
          rowIndex: 1,
          role: 'EXPLANATION',
          bold: false,
          textCn: '该产品无可用的毒理学研究。',
          textEn: resolveEn('该产品无可用的毒理学研究。', 'No toxicological studies are available on the product.', 'S11:R1'),
          placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
        });

        const detailLines = [];
        for (const r of rows.slice(1)) {
          const txt = (r.cells || []).map(c => c.text || '').join('\n').trim();
          if (!txt) continue;
          txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(rawLine => {
            const line = rawLine
              .replace(/^该产品无可用的毒理学研究[。.]?\s*/i, '')
              .replace(/^下面是这些成分的毒理学数据[。.]?\s*/i, '')
              .trim();
            if (!line || /^(?:该产品无可用的毒理学研究|下面是这些成分的毒理学数据)[。.]?$/i.test(line)) return;
            const isComp = !/^(?:毒性|刺激性|急性毒性|主要|原发性|致敏性|皮肤致敏性|致突变性|致癌性|生殖毒性|特异性靶器官|体外遗传毒性|体内基因毒性|吸入危害|STOT|CMR|亚急性|半数致死|方法[：:]|物种[：:]|结果[：:]|分类[：:]|试验环境[：:]|评估[：:]|测试种类[：:]|代谢活化[：:]|致畸性[：:]|根据Buehler|对类似产品|基于现有数据|无数据资料|吸入|经皮|经口|LD50)/i.test(line);
            const idx = detailLines.length + 1;
            detailLines.push({
              lineIndex: idx,
              role: isComp ? 'COMPONENT_HEADER' : 'ENDPOINT_KV',
              boldLabel: true,
              boldValue: false,
              textCn: line,
              textEn: resolveEn(line, translateChemicalTerm(line), `S11:L${idx}`)
            });
          });
        }
        if (detailLines.length > 0) {
          items.push({
            rowIndex: 2,
            role: 'EXPLANATION',
            bold: false,
            textCn: '下面是这些成分的毒理学数据。',
            textEn: resolveEn('下面是这些成分的毒理学数据。', 'The following is toxicological data for these ingredients:', 'S11:R2'),
            placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
          });
          items.push({
            rowIndex: 3,
            role: 'FULL_WIDTH_STRUCTURED',
            paradigm: 'PARADIGM_1_FULL_WIDTH_MERGED',
            placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' },
            lines: detailLines
          });
          editorOps.push({ op: 'renderFullWidthRow', sectionNumber: 11, paradigm: 'PARADIGM_1_FULL_WIDTH_MERGED' });
        }
      } else {
        let s11SeqIdx = 1;
        for (const r of rows.slice(1)) {
          const c0 = r.cells?.[0]?.text?.trim() || '';
          const c1 = r.cells?.[r.cells.length - 1]?.text?.trim() || '';
          if (/^11\.\d+\s*毒理学效应[：:]?$/i.test(c0) || /^11\.\d+\s*毒理学效应[：:]?$/i.test(c1)) {
            continue;
          }
          const seqInfo = parseSeqLabel(c0);
          const isSingle = (r.cells || []).length === 1 || (!c0 && c1) || (Boolean(c0) && !c1 && !seqInfo.isSeq);
          if (isSingle) {
            const txt = c0 || c1;
            items.push({
              rowIndex: r.rowIndex,
              role: 'EXPLANATION',
              seq: null,
              labelCn: '—',
              valueCn: txt,
              textCn: txt,
              textEn: resolveEn(txt, translateChemicalTerm(txt), `S11:R${r.rowIndex}`),
              boldLabel: false,
              boldValue: false,
              indentDxa: 0,
              placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
            });
          } else {
            const isEndpoint = seqInfo.isSeq || S11_ENDPOINT_RE.test(seqInfo.label);
            const seqNum = isEndpoint ? `11.${s11SeqIdx++}` : null;
            const normLbl = isEndpoint ? normalizeS11EndpointLabel(seqInfo.label) : seqInfo.label;
            const lblEnBase = translateChemicalTerm(normLbl.replace(/[：:]+$/, ''));
            const lblEn = seqNum
              ? (normLbl.endsWith('：') ? `${seqNum} ${lblEnBase}:` : `${seqNum} ${lblEnBase}`)
              : lblEnBase;
            items.push({
              rowIndex: r.rowIndex,
              role: seqNum ? 'SEQ_LABEL' : 'SUB_LABEL',
              seq: seqNum,
              labelCn: seqNum ? `${seqNum} ${normLbl}` : normLbl,
              valueCn: c1,
              labelEn: resolveEn(normLbl, lblEn, `S11:R${r.rowIndex}:L`),
              valueEn: resolveEn(c1, translateChemicalTerm(c1), `S11:R${r.rowIndex}:V`),
              boldLabel: true,
              boldValue: false,
              indentDxa: seqNum ? 420 : seqInfo.indentDxa,
              placement: { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } }
            });
          }
        }
      }
    } else {
      // 其余标准章节 (S1, S4~S10, S12~S16): 精确纠正 Context 1 的误分类
      // @FIX_TAG(2026-11-24/context-governor/FIX-CONCISE-EN-LABELS): 精炼超长标准英文标签为 GHS/ISO 11014 简明专业术语，减少双列 KV 折行而不改动模板与拓扑
      const STANDARD_LABEL_EN = {
        '产品名称': 'Product name', '中文名称': 'Product Chinese name', '化学品分类': 'Chemical category',
        '产品使用建议和使用限制': 'Recommended use & restrictions', '供应商信息': 'Supplier information',
        '供应商名称': 'Name of supplier', '供应商地址': 'Supplier address', '电话': 'Tel', '传真': 'Fax',
        '一般措施': 'General measures', '误服': 'Ingestion', '接触眼睛': 'Eye contact', '接触皮肤': 'Skin contact', '吸入': 'Inhalation',
        '合适的灭火剂': 'Suitable extinguishing media', '不合适的灭火剂': 'Unsuitable extinguishing media',
        '物质或混合物的特殊危害': 'Special hazards of mixture', '消防预防措施和保护设备': 'Firefighting precautions & PPE',
        '个人预防措施、应急程序': 'Personal precautions & emergency procedures', '环境保护措施': 'Environmental precautions', '污染物收集和清除的方法': 'Containment & clean-up methods',
        '安全操作防范': 'Safe handling precautions', '安全储存条件': 'Safe storage conditions',
        '运输危险级别': 'Transport hazard class(es)', '包装类型': 'Packing group', '环境危险': 'Environmental hazards',
        '特殊防范措施': 'Special precautions for user', '附加信息': 'Additional information',
        '按《MARPOL73/78》公约附则II和IBC规则': 'Transport in bulk according to Annex II of MARPOL73/78 and the IBC Code',
        '控制参数': 'Control parameters', '暴露控制': 'Exposure controls', '呼吸系统防护': 'Respiratory protection',
        '手部防护': 'Hand protection', '防护手套的合适材料': 'Suitable glove material', '建议': 'Recommendation',
        '眼睛防护': 'Eye protection', '身体防护': 'Body protection', '工程控制': 'Engineering controls',
        '化学稳定性': 'Chemical stability', '危险分解产物': 'Hazardous decomposition products', '可能的危害反应': 'Hazardous reactions',
        '生态毒性': 'Ecotoxicity', '持久性和降解性': 'Persistence & degradability', '其他不利的影响': 'Other adverse effects',
        '处理方法': 'Disposal methods', '公路和铁路运输': 'Road and rail transport', '海上运输': 'Maritime transport',
        '空运': 'Air transport', '用户特殊注意事项': 'User precautions',
        '联合国编号': 'UN Number', '联合国运输名称': 'UN Proper Shipping Name',
        '水溶性': 'Water solubility', '粘度/25℃': 'Viscosity / 25°C', '密度': 'Density', '羟基含量': 'Hydroxyl content', '自燃温度': 'Auto-ignition temperature',
        '闪点（闭口）': 'Flash point (closed cup)', '离子性': 'Ionicity', '分解温度': 'Decomposition temperature',
        '爆炸特性': 'Explosive properties', '粉尘爆炸级别': 'Dust explosion class', '急性毒性': 'Acute toxicity',
        '急性毒性（经口）': 'Acute toxicity (oral)', '急性毒性（经皮）': 'Acute toxicity (dermal)', '急性毒性（吸入）': 'Acute toxicity (inhalation)',
        '亚急性，亚慢性和延迟毒性': 'Subacute, subchronic and delayed toxicity',
        '生殖毒性（生育力）': 'Reproductive toxicity (fertility)', '生殖毒性（致畸形）': 'Reproductive toxicity (teratogenicity)',
        'STOT评估（一次性接触）': 'STOT assessment (single exposure)', 'STOT 评估（一次性接触）': 'STOT assessment (single exposure)',
        'STOT评估（重复性接触）': 'STOT assessment (repeated exposure)', 'STOT 评估（重复性接触）': 'STOT assessment (repeated exposure)',
        '最低成膜温度MFFT/℃': 'Minimum film-forming temperature (MFFT)/°C', '最低成膜温度MFFT': 'Minimum film-forming temperature (MFFT)',
        '玻璃化温度Tg/℃': 'Glass transition temperature (Tg)/°C', '玻璃化温度Tg': 'Glass transition temperature (Tg)',
        '其它的规定': 'Other provisions', '其它规定': 'Other provisions', '符合下列法规要求': 'Complies with the following regulations'
      };
      const translateLineEn = (cnStr) => {
        if (!cnStr) return '';
        let t = sanitizeDegreeAndPunctuation(cnStr);
        t = translateChemicalTerm(t);
        t = t
          .replace(/立即脱掉所有被污染的衣物[。.]?/g, 'Remove all contaminated clothing immediately.')
          .replace(/禁止催吐[，,]?\s*须就医[。.]?/g, 'Do NOT induce vomiting. Seek medical attention.')
          .replace(/撑开眼睑[，,]?\s*用温水长时间冲洗[（(]至少10分钟[）)][，,]?\s*就诊眼科医生[。.]?/g, 'Hold eyelids open and flush with plenty of warm water for at least 10 minutes. Consult an ophthalmologist.')
          .replace(/立即用肥皂和大量的水冲洗[。.]?\s*若发生皮肤反应[，,]?\s*就医[。.]?/g, 'Wash immediately with soap and plenty of water. If skin reaction occurs, seek medical advice.')
          .replace(/若刺激呼吸道[，,]?\s*就医[。.]?/g, 'If respiratory irritation occurs, seek medical advice.')
          .replace(/二氧化碳（CO2）[，,]?\s*泡沫[，,]?\s*灭火粉末[，,]?\s*大火时应用喷洒水[。.]?/g, 'Carbon dioxide (CO2), foam, extinguishing powder. For large fires, use water spray.')
          .replace(/高流量的水喷射[。.]?/g, 'High-volume water jet.')
          .replace(/戴防护设备[。.]?/g, 'Wear protective equipment.')
          .replace(/确保充分的通风\/排气[。.]?\s*令未授权人员离开[。.]?/g, 'Ensure adequate ventilation and/or exhaust ventilation. Keep unauthorized persons away.')
          .replace(/禁止排入下水道[，,]?\s*废水或土壤中[。.]?/g, 'Do not discharge into drains, wastewater, or soil.')
          .replace(/根据EC指令2006\/121\/E[GC][，,]?\s*无可用的接触限值信息[。.]?/gi, 'No exposure limit information is available under EC Directive 2006/121/EC.')
          .replace(/戴眼罩\/面罩[。.]?/g, 'Wear protective goggles/face shield.')
          .replace(/穿着适当的防护服[。.]?/g, 'Wear appropriate protective clothing.')
          .replace(/污染的手套应废弃[。.]?/g, 'Discard contaminated gloves.')
          .replace(/喷涂过程中要求有呼吸防护设备[。.]?/g, 'Respiratory protection equipment is required during spraying.')
          .replace(/非危险品陆运输方式[。.]?/g, 'Not classified as dangerous goods for land transport.')
          .replace(/非危险品海运方式[，,]?\s*符合IMDG准则[。.]?/g, 'Not classified as dangerous goods for sea transport, in accordance with IMDG Code.')
          .replace(/非危险品运输方式[，,]?\s*符合IATA准则[。.]?/g, 'Not classified as dangerous goods for air transport, in accordance with IATA Dangerous Goods Regulations.')
          .replace(/非危险(?:品|货物)[。.]?\s*/g, 'Not classified as dangerous goods. ')
          .replace(/温度不可高于\s*([+\-－−–]?\d+)\s*(?:°C|℃|C)?[，,]?\s*温度不可低于\s*([+\-－−–]?\d+)\s*(?:°C|℃|C)?[。.]?/gi, (_, hi, lo) => {
            const norm = v => v.replace(/[－−–]/g, '-');
            return `Temperature must not exceed ${norm(hi)}°C and must not fall below ${norm(lo)}°C.`;
          })
          .replace(/远离食物、酸和碱[。.]?/g, 'Keep away from food, acids and bases.')
          .replace(/物质或混合物的相关安全、健康和环保法律法规/g, 'Relevant safety, health and environmental regulations for the substance or mixture.')
          .replace(/危险化学品安全管理条例[，,]?\s*国务院令(?:591|344)号/g, 'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.')
          .replace(/GB\/T\s*16483(?:-2008)?[^\n]*/g, 'GB/T 16483 Safety data sheet for chemical products - Content and order of sections.')
          .replace(/GB\s*13690(?:-2009)?[^\n]*/g, 'GB 13690 General rules for classification and hazard communication of chemicals.')
          .replace(/GB\s*(?:30000\.2-29|20576[^\n]*)/g, 'GB 30000.2-29 Rules for classification and labelling of chemicals.')
          .replace(/GB\s*15258[^\n]*/g, 'GB 15258 General rules for preparation of precautionary label for chemicals.')
          .replace(/^(\d+(?:\s*[-–]\s*\d+)?\s*\([^)]+\))\.$/, '$1');
        return t;
      };

      for (const r of rows) {
        const c0 = r.cells?.[0]?.text?.trim() || '';
        const c1 = r.cells?.[1]?.text?.trim() || '';
        if (r.rowIndex === 0) {
          const hdrCn = c0 || rawSec.title;
          items.push({
            rowIndex: 0,
            role: 'SECTION_HEADER',
            bold: true,
            textCn: hdrCn,
            textEn: resolveEn(hdrCn, STANDARD_SECTION_TITLE_EN[s] || translateLineEn(hdrCn), `S${s}:R0`),
            placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
          });
          continue;
        }
        if (!c0 && !c1 && (r.cells || []).every(c => !(c.text || '').trim())) continue;
        if (r._consumedByPrev) continue;
        const cellCount = (r.cells || []).length;
        if (s === 8 && cellCount >= 3) {
          const cellsCn = (r.cells || []).map(c => (c.text || '').trim());
          const fullRow = cellsCn.join(' | ');
          const isHdr = /物质|CAS|TWA|STEL|限值|OEL|组分|MAC/i.test(fullRow);
          items.push({
            rowIndex: r.rowIndex,
            role: isHdr ? 'TABLE_HEADER' : 'OEL_ROW',
            bold: isHdr,
            cellsCn,
            cellsEn: cellsCn.map((cell, ci) => resolveEn(cell, translateLineEn(cell), `S8:R${r.rowIndex}:C${ci}`)),
            placement: { gridType: 'MULTI_COL_TABLE', colSpan: 1, targetCols: cellsCn.map((_, ci) => ci) }
          });
          continue;
        }
        if (cellCount === 1) {
          // S8 扁平化 OEL 4列表格文本块通用结构化解析
          if (s === 8 && /工作场所.*控制参数/.test(c0) && /物质[\r\n]+依据[\r\n]+类型[\r\n]+数值/.test(c0)) {
            const oelLines = c0.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
            const hdrIdx = oelLines.findIndex(x => x === '物质');
            if (hdrIdx >= 0 && oelLines[hdrIdx + 1] === '依据' && oelLines[hdrIdx + 2] === '类型' && oelLines[hdrIdx + 3] === '数值') {
              if (hdrIdx > 0) {
                const titleCn = oelLines.slice(0, hdrIdx).join(' ');
                items.push({
                  rowIndex: r.rowIndex,
                  role: 'EXPLANATION',
                  seq: null,
                  labelCn: '—',
                  valueCn: titleCn,
                  textCn: titleCn,
                  labelEn: '—',
                  valueEn: resolveEn(titleCn, 'Workplace component control parameters', `S8:R${r.rowIndex}:T`),
                  textEn: resolveEn(titleCn, 'Workplace component control parameters', `S8:R${r.rowIndex}:T`),
                  boldLabel: false,
                  boldValue: false,
                  indentDxa: 0,
                  placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
                });
              }
              const hdrCells = oelLines.slice(hdrIdx, hdrIdx + 4);
              items.push({
                rowIndex: r.rowIndex,
                role: 'TABLE_HEADER',
                bold: true,
                cellsCn: hdrCells,
                cellsEn: ['Substance', 'Basis', 'Type', 'Value'],
                placement: { gridType: 'MULTI_COL_TABLE', colSpan: 1, targetCols: [0, 1, 2, 3] }
              });
              for (let k = hdrIdx + 4; k + 3 < oelLines.length; k += 4) {
                const rowCells = oelLines.slice(k, k + 4);
                items.push({
                  rowIndex: r.rowIndex,
                  role: 'OEL_ROW',
                  bold: false,
                  cellsCn: rowCells,
                  cellsEn: rowCells.map((cell, ci) => resolveEn(cell, translateLineEn(cell), `S8:R${r.rowIndex}:C${ci}`)),
                  placement: { gridType: 'MULTI_COL_TABLE', colSpan: 1, targetCols: [0, 1, 2, 3] }
                });
              }
              continue;
            }
          }
          const seqInfo = parseSeqLabel(c0);
          // @FIX_TAG(2026-11-23/context-governor/FIX-S8-GLOVE-KV): S8 手套明细按标准拆分为 2_COL_KV（标签-值），与模板双列拓扑1:1对齐
          const ppeKv = s === 8 && c0.match(/^((?:氟化橡胶|丁基橡胶|丁腈橡胶)[^：:]*[：:])\s*(.*)$/);
          if (ppeKv) {
            const lblCn = ppeKv[1].replace(/:$/, '：');
            const valCn = sanitizeDegreeAndPunctuation(ppeKv[2]);
            const defaultLblEn = lblCn
              .replace(/氟化橡胶\s*[–-]\s*FKM[：:]?/, 'Fluororubber – FKM:')
              .replace(/丁基橡胶\s*[–-]\s*IIR[：:]?/, 'Butyl rubber – IIR:')
              .replace(/丁腈橡胶\s*[–-]\s*NBR[：:]?/, 'Nitrile rubber – NBR:');
            const defaultValEn = sanitizeDegreeAndPunctuation(translateChemicalTerm(valCn));
            items.push({
              rowIndex: r.rowIndex,
              role: 'SUB_LABEL',
              seq: null,
              labelCn: lblCn,
              cleanKey: lblCn.replace(/[：:\s]/g, ''),
              valueCn: valCn,
              labelEn: resolveEn(lblCn, defaultLblEn, `S8:R${r.rowIndex}:L`),
              valueEn: resolveEn(valCn, defaultValEn, `S8:R${r.rowIndex}:V`),
              boldLabel: true,
              boldValue: false,
              indentDxa: 420,
              placement: { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } }
            });
            continue;
          }
          const isBoldLabel = /^(?:其它的规定|其它规定|符合下列法规要求|暴露控制|控制参数|手部防护|处理方法)[：:]?$/i.test(seqInfo.label);
          if (s === 8 && /控制参数/.test(seqInfo.cleanKey)) {
            const nextRow = rows.find(nr => nr.rowIndex === r.rowIndex + 1);
            const nextText = (nextRow?.cells || []).map(c => (c.text || '').trim()).filter(Boolean).join(' ');
            if (nextRow && (nextRow.cells || []).length === 1 && /不含有职业接触限值|无数据/i.test(nextText)) {
              const valCn = sanitizeDegreeAndPunctuation(nextText);
              const lblEnBase = STANDARD_LABEL_EN[seqInfo.cleanKey] || translateChemicalTerm(seqInfo.label.replace(/[：:]/g, ''));
              const defaultLblEn = seqInfo.seq ? `${seqInfo.seq} ${lblEnBase}:` : `${lblEnBase}:`;
              items.push({
                rowIndex: r.rowIndex,
                role: seqInfo.isSeq ? 'SEQ_LABEL' : 'SUB_LABEL',
                seq: seqInfo.seq,
                labelCn: seqInfo.label,
                cleanKey: seqInfo.cleanKey,
                valueCn: valCn,
                labelEn: resolveEn(seqInfo.label, defaultLblEn, `S8:R${r.rowIndex}:L`),
                valueEn: resolveEn(valCn, translateLineEn(valCn), `S8:R${r.rowIndex}:V`),
                boldLabel: true,
                boldValue: false,
                indentDxa: seqInfo.indentDxa,
                placement: { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } }
              });
              nextRow._consumedByPrev = true;
              continue;
            }
          }
          const isRegItem = s === 15 && /^(?:危险化学品|GB)/i.test(c0);
          const valCn = isBoldLabel || seqInfo.isSeq ? '' : sanitizeDegreeAndPunctuation(c0);
          const resolvedEnText = resolveEn(c0, translateLineEn(c0), `S${s}:R${r.rowIndex}`);
          const lblEnBase = STANDARD_LABEL_EN[seqInfo.cleanKey] || translateChemicalTerm(seqInfo.label.replace(/[：:]/g, ''));
          const defaultLblEn = seqInfo.seq ? `${seqInfo.seq} ${lblEnBase}:` : `${lblEnBase}:`;
          items.push({
            rowIndex: r.rowIndex,
            role: seqInfo.isSeq ? 'SEQ_LABEL' : (isBoldLabel ? 'SUB_LABEL' : (isRegItem ? 'REGULATION_ITEM' : 'EXPLANATION')),
            seq: seqInfo.seq,
            labelCn: isBoldLabel || seqInfo.isSeq ? seqInfo.label : '—',
            cleanKey: seqInfo.cleanKey,
            labelEn: isBoldLabel || seqInfo.isSeq ? resolveEn(seqInfo.label, defaultLblEn, `S${s}:R${r.rowIndex}:L`) : '—',
            valueCn: valCn,
            valueEn: isBoldLabel || seqInfo.isSeq ? '' : resolvedEnText,
            textCn: c0,
            textEn: resolvedEnText,
            boldLabel: Boolean(isBoldLabel || seqInfo.isSeq),
            boldValue: false,
            indentDxa: seqInfo.isSeq ? seqInfo.indentDxa : 0,
            placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
          });
        } else if (!c0 && c1) {
          const valCn = sanitizeDegreeAndPunctuation(c1);
          const prevItem = items[items.length - 1];
          if (s !== 8 && s !== 13 && s !== 15 && prevItem && prevItem.role === 'SEQ_LABEL' && prevItem.placement?.gridType === '2_COL_KV') {
            const valEnPart = resolveEn(valCn, translateLineEn(valCn), `S${s}:R${r.rowIndex}`);
            prevItem.valueCn = prevItem.valueCn ? `${prevItem.valueCn}\n${valCn}` : valCn;
            prevItem.valueEn = prevItem.valueEn ? `${prevItem.valueEn}\n${valEnPart}` : valEnPart;
            continue;
          }
          items.push({
            rowIndex: r.rowIndex,
            role: 'EXPLANATION',
            seq: null,
            labelCn: '—',
            valueCn: valCn,
            textCn: valCn,
            textEn: resolveEn(valCn, translateLineEn(valCn), `S${s}:R${r.rowIndex}`),
            boldLabel: false,
            boldValue: false,
            indentDxa: 0,
            placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
          });
        } else {
          // @FIX_TAG(2026-11-23/context-governor/FIX-SPACE-PACKED-KV): 通用多行打包 KV 拆分：兼容右值被压成单行空格分隔（如 "无数据 65℃"）及含无序号子标签（如 S14 附加信息：）的多行打包格
          const c0Lines = c0.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          let c1Lines = c1.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          const seqC0Count = c0Lines.filter(l => /^\d+\.\d+/.test(l)).length;
          if (c0Lines.length > 1 && seqC0Count === c0Lines.length && c1Lines.length === 1) {
            const spaceTokens = c1Lines[0].match(/无数据|不适用|\S+/g) || [];
            if (spaceTokens.length === c0Lines.length) c1Lines = spaceTokens;
          }
          let kvPairs = [{ rawLbl: c0, rawVal: c1 }];
          if (c0Lines.length > 1 && seqC0Count >= 2) {
            if (c0Lines.length === c1Lines.length) {
              kvPairs = c0Lines.map((l, idx) => ({ rawLbl: l, rawVal: c1Lines[idx] }));
            } else if (c1Lines.length > c0Lines.length) {
              // 若某无序号说明标签（如"附加信息："）对应多行右值，将其前后固定序号行首尾对齐后合并中间多行右值
              const extraIdx = c0Lines.findIndex(l => !/^\d+\.\d+/.test(l) && /[：:]$/.test(l));
              if (extraIdx > 0) {
                const tailCount = c0Lines.length - 1 - extraIdx;
                const headVals = c1Lines.slice(0, extraIdx);
                const midVal = c1Lines.slice(extraIdx, c1Lines.length - tailCount).join('\n');
                const tailVals = tailCount > 0 ? c1Lines.slice(c1Lines.length - tailCount) : [];
                const alignedVals = [...headVals, midVal, ...tailVals];
                if (alignedVals.length === c0Lines.length) {
                  kvPairs = c0Lines.map((l, idx) => ({ rawLbl: l, rawVal: alignedVals[idx] }));
                }
              }
            }
          }

          for (const pair of kvPairs) {
            const seqInfo = parseSeqLabel(pair.rawLbl);
            let cleanValCn = sanitizeDegreeAndPunctuation(pair.rawVal);
            // @FIX_TAG(2026-11-23/context-governor/FIX-CN-PROSE-PUNCT): 中文长句正文多行/句末缺句号自动闭合，避免换行无标点
            if ([4, 5, 6, 7, 10, 12, 13].includes(s) && cleanValCn) {
              cleanValCn = cleanValCn
                .split('\n')
                .map(seg => {
                  const st = seg.trim();
                  return (/[\u4e00-\u9fa5]{6,}$/.test(st) && !/[。！？.!?:：]$/.test(st)) ? `${st}。` : st;
                })
                .join('\n');
            }
            // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 1 中文名称硬性拼接型号（如 羟基聚氨酯分散体 HPU-7651），英文合并写入完整英文品名 + 型号，严禁审计误判或擅自剥离
            if (s === 1 && /中文名称|产品中文名称/i.test(seqInfo.cleanKey) && modelCode && cleanValCn && !cleanValCn.toUpperCase().includes(modelCode.toUpperCase())) {
              cleanValCn = `${cleanValCn} ${modelCode}`.trim();
            }
            const condMatch = cleanValCn.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);
            const lblEnBase = STANDARD_LABEL_EN[seqInfo.cleanKey] || translateChemicalTerm(seqInfo.label.replace(/[：:]/g, ''));
            const hasTempUnitSuffix = /\/[℃°]C?/i.test(seqInfo.label);
            const lblEnWithUnit = (hasTempUnitSuffix && !/[℃°]C?/i.test(lblEnBase))
              ? `${lblEnBase.replace(/[:：]$/, '')}/°C`
              : lblEnBase;
            const defaultLblEn = seqInfo.seq ? `${seqInfo.seq} ${lblEnWithUnit}:` : `${lblEnWithUnit}:`;
            let defaultValEn = translateLineEn(cleanValCn);
            if (s === 1 && /中文名称|产品中文名称/i.test(seqInfo.cleanKey) && modelCode && !defaultValEn.toUpperCase().includes(modelCode.toUpperCase())) {
              const baseCn = cleanValCn.replace(new RegExp(`\\s*${modelCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'), '').trim();
              const baseEn = /水溶性.*丙烯酸树脂/.test(baseCn) ? 'Water-soluble acrylic resin' : translateLineEn(baseCn);
              defaultValEn = `${baseEn} ${modelCode}`.trim();
            }
            // @ANTIGRAVITY_INVARIANT_LOCK_END
            items.push({
              rowIndex: r.rowIndex,
              role: seqInfo.isSeq ? 'SEQ_LABEL' : 'SUB_LABEL',
              seq: seqInfo.seq,
              labelCn: seqInfo.label,
              cleanKey: seqInfo.cleanKey,
              valueCn: cleanValCn,
              valuePure: condMatch ? condMatch[1].trim() : cleanValCn,
              conditionCn: condMatch ? condMatch[2].trim() : null,
              labelEn: resolveEn(seqInfo.label, defaultLblEn, `S${s}:R${r.rowIndex}:L`),
              valueEn: resolveEn(cleanValCn, defaultValEn, `S${s}:R${r.rowIndex}:V`),
              boldLabel: true,
              boldValue: false,
              indentDxa: seqInfo.indentDxa,
              placement: { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } }
            });
          }
        }
      }
      if (s === 8) {
        // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 8 唯一规范顺序契约（8.1 暴露控制 严格先于 8.2 控制参数），严禁擅自更改或回退为源文反向顺序
        const hdrItems = items.filter(it => it.role === 'SECTION_HEADER');
        const bodyItems = items.filter(it => it.role !== 'SECTION_HEADER');
        const isExpHdr = (it) => /暴露控制|Exposure\s*controls?/i.test(it.cleanKey || it.labelCn || it.textCn || '');
        const isCtrlHdr = (it) => /^(?:\d+\.\d+\s*)?控制参数|Control\s*parameters?/i.test(it.cleanKey || it.labelCn || it.textCn || '') && !/工作场所.*控制参数/i.test(it.textCn || it.labelCn || '');
        const expGroup = [];
        const ctrlGroup = [];
        const otherGroup = [];
        let activeBucket = otherGroup;
        for (const it of bodyItems) {
          if (isExpHdr(it)) {
            it.seq = '8.1';
            it.role = 'SEQ_LABEL';
            it.labelCn = '8.1 暴露控制：';
            it.labelEn = '8.1 Exposure controls:';
            it.textCn = '8.1 暴露控制：';
            it.textEn = '8.1 Exposure controls:';
            it.cleanKey = '暴露控制';
            it.indentDxa = 420;
            activeBucket = expGroup;
            activeBucket.push(it);
          } else if (isCtrlHdr(it)) {
            it.seq = '8.2';
            it.role = 'SEQ_LABEL';
            it.labelCn = '8.2 控制参数：';
            it.labelEn = '8.2 Control parameters:';
            it.textCn = '8.2 控制参数：';
            it.textEn = '8.2 Control parameters:';
            it.cleanKey = '控制参数';
            it.indentDxa = 420;
            activeBucket = ctrlGroup;
            activeBucket.push(it);
          } else {
            activeBucket.push(it);
          }
        }
        // 8.2 控制参数：若紧随其后为单行说明（如 "根据EC指令2006/121/EG,无可用的接触限值信息"），合并为 8.2 的右侧值形成两列结构
        if (ctrlGroup.length > 1 && !(ctrlGroup[0].valueCn || '').trim()) {
          const nextIt = ctrlGroup[1];
          const nextTxtCn = (nextIt.textCn || nextIt.valueCn || '').trim();
          const nextTxtEn = (nextIt.textEn || nextIt.valueEn || '').trim();
          if (nextIt.role === 'EXPLANATION' || /根据\s*EC\s*指令|无可用的接触限值|No\s+exposure\s+limit/i.test(nextTxtCn)) {
            ctrlGroup[0].valueCn = nextTxtCn;
            ctrlGroup[0].valueEn = nextTxtEn || translateLineEn(nextTxtCn);
            ctrlGroup[0].placement = { gridType: '2_COL_KV', colSpan: 1, targetCols: { label: 0, value: 1 } };
            ctrlGroup.splice(1, 1);
          }
        }
        items.length = 0;
        items.push(...hdrItems, ...expGroup, ...ctrlGroup, ...otherGroup);
        // @ANTIGRAVITY_INVARIANT_LOCK_END
      }
      if (s === 9) {
        editorOps.push({ op: 'formatLaserTabs', sectionNumber: 9, ruler: '420/560 dxa' });
      }
    }

    annotatedSections[s] = {
      sectionNumber: s,
      title: rawSec.title,
      itemsCount: items.length,
      items
    };
  }

  // Context 2 输入规范全局文本归一化管道 (REQ-C2-01, REQ-C2-02)
  const normalizeSharedSymbols = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(/≧/g, '≥')
      .replace(/≦/g, '≤')
      .replace(/(\d+(?:\.\d+)?)\s*(g\/cm3|g\/cm³|mm|min|cm|mg|kg|hPa|mPa·s|mPa\.s)\b/gi, '$1 $2');
  };
  const normalizeCnText = (str) => {
    if (!str || typeof str !== 'string') return str;
    return normalizeSharedSymbols(str)
      .replace(/(\b(?:mm|min|cm|mg|kg|hPa))\.(?=\s|$|；|;)/gi, '$1');
  };
  const normalizeEnText = (str) => {
    if (!str || typeof str !== 'string') return str;
    return healEnSpacing(normalizeSharedSymbols(str)
      .replace(/：/g, ':')
      .replace(/（/g, ' (')
      .replace(/）/g, ')')
      .replace(/[ \t]{2,}/g, ' ')
      .trim());
  };

  for (let s = 1; s <= 16; s++) {
    for (const item of annotatedSections[s]?.items || []) {
      if (item.labelCn) item.labelCn = normalizeCnText(item.labelCn);
      if (item.valueCn) item.valueCn = normalizeCnText(item.valueCn);
      if (item.textCn) item.textCn = normalizeCnText(item.textCn);
      if (item.valuePure) item.valuePure = normalizeCnText(item.valuePure);
      if (item.labelEn) item.labelEn = normalizeEnText(item.labelEn);
      if (item.valueEn) item.valueEn = normalizeEnText(item.valueEn);
      if (item.textEn) item.textEn = normalizeEnText(item.textEn);
      if (Array.isArray(item.cellsCn)) item.cellsCn = item.cellsCn.map(normalizeCnText);
      if (Array.isArray(item.cellsEn)) item.cellsEn = item.cellsEn.map(normalizeEnText);
      if (Array.isArray(item.lines)) {
        for (const sub of item.lines) {
          if (sub.labelCn) sub.labelCn = normalizeCnText(sub.labelCn);
          if (sub.valueCn) sub.valueCn = normalizeCnText(sub.valueCn);
          if (sub.textCn) sub.textCn = normalizeCnText(sub.textCn);
          if (sub.textEn) sub.textEn = normalizeEnText(sub.textEn);
        }
      }
    }
    // @FIX_TAG(2026-11-24/context-governor/FIX-S2-START-AT-21): Section 2 序号统一从 .1 开始（若含 2.0 紧急情况概述，则顺延重排为 2.1, 2.2, 2.3, 2.4...）
    if (s === 2) {
      for (const item of annotatedSections[2]?.items || []) {
        if (item.role !== 'FULL_WIDTH_STRUCTURED' || !Array.isArray(item.lines)) continue;
        const has20 = item.lines.some(sub => /^2\.0\b/.test(String(sub.textCn || '').trim()));
        if (!has20) continue;
        let nextSub = 1;
        for (const sub of item.lines) {
          const cnTrim = String(sub.textCn || '').trim();
          if (/^2\.\d+\b/.test(cnTrim)) {
            const newSeq = `2.${nextSub++}`;
            sub.textCn = cnTrim.replace(/^2\.\d+\b/, newSeq);
            if (sub.labelCn && /^2\.\d+\b/.test(sub.labelCn.trim())) {
              sub.labelCn = sub.labelCn.trim().replace(/^2\.\d+\b/, newSeq);
            }
            if (sub.textEn && /^2\.\d+\b/.test(sub.textEn.trim())) {
              sub.textEn = sub.textEn.trim().replace(/^2\.\d+\b/, newSeq);
            }
          }
        }
      }
    }
  }

  // 全量英文完整性审计：任何英文输出槽位残留中文字符均标记为待 Agent 逐句翻译项
  const hasCJK = (v) => /[\u4e00-\u9fff]/.test(String(v || ''));
  const untranslatedItems = [];
  let totalItems = 0;
  let emptySectionsCount = 0;

  for (let s = 1; s <= 16; s++) {
    const sec = annotatedSections[s];
    const secItems = sec?.items || [];
    totalItems += secItems.length;
    if (secItems.length === 0) emptySectionsCount++;

    for (const item of secItems) {
      if (item.role === 'MIGRATED_TO_S2') continue;
      if (item.role === 'FULL_WIDTH_STRUCTURED') {
        for (const sub of item.lines || []) {
          if (hasCJK(sub.textEn)) {
            untranslatedItems.push({
              sectionNumber: s,
              rowIndex: `L${sub.lineIndex}`,
              role: sub.role,
              field: 'textEn',
              cnSource: sub.textCn || `${sub.labelCn || ''}${sub.valueCn || ''}`,
              currentEn: sub.textEn
            });
          }
        }
      } else if (item.role === 'TABLE_HEADER' || item.role === 'COMPONENT_ROW' || item.role === 'OEL_ROW') {
        (item.cellsEn || []).forEach((cEn, ci) => {
          if (hasCJK(cEn)) {
            untranslatedItems.push({
              sectionNumber: s,
              rowIndex: item.rowIndex,
              role: item.role,
              field: `cellsEn[${ci}]`,
              cnSource: item.cellsCn?.[ci] || '',
              currentEn: cEn
            });
          }
        });
      } else {
        if (hasCJK(item.labelEn)) {
          untranslatedItems.push({
            sectionNumber: s,
            rowIndex: item.rowIndex,
            role: item.role,
            field: 'labelEn',
            cnSource: item.labelCn || '',
            currentEn: item.labelEn
          });
        }
        if (hasCJK(item.valueEn)) {
          untranslatedItems.push({
            sectionNumber: s,
            rowIndex: item.rowIndex,
            role: item.role,
            field: 'valueEn',
            cnSource: item.valueCn || '',
            currentEn: item.valueEn
          });
        }
        if (hasCJK(item.textEn)) {
          untranslatedItems.push({
            sectionNumber: s,
            rowIndex: item.rowIndex,
            role: item.role,
            field: 'textEn',
            cnSource: item.textCn || item.valueCn || '',
            currentEn: item.textEn
          });
        }
      }
    }
  }

  // 构建去重待译模板 + 数字/CAS 守恒校验
  const untranslatedTemplate = {};
  for (const u of untranslatedItems) {
    const key = String(u.cnSource || '').replace(/\r\n/g, '\n').trim();
    if (key && !(key in untranslatedTemplate)) {
      untranslatedTemplate[key] = '';
    }
  }

  const numericMismatches = [];
  const checkNumericConservation = (sectionNumber, rowIndex, field, cnSrc, enVal) => {
    if (!cnSrc || !enVal || hasCJK(enVal)) return;
    const strippedCn = String(cnSrc).replace(/^\s*\d+(?:\.\d+)*\s*/, '');
    const nums = strippedCn.match(/\d+(?:[.-]\d+)*/g) || [];
    const normEn = String(enVal).replace(/[－−–]/g, '-').replace(/³/g, '3').replace(/²/g, '2').replace(/¹/g, '1');
    for (const n of nums) {
      if (!normEn.includes(n) && !normEn.includes(n.replace(/-/g, ' '))) {
        numericMismatches.push({ sectionNumber, rowIndex, field, missingNumber: n, cnSource: cnSrc, currentEn: enVal });
        break;
      }
    }
  };
  for (let s = 1; s <= 16; s++) {
    for (const item of (annotatedSections[s]?.items || [])) {
      if (item.role === 'MIGRATED_TO_S2' || item.role === 'SECTION_HEADER') continue;
      if (item.role === 'FULL_WIDTH_STRUCTURED') {
        for (const sub of (item.lines || [])) {
          checkNumericConservation(s, `L${sub.lineIndex}`, 'textEn', sub.textCn, sub.textEn);
        }
      } else if (item.role === 'TABLE_HEADER' || item.role === 'COMPONENT_ROW' || item.role === 'OEL_ROW') {
        (item.cellsEn || []).forEach((cEn, ci) => checkNumericConservation(s, item.rowIndex, `cellsEn[${ci}]`, item.cellsCn?.[ci], cEn));
      } else {
        checkNumericConservation(s, item.rowIndex, 'valueEn', item.valueCn, item.valueEn);
        checkNumericConservation(s, item.rowIndex, 'textEn', item.textCn, item.textEn);
      }
    }
  }

  // CAS 号跨阶段事实指纹守恒校验 (Hybrid Context 2 机械硬锁：严禁语义归类或翻译丢失任何 CAS 号)
  const extractCasSet = (txt) => new Set(String(txt || '').match(/\b\d{2,7}-\d{2}-\d\b/g) || []);
  const srcCasSet = extractCasSet(JSON.stringify(context1?.sections || {}));
  const ctx2CasSet = extractCasSet(JSON.stringify(annotatedSections || {}));
  const casMismatches = [];
  for (const cas of srcCasSet) {
    if (!ctx2CasSet.has(cas)) casMismatches.push(cas);
  }
  const factFingerprintOk = numericMismatches.length === 0 && casMismatches.length === 0;

  return {
    modelCode,
    generatedAt: new Date().toISOString(),
    stage: 'CONTEXT_2_STRUCTURED_GOVERNED',
    isHazardous: governed.cn.isHazardous,
    sourceFile: context1.sourceFile || context1.sourcePath || options?.sourceFile || null,
    governedModel: governed,
    sections: annotatedSections,
    editorOps,
    validation: {
      coveredSections: 16 - emptySectionsCount,
      emptySectionsCount,
      totalItems,
      tmSize: Object.keys(tm).length,
      untranslatedCount: untranslatedItems.length,
      numericMismatchCount: numericMismatches.length,
      casMismatchCount: casMismatches.length,
      casMismatches,
      factFingerprintOk,
      needsAgentTranslation: untranslatedItems.length > 0,
      untranslatedItems,
      untranslatedTemplate,
      numericMismatches,
      isValid: emptySectionsCount === 0 && totalItems > 0 && untranslatedItems.length === 0 && factFingerprintOk
    }
  };
}

/**
 * 将结构化 Context 2 序列化为人类与 Editor Agent 可直读核销的标准化多表格 Markdown 规范文档
 */
export function serializeContext2ToMarkdown(ctx2) {
  const esc = (v) => String(v ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ↵ ');
  const v = ctx2.validation || {};
  const lines = [];
  lines.push(`# ${ctx2.modelCode} Context 2 结构化标注与覆写治理资产`);
  lines.push('');
  lines.push(`> **生成时间**：${ctx2.generatedAt}`);
  lines.push(`> **数据阶段**：\`${ctx2.stage}\` (100% 溯源 Context 1，已启用标准化表格拓扑 + 全量英译零中文残留门禁)`);
  lines.push(`> **产品型号**：\`${ctx2.modelCode}\` | **GHS 判定**：${ctx2.isHazardous ? '危险化学品' : '非危险化学品 (未分类)'}`);
  lines.push('');
  lines.push('## 一、 全局治理与英文翻译门禁摘要');
  lines.push(`- **Section 1 品名/分类**：\`${ctx2.governedModel?.cn?.productName || ctx2.modelCode}\` / \`${ctx2.governedModel?.cn?.chemicalClassification || '—'}\` （EN: \`${ctx2.governedModel?.en?.productName || '—'}\`）`);
  lines.push(`- **Section 2 防外生虚增**：${ctx2.isHazardous ? '保留危险分类与象形图' : '非危品通栏模式，严禁虚增象形图/信号词；已将 S3 聚合物免责与成盐附注迁移归位至 S2'}`);
  lines.push(`- **Section 11 毒理学范式**：\`${ctx2.sections?.[11]?.items?.find(i => i.paradigm)?.paradigm || 'PARADIGM_2_STANDARD_SLOTS'}\``);
  lines.push(`- **全量逐句英译门禁**：${v.untranslatedCount === 0 ? '✅ 0 中文残留 (`isValid=true`)' : `❌ 尚有 **${v.untranslatedCount}** 项含中文待 Agent 逐句补译 (\`isValid=false\`，严禁跳过进入写盘)`}`);
  lines.push(`- **编辑器调度意图总数**：${ctx2.editorOps.length} 项（全章节前置值格清零 + 动态拓扑渲染 + 激光标尺投影）`);

  if (v.untranslatedCount > 0) {
    lines.push('');
    lines.push('### ⚠️ 待 Agent 逐句全量英译清单（需补齐后通过 `--translations` 回填验证）');
    lines.push('| 节 | 行/槽位 | 字段 | 原文 (CN) | 当前值 (含中文) |');
    lines.push('| :---: | :---: | :--- | :--- | :--- |');
    for (const u of v.untranslatedItems.slice(0, 60)) {
      lines.push(`| S${u.sectionNumber} | ${u.rowIndex} | \`${u.field}\` | ${esc(u.cnSource)} | ${esc(u.currentEn)} |`);
    }
  }

  lines.push('');
  lines.push('## 二、 16 章节标准化表格结构与逐格定位清单');

  for (let s = 1; s <= 16; s++) {
    const sec = ctx2.sections[s];
    if (!sec) continue;
    lines.push('');
    lines.push(`### 第 ${s} 节：${sec.title || s}`);

    const kvOrMerged = sec.items.filter(i => !['FULL_WIDTH_STRUCTURED', 'TABLE_HEADER', 'COMPONENT_ROW', 'OEL_ROW'].includes(i.role));
    const multiGrid = sec.items.filter(i => ['TABLE_HEADER', 'COMPONENT_ROW', 'OEL_ROW'].includes(i.role));
    const fullMerged = sec.items.filter(i => i.role === 'FULL_WIDTH_STRUCTURED');

    if (kvOrMerged.length > 0) {
      lines.push('');
      lines.push('| 行 | 网格/合并定位 | 角色 (Role) | 序号 | Col 0: 中文标签 | Col 1: 中文值 (或通栏正文) | EN Col 0 | EN Col 1 (或通栏英文) |');
      lines.push('| :---: | :--- | :--- | :---: | :--- | :--- | :--- | :--- |');
      for (const item of kvOrMerged) {
        if (item.role === 'MIGRATED_TO_S2') {
          lines.push(`| ${item.rowIndex} | 已迁移至 S2 | \`${item.role}\` | — | — | ${esc(item.textCn)} | — | *(迁移至 Section 2)* |`);
          continue;
        }
        const pos = item.placement?.gridType === '1_COL_MERGED'
          ? `通栏合并 (\`colSpan=${item.placement?.colSpan || 2}\`)`
          : '双列 (`Col 0` \\| `Col 1`)';
        const cnC0 = item.placement?.gridType === '1_COL_MERGED' ? '*(通栏合并)*' : esc(item.labelCn);
        const cnC1 = item.placement?.gridType === '1_COL_MERGED' ? esc(item.valueCn || item.textCn) : esc(item.valueCn);
        const enC0 = item.placement?.gridType === '1_COL_MERGED' ? '*(Merged)*' : esc(item.labelEn);
        const enC1 = item.placement?.gridType === '1_COL_MERGED' ? esc(item.valueEn || item.textEn) : esc(item.valueEn);
        lines.push(`| ${item.rowIndex} | ${pos} | \`${item.role}\` | ${item.seq || '—'} | ${cnC0} | ${cnC1} | ${enC0} | ${enC1} |`);
      }
    }

    if (multiGrid.length > 0) {
      const colCount = Math.max(...multiGrid.map(m => (m.cellsCn || []).length), 3);
      const cnHeaders = Array.from({ length: colCount }, (_, i) => `Col ${i} (CN)`).join(' | ');
      const enHeaders = Array.from({ length: colCount }, (_, i) => `Col ${i} (EN)`).join(' | ');
      const sep = Array.from({ length: colCount * 2 + 2 }, () => ':---').join(' | ');
      lines.push('');
      lines.push(`**多行多列表格 (${colCount} 列分格写入)**：`);
      lines.push('');
      lines.push(`| 行 | 角色 | ${cnHeaders} | ${enHeaders} |`);
      lines.push(`| ${sep} |`);
      for (const item of multiGrid) {
        const cnCells = Array.from({ length: colCount }, (_, i) => esc(item.cellsCn?.[i] ?? '')).join(' | ');
        const enCells = Array.from({ length: colCount }, (_, i) => esc(item.cellsEn?.[i] ?? '')).join(' | ');
        lines.push(`| ${item.rowIndex} | \`${item.role}\` | ${cnCells} | ${enCells} |`);
      }
    }

    for (const block of fullMerged) {
      lines.push('');
      lines.push(`**通栏合并大纲正文 (\`colSpan=${block.placement?.colSpan || 2}\`, 行 ${block.rowIndex})**：`);
      lines.push('');
      lines.push('| 段落行 | 层级角色 | 缩进/粗细 | 通栏合并正文 (CN, Col 0..1) | 通栏合并正文 (EN, Col 0..1) |');
      lines.push('| :---: | :--- | :---: | :--- | :--- |');
      for (const sub of block.lines || []) {
        const styleStr = `${sub.boldLabel ? '标签加粗' : '常规'}${sub.indentDxa ? ` / ${sub.indentDxa}dxa` : ''}`;
        const cnTxt = sub.textCn || `${sub.labelCn || ''}${sub.valueCn ? ` ${sub.valueCn}` : ''}`.trim();
        lines.push(`| L${sub.lineIndex || ''} | \`${sub.role}\` | ${styleStr} | ${esc(cnTxt)} | ${esc(sub.textEn)} |`);
      }
    }
  }
  return lines.join('\n');
}
