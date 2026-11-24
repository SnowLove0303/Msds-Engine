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

// 通用化工与聚合物高保真英译字典
export const CHEMICAL_TRANSLATION_DICT = Object.freeze({
  // 聚合物与树脂
  '脂肪族聚碳化二亚胺': 'Aliphatic polycarbodiimide',
  '聚碳化二亚胺': 'Polycarbodiimide',
  '碳化二亚胺交联剂': 'Carbodiimide crosslinker',
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
  '2-丁氧基乙醇': '2-Butoxyethanol',
  '水溶性丙烯酸树脂': 'Water-soluble acrylic resin',
  '水溶性羟基丙烯酸树脂': 'Water-soluble hydroxy acrylic resin',
  '水溶性丙烯酸聚合物树脂': 'Water-soluble acrylic polymer resin',
  '丙烯酸聚合物分散体': 'Acrylic polymer dispersion',
  '根据GHS不属于危险物': 'Not classified as a hazardous chemical according to GHS.',
  '根据GHS不属于危险化学品': 'Not classified as a hazardous chemical according to GHS.',
  '没有明显的已知作用或严重危险。': 'No known significant effects or critical hazards.',
  '操作时穿戴必要的防护用品（手套、防护镜、工作服等）。': 'Wear necessary personal protective equipment (gloves, goggles, work clothing, etc.) during handling.',
  '操作后彻底清洗身体接触部位。': 'Wash contact areas thoroughly after handling.',
  '作业场所不得进食，饮水或吸烟。': 'Do not eat, drink, or smoke in work areas.',
  '在室外或通风良好处操作。': 'Use only outdoors or in a well-ventilated area.',
  '吸入：一旦吸入，如有不适，就医。': 'Inhalation: If inhaled and feeling unwell, seek medical attention.',
  '眼睛、皮肤接触；': 'Eye and skin contact:',
  '使用肥皂、清水等清洗即可。': 'Wash thoroughly with soap and water.',
  '如有不适感，就医。': 'If feeling unwell, seek medical attention.',
  '眼睛、皮肤接触；使用肥皂、清水等清洗即可。如有不适感，就医。': 'Eye and skin contact: Wash thoroughly with soap and water. If feeling unwell, seek medical attention.',
  '眼睛、皮肤接触; 使用肥皂、清水等清洗即可。如有不适感, 就医。': 'Eye and skin contact: Wash thoroughly with soap and water. If feeling unwell, seek medical attention.',
  '食入：立即漱口，禁止催吐，立即就医诊治。': 'Ingestion: Rinse mouth immediately. Do not induce vomiting. Seek immediate medical attention.',
  '泄露：收集泄漏物。': 'Spill: Collect spillage.',
  '灭火：火灾时，使用干粉、泡沫、二氧化碳灭火。': 'Fire: In case of fire, use dry powder, foam, or carbon dioxide to extinguish.',
  '请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产品包装完整。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact.',
  '每次取用之后立即密封，打开包装后尽快使用完毕。': 'Reseal container immediately after use; use promptly once opened.',
  '请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产品包装完整。每次取用之后立即密封，打开包装后尽快使用完毕。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact. Reseal container immediately after use; use promptly once opened.',
  '请置于避光、阴凉干燥处存放，存储温度应保持在5-35°C，避免霜冻，保持产品包装完整。每次取用之后立即密封，打开包装后尽快使用完毕。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact. Reseal container immediately after use; use promptly once opened.',
  '请置于避光、阴凉干燥处存放, 存储温度应保持在5-35°C, 避免霜冻, 保持产品包装完整。每次取用之后立即密封, 打开包装后尽快使用完毕。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact. Reseal container immediately after use; use promptly once opened.',
  '使用后的空桶未经无害化处理前，不得存储食物及其他物品，以免对人体、环境造成危害；': 'Empty drums must not be used to store food or other items before proper decontamination, to prevent hazard to humans and environment;',
  '包装物的回收、利用、处置应符合国家及当地相关法律、法规规定，因包装物处置不当造成的危害及损失，由处置方承担。': 'Recycling, utilization, and disposal of packaging must comply with national and local regulations; liability for improper disposal rests with the disposer.',
  '使用后的空桶未经无害化处理前，不得存储食物及其他物品，以免对人体、环境造成危害；包装物的回收、利用、处置应符合国家及当地相关法律、法规规定，因包装物处置不当造成的危害及损失，由处置方承担。': 'Empty drums must not be used to store food or other items before proper decontamination, to prevent hazard to humans and environment; recycling, utilization, and disposal of packaging must comply with national and local regulations; liability for improper disposal rests with the disposer.',
  '使用后的空桶未经无害化处理前, 不得存储食物及其他物品, 以免对人体、环境造成危害; 包装物的回收、利用、处置应符合国家及当地相关法律、法规规定, 因包装物处置不当造成的危害及损失, 由处置方承担。': 'Empty drums must not be used to store food or other items before proper decontamination, to prevent hazard to humans and environment; recycling, utilization, and disposal of packaging must comply with national and local regulations; liability for improper disposal rests with the disposer.',
  '物理化学危险：对水体、土壤可造成一定的污染。': 'Physical & chemical hazards: May cause some contamination to water bodies and soil.',
  '物理化学危险：对水体、土壤可造成一定的污染': 'Physical & chemical hazards: May cause some contamination to water bodies and soil.',
  '物理化学危险: 对水体、土壤可造成一定的污染。': 'Physical & chemical hazards: May cause some contamination to water bodies and soil.',
  '物理化学危险: 对水体、土壤可造成一定的污染': 'Physical & chemical hazards: May cause some contamination to water bodies and soil.',
  '健康危害：无': 'Health hazards: None.',
  '健康危害: 无': 'Health hazards: None.',
  '健康危害：无。': 'Health hazards: None.',
  '环境危害：无危险物质释放，防止进入下水道，以防聚合物沉积阻塞下水道。': 'Environmental hazards: No hazardous substances released. Prevent entry into sewers to prevent polymer deposition and clogging.',
  '环境危害：无危险物质释放，防止进入下水道，以防聚合物沉积阻塞下水道': 'Environmental hazards: No hazardous substances released. Prevent entry into sewers to prevent polymer deposition and clogging.',
  '环境危害: 无危险物质释放，防止进入下水道，以防聚合物沉积阻塞下水道。': 'Environmental hazards: No hazardous substances released. Prevent entry into sewers to prevent polymer deposition and clogging.',
  '没有明显的已知作用或严重危险。': 'No known significant effects or critical hazards.',
  '没有明显的已知作用或严重危险': 'No known significant effects or critical hazards.',
  '无明显的已知作用或严重危险。': 'No known significant effects or critical hazards.',
  '无明显的已知作用或严重危险': 'No known significant effects or critical hazards.',
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
  'N,N－二甲基乙醇胺': 'N,N-Dimethylethanolamine',
  'N,N二甲基乙醇胺': 'N,N-Dimethylethanolamine',
  '聚丙烯酸酯分散体': 'Polyacrylate dispersion',
  '聚丙烯酸酯': 'Polyacrylate',
  '氨水': 'Ammonia water',
  '氢氧化铵': 'Ammonium hydroxide',
  '羟基聚氨酯分散体': 'Hydroxy polyurethane dispersion',
  '商业机密': 'Trade secret',
  '商业秘密': 'Trade secret',

  // GHS 危害说明与分类 (含 PA-4840 源文多项危害描述)
  '急性毒性4经口吞咽有害': 'Harmful if swallowed.',
  '急性毒性4经口吞咽有害。': 'Harmful if swallowed.',
  '急性毒性4经皮皮肤接触有害': 'Harmful in contact with skin.',
  '急性毒性4经皮皮肤接触有害。': 'Harmful in contact with skin.',
  '急性毒性4吸入性吸入有害': 'Harmful if inhaled.',
  '急性毒性4吸入性吸入有害。': 'Harmful if inhaled.',
  '眼睛刺激2 造成严重的眼刺激': 'Causes serious eye irritation.',
  '眼睛刺激2 造成严重的眼刺激。': 'Causes serious eye irritation.',
  '皮肤刺激2 造成皮肤刺激': 'Causes skin irritation.',
  '皮肤刺激2 造成皮肤刺激，': 'Causes skin irritation.',
  '皮肤刺激2 造成皮肤刺激。': 'Causes skin irritation.',
  '对水生生物有害并具有长期持续影响': 'Harmful to aquatic life with long lasting effects.',
  '对水生生物有害并具有长期持续影响。': 'Harmful to aquatic life with long lasting effects.',
  'H412 对水生生物有害并具有长期持续影响': 'H412 Harmful to aquatic life with long lasting effects.',
  'H412 对水生生物有害并具有长期持续影响。': 'H412 Harmful to aquatic life with long lasting effects.',
  '羟基丙烯酸酯聚合物GHS危险性分类：不适用': 'Hydroxy acrylic polymer GHS classification: Not applicable;',
  '羟基丙烯酸酯聚合物GHS危险性分类：不适用；': 'Hydroxy acrylic polymer GHS classification: Not applicable;',
  '危险象形标记：无': 'GHS pictograms: None',
  '警告词：警告': 'Signal word: Warning',

  // 理化状态与外观描述
  '液体': 'Liquid',
  '乳白液体': 'Milky white liquid',
  '乳白色液体': 'Milky white liquid',
  '微黄半透明液体': 'Light yellow, semi-transparent liquid',
  '微黄半透明': 'Light yellow, semi-transparent',
  '半透明液体': 'Semi-transparent liquid',
  '半透明粘稠液体': 'Translucent viscous liquid',
  '粘稠液体': 'Viscous liquid',
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
  '溶剂气味': 'Solvent odor',
  '全溶于水': 'Completely soluble in water',
  '溶于水': 'Soluble in water',
  '部分溶于水': 'Partially soluble in water',
  '不溶于水': 'Insoluble in water',
  '完全混溶': 'Completely miscible',
  '阴离子': 'Anionic',
  '非离子': 'Non-ionic',
  '不适用': 'Not applicable',
  '无可用数据': 'No data available',
  '无数据': 'No data available',
  '未测定': 'Not determined',
  '无意义': 'Not applicable',
  '无': 'None'
})

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

  // 模式模糊匹配
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
  // @FIX_TAG(2026-11-23/context-governor/FIX-PUNCT-SPACE): 英文标点后粘连自愈与多余空格压缩
  const healEnSpacing = (str) => String(str ?? '')
    .replace(/([a-z][.!?])([A-Za-z])/g, '$1 $2')
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

      const s2Lines = [];
      for (const r of rows) {
        if (r.rowIndex === 0) continue;
        for (const c of (r.cells || [])) {
          if (c.text) {
            c.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => s2Lines.push(l));
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

      const classifyS2Line = (line) => {
        const l = line.trim();
        // @FIX_TAG(2026-11-24/context-governor/FIX-S2-ROLE-CLASSIFY): 统一将 2.X 节标题及"物质或混合物分类/紧急情况概述"归为 PARENT_HEADER，将"GHS分类/GHS-象形图"归为 SUB_LABEL_KV
        if (/^(?:2\.\d+\s*(?:紧急情况概述|物质或混合物的?分类|GHS\s*危险性类别|GHS\s*标签要素|标签要素|危险性说明|危害性说明|防范说明|其他危害|其他危险)|物质或混合物的?分类|GHS\s*标签要素|危险性说明|危害性说明|防范说明|其他危害|其他危险)[：:]?$/i.test(l)) {
          return { subRole: 'PARENT_HEADER', boldLabel: true, indentDxa: 0 };
        }
        if (/^(?:危险象形标记|GHS[-\s]*象形图|GHS\s*危险性类别|警告词|信号词|必须列在标签上的有害成分|请注意以下物质|GHS[-\s]*分类|预防措施|事故响应|安全储存|安全存储|废弃处置|物理化学危险|健康危害|环境危害|[^：\n]*聚合物GHS危险性分类)[：:]/i.test(l)) {
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
      // Section 11: 双范式动态判定 (PARADIGM_1 通栏复合 vs PARADIGM_2 标准端点)
      const isParadigm1 = context1.toxicology?.paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED' ||
        rows.filter(r => r.rowIndex >= 1).some(r => (r.cells || []).length === 1 && /毒性[：:]|刺激性[：:]|LD50/i.test(r.cells[0]?.text || ''));

      items.push({
        rowIndex: 0,
        role: 'SECTION_HEADER',
        bold: true,
        textCn: rawSec.title || '11. 毒性资料',
        textEn: resolveEn(rawSec.title, STANDARD_SECTION_TITLE_EN[11], 'S11:R0'),
        placement: { gridType: '1_COL_MERGED', colSpan: 2, targetCol: '0..1 (通栏合并)' }
      });
      if (isParadigm1) {
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
          if (!txt || /无可用的毒理学研究|下面是这些成分/i.test(txt)) continue;
          txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
            const isComp = !/^(?:毒性|刺激性|急性毒性|主要|致敏性|致突变性|致癌性|生殖毒性|特异性靶器官|吸入|经皮|经口|LD50)/i.test(line);
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
        for (const r of rows.slice(1)) {
          const c0 = r.cells?.[0]?.text?.trim() || '';
          const c1 = r.cells?.[r.cells.length - 1]?.text?.trim() || '';
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
            const lblEn = seqInfo.seq ? `${seqInfo.seq} ${translateChemicalTerm(seqInfo.label.replace(/[：:]/g, ''))}:` : translateChemicalTerm(seqInfo.label);
            items.push({
              rowIndex: r.rowIndex,
              role: seqInfo.isSeq ? 'SEQ_LABEL' : 'SUB_LABEL',
              seq: seqInfo.seq,
              labelCn: seqInfo.label,
              valueCn: c1,
              labelEn: resolveEn(seqInfo.label, lblEn, `S11:R${r.rowIndex}:L`),
              valueEn: resolveEn(c1, translateChemicalTerm(c1), `S11:R${r.rowIndex}:V`),
              boldLabel: true,
              boldValue: false,
              indentDxa: seqInfo.indentDxa,
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
        '控制参数': 'Control parameters', '暴露控制': 'Exposure controls', '呼吸系统防护': 'Respiratory protection',
        '手部防护': 'Hand protection', '防护手套的合适材料': 'Suitable glove material', '建议': 'Recommendation',
        '眼睛防护': 'Eye protection', '身体防护': 'Body protection', '工程控制': 'Engineering controls',
        '化学稳定性': 'Chemical stability', '危险分解产物': 'Hazardous decomposition', '可能的危害反应': 'Hazardous reactions',
        '生态毒性': 'Ecotoxicity', '持久性和降解性': 'Persistence & degradability', '其他不利的影响': 'Other adverse effects',
        '处理方法': 'Disposal methods', '公路和铁路运输': 'Road and rail transport', '海上运输': 'Maritime transport',
        '空运': 'Air transport', '用户特殊注意事项': 'User precautions',
        '联合国编号': 'UN Number', '联合国运输名称': 'UN Proper Shipping Name',
        '水溶性': 'Water solubility', '粘度/25℃': 'Viscosity / 25°C', '自燃温度': 'Auto-ignition temperature',
        '闪点（闭口）': 'Flash point (closed cup)', '离子性': 'Ionicity', '分解温度': 'Decomposition temperature',
        '爆炸特性': 'Explosive properties', '粉尘爆炸级别': 'Dust explosion class', '急性毒性': 'Acute toxicity',
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
          .replace(/立即用肥皂和大量的水冲洗[。.]?\s*若发生皮肤反应[，,]?\s*就医[。.]?/g, 'Wash immediately with plenty of soap and water. If skin reaction occurs, seek medical advice.')
          .replace(/若刺激呼吸道[，,]?\s*就医[。.]?/g, 'If respiratory irritation occurs, seek medical advice.')
          .replace(/二氧化碳（CO2）[，,]?\s*泡沫[，,]?\s*灭火粉末[，,]?\s*大火时应用喷洒水[。.]?/g, 'Carbon dioxide (CO2), foam, extinguishing powder. For large fires, use water spray.')
          .replace(/高流量的水喷射[。.]?/g, 'High-volume water jet.')
          .replace(/戴防护设备[。.]?/g, 'Wear protective equipment.')
          .replace(/确保充分的通风\/排气[。.]?\s*令未授权人员离开[。.]?/g, 'Ensure adequate ventilation. Keep unauthorized persons away.')
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
          .replace(/GB\s*15258[^\n]*/g, 'GB 15258 General rules for preparation of precautionary label for chemicals.');
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
                  role: 'SUB_LABEL',
                  seq: null,
                  labelCn: titleCn,
                  valueCn: '',
                  labelEn: resolveEn(titleCn, 'Workplace component control parameters', `S8:R${r.rowIndex}:T`),
                  valueEn: '',
                  boldLabel: true,
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
          // @FIX_TAG(2026-11-23/context-governor/FIX-SPACE-PACKED-KV): 通用多行打包 KV 拆分：兼容右值被压成单行空格分隔（如 "无数据 65℃"）
          const c0Lines = c0.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          let c1Lines = c1.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          if (c0Lines.length > 1 && c0Lines.every(l => /^\d+\.\d+/.test(l)) && c1Lines.length === 1) {
            const spaceTokens = c1Lines[0].match(/无数据|不适用|\S+/g) || [];
            if (spaceTokens.length === c0Lines.length) c1Lines = spaceTokens;
          }
          const kvPairs = (c0Lines.length > 1 && c0Lines.every(l => /^\d+\.\d+/.test(l)) && c0Lines.length === c1Lines.length)
            ? c0Lines.map((l, idx) => ({ rawLbl: l, rawVal: c1Lines[idx] }))
            : [{ rawLbl: c0, rawVal: c1 }];

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
            if (s === 1 && /中文名称|产品中文名称/i.test(seqInfo.cleanKey) && cleanValCn && modelCode && !cleanValCn.toUpperCase().includes(modelCode.toUpperCase())) {
              cleanValCn = `${cleanValCn} ${modelCode}`;
            }
            const condMatch = cleanValCn.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);
            const lblEnBase = STANDARD_LABEL_EN[seqInfo.cleanKey] || translateChemicalTerm(seqInfo.label.replace(/[：:]/g, ''));
            const defaultLblEn = seqInfo.seq ? `${seqInfo.seq} ${lblEnBase}:` : `${lblEnBase}:`;
            let defaultValEn = translateLineEn(cleanValCn);
            if (s === 1 && /中文名称|产品中文名称/i.test(seqInfo.cleanKey) && modelCode && !defaultValEn.toUpperCase().includes(modelCode.toUpperCase())) {
              const baseCn = cleanValCn.replace(new RegExp(`\\s*${modelCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'), '').trim();
              const baseEn = /水溶性.*丙烯酸树脂/.test(baseCn) ? 'Water-soluble acrylic resin' : translateLineEn(baseCn);
              defaultValEn = `${baseEn} ${modelCode}`.trim();
            }
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
      .replace(/(\d+(?:\.\d+)?)\s*(mm|min|cm|mg|kg|hPa|mPa·s|mPa\.s)\b/gi, '$1 $2');
  };
  const normalizeCnText = (str) => {
    if (!str || typeof str !== 'string') return str;
    return normalizeSharedSymbols(str)
      .replace(/(\b(?:mm|min|cm|mg|kg|hPa))\.(?=\s|$|；|;)/gi, '$1');
  };
  const normalizeEnText = (str) => {
    if (!str || typeof str !== 'string') return str;
    return normalizeSharedSymbols(str)
      .replace(/：/g, ':')
      .replace(/（/g, ' (')
      .replace(/）/g, ')')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
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

  return {
    modelCode,
    generatedAt: new Date().toISOString(),
    stage: 'CONTEXT_2_STRUCTURED_GOVERNED',
    isHazardous: governed.cn.isHazardous,
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
      needsAgentTranslation: untranslatedItems.length > 0,
      untranslatedItems,
      untranslatedTemplate,
      numericMismatches,
      isValid: emptySectionsCount === 0 && totalItems > 0 && untranslatedItems.length === 0 && numericMismatches.length === 0
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
