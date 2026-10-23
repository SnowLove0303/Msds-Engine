
/**
 * 事实真实性交叉质检门禁 (Ground Truth Cross-Language Consistency Gate)
 * 铁律防御：严禁任何旧模板幽灵数据、错误分类或翻译倒挂溜入产出物！
 */
export function assertBilingualIntegrity(baseCnEngine, baseEnEngine) {
  if (!baseCnEngine || !baseEnEngine) return;

  // 1. 危险性断言：中文非危，英文绝不能出现 H412、丙二醇甲醚等旧模板幽灵数据
  const cnS2 = baseCnEngine.records.find(r => r.sectionNumber === 2);
  const enS2 = baseEnEngine.records.find(r => r.sectionNumber === 2);
  const cnS2Text = cnS2 ? cnS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';
  const enS2Text = enS2 ? enS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';

  if (/不属于危害|非危险|不属于危险/i.test(cnS2Text)) {
    if (/H412|H315|Propylene glycol monomethyl ether/i.test(enS2Text)) {
      throw new Error('【合规门禁拦截】中文母版为非危险品，但英文版 Section 2 出现旧模板残留的 H412 危害分类或溶剂！');
    }
  }

  // 2. 灭火剂断言：Section 5.2 绝不能等于 Section 5.1
  const enS5 = baseEnEngine.records.find(r => r.sectionNumber === 5);
  if (enS5 && enS5.rows.length >= 3) {
    const s51 = (enS5.rows[1]?.cells[1]?.text || '').trim();
    const s52 = (enS5.rows[2]?.cells[1]?.text || '').trim();
    if (s51 && s52 && s51 === s52) {
      throw new Error('【合规门禁拦截】Section 5.2 不合适灭火剂被错误复制成了 5.1 合适灭火剂！');
    }
  }

  // 3. 理化特性断言：固含与离子性必须 100% 对应
  const cnS9 = baseCnEngine.records.find(r => r.sectionNumber === 9);
  const enS9 = baseEnEngine.records.find(r => r.sectionNumber === 9);
  if (cnS9 && enS9) {
    const cnIonicity = cnS9.rows.find(r => /离子性/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
    const enIonicity = enS9.rows.find(r => /Ionicity/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
    if (/阳离子/i.test(cnIonicity) && /Non-ionic/i.test(enIonicity)) {
      throw new Error('【合规门禁拦截】中文离子性为阳离子，英文被颠倒为 Non-ionic（非离子）！');
    }

    const cnSolids = cnS9.rows.find(r => /固体含量|固含/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
    const enSolids = enS9.rows.find(r => /Solid/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
    const cnNum = (cnSolids.match(/\d+/) || [])[0];
    const enNum = (enSolids.match(/\d+/) || [])[0];
    if (cnNum && enNum && cnNum !== enNum) {
      throw new Error(`【合规门禁拦截】理化指标不一致：中文固体含量为 ${cnSolids}，英文版为 ${enSolids}！`);
    }
  }
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W_NS,
  loadDocx,
  applyStandardHangingIndent,
  writeCellValue,
  writeCellLabel,
  updateHeaderFooterData,
  extractAdaptiveRevisionDate,
  addRowAfter,
  deleteRow,
  renumberRecord,
  removeCellFromRow,
  normalizeRowGeometry,
  transferDrawingToCell
} from './docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './smart-matching.js';
import { convertBatchDocxToPdf } from './pdf-converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../public/templates');

function tableRecords(engine) {
  return (engine?.records || []).filter((r) => r.kind === 'table');
}

export function safeWriteCellValue(cell, value, style = null) {
  if (!cell || value === undefined || value === null) return;
  if (!cell.editable) cell.editable = true;
  writeCellValue(cell, value, style);
}

/**
 * 内置标准化企业实体矩阵 (Guanzhi / Guocai 规范双语对照)
 */
export const ENTITY_MATRIX = {
  GUANZHI: {
    id: 'GUANZHI',
    cn: {
      name: '广州冠志新材料科技有限公司',
      shortName: '冠志',
      address: '广州市萝岗区科学城掬泉路3号广州国际企业孵化器A区1106室',
      tel: '86-20-82567990',
      fax: '86-20-32214789'
    },
    en: {
      name: 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
      shortName: 'Guanzhi',
      address: 'Room 1106, Area A, Guangzhou International Business Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou',
      tel: '86-20-82567990',
      fax: '86-20-32214789'
    }
  },
  GUOCAI: {
    id: 'GUOCAI',
    cn: {
      name: '英德市国彩精细化工有限公司',
      shortName: '国彩',
      address: '广东省英德市白沙镇太平村更古坑凯迪工业园区',
      tel: '86-763-2811205',
      fax: '86-763-2811024'
    },
    en: {
      name: 'Yingde Guocai New Material Co., Ltd.',
      shortName: 'Guocai',
      address: 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde, Guangdong, China',
      tel: '86-763-2811205',
      fax: '86-763-2811024'
    }
  }
};

/**
 * 构造国际标准化英文 MSDS 16 大项事实字典
 */
export function translateGhsClassificationToEnglish(cnClass) {
  if (!cnClass) return 'Not classified as a hazardous chemical according to GHS.';
  const lines = [];
  if (/H332|急性毒性.*吸入/i.test(cnClass)) lines.push('Acute toxicity, Inhalation (Category 4), H332');
  if (/H316|皮肤.*(?:腐蚀|刺激)/i.test(cnClass)) lines.push('Skin corrosion/irritation (Category 3), H316');
  if (/H320|严重.*眼|眼睛刺激/i.test(cnClass)) lines.push('Serious eye damage/eye irritation (Category 2B), H320');
  if (/H360|生殖毒性|生育能力|胎儿/i.test(cnClass)) lines.push('Reproductive toxicity (Category 1B), H360');
  if (/H370|靶器官.*一次|对器官造成损害(?!.*反复|.*长期)/i.test(cnClass)) lines.push('Specific target organ toxicity - single exposure (Category 1), H370');
  if (/H373|靶器官.*(?:反复|重复)|长期或反复.*器官|反复接触.*器官/i.test(cnClass)) lines.push('Specific target organ toxicity - repeated exposure (Category 2), H373');
  return lines.length > 0 ? lines.join('\n') : 'Not classified as a hazardous chemical according to GHS.';
}

export function translateGhsLabelElementsToEnglish(cnLabel) {
  if (!cnLabel) return '';
  const lines = [];
  if (/危险/i.test(cnLabel)) lines.push('Signal word: Danger\n');
  else if (/警告/i.test(cnLabel)) lines.push('Signal word: Warning\n');
  
  lines.push('Hazard statement(s):');
  if (/H316|轻微皮肤刺激/i.test(cnLabel)) lines.push('H316: Causes mild skin irritation.');
  if (/H320|眼睛刺激/i.test(cnLabel)) lines.push('H320: Causes eye irritation.');
  if (/H332|吸入有害/i.test(cnLabel)) lines.push('H332: Harmful if inhaled.');
  if (/H360.*胎儿造成伤害|可能对胎儿造成伤害/i.test(cnLabel)) lines.push('H360: May damage the unborn child.');
  else if (/H360|生育能力|胎儿.*伤害|未出生.*胎儿/i.test(cnLabel)) lines.push('H360: May damage fertility or the unborn child.');
  if (/H370|对器官造成损害(?!.*反复|.*长期)/i.test(cnLabel)) lines.push('H370: Causes damage to organs.');
  if (/H373|长期或反复.*器官|反复接触.*器官/i.test(cnLabel)) lines.push('H373: May cause damage to organs through prolonged or repeated exposure.');
  if (/H302|吞咽有害/i.test(cnLabel)) lines.push('H302: Harmful if swallowed.');
  if (/H315|造成皮肤刺激/i.test(cnLabel)) lines.push('H315: Causes skin irritation.');
  if (/H319|严重眼睛刺激/i.test(cnLabel)) lines.push('H319: Causes serious eye irritation.');
  if (/H317|皮肤过敏/i.test(cnLabel)) lines.push('H317: May cause an allergic skin reaction.');
  if (/H412|水生生物/i.test(cnLabel)) lines.push('H412: Harmful to aquatic life with long lasting effects.');
  return lines.join('\n');
}

export function translateGhsPrecautionaryToEnglish(cnPrecaution) {
  if (!cnPrecaution) return '';
  const sections = [];

  const prev = ['Prevention:'];
  if (/P201|专用指导/i.test(cnPrecaution)) prev.push('P201: Obtain special instructions before use.');
  if (/P202|读懂所有安全防范措施/i.test(cnPrecaution)) prev.push('P202: Do not handle until all safety precautions have been read and understood.');
  if (/P260|不要吸入.*粉尘|不要吸入.*蒸气|不要吸入.*烟/i.test(cnPrecaution)) prev.push('P260: Do not breathe dust/fume/gas/mist/vapours/spray.');
  if (/P264|彻底清洗|彻底洗手/i.test(cnPrecaution)) prev.push('P264: Wash hands thoroughly after handling.');
  if (/P270|不要进食.*饮水.*吸烟|不吸烟/i.test(cnPrecaution)) prev.push('P270: Do not eat, drink or smoke when using this product.');
  if (/P271|室外或通风良好/i.test(cnPrecaution)) prev.push('P271: Use only outdoors or in a well-ventilated area.');
  if (/P280|戴防护手套|穿防护服|戴防护眼罩/i.test(cnPrecaution)) prev.push('P280: Wear protective gloves/protective clothing/eye protection/face protection.');
  if (prev.length > 1) sections.push(prev.join('\n'));

  const resp = ['Response:'];
  if (/P304|如吸入|空气新鲜/i.test(cnPrecaution)) resp.push('P304 + P340: IF INHALED: Remove person to fresh air and keep comfortable for breathing.');
  if (/P305|如进入眼睛|用水小心冲洗/i.test(cnPrecaution)) resp.push('P305 + P351 + P338: IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.');
  if (/P308|接触到或有疑虑/i.test(cnPrecaution)) resp.push('P308 + P313: IF exposed or concerned: Get medical advice/attention.');
  if (/P332|皮肤刺激/i.test(cnPrecaution)) resp.push('P332 + P313: If skin irritation occurs: Get medical advice/attention.');
  if (/P337|眼睛刺激持续/i.test(cnPrecaution)) resp.push('P337 + P313: If eye irritation persists: Get medical advice/attention.');
  if (/P312|感觉不适.*呼救|就医/i.test(cnPrecaution)) resp.push('P312: Call a POISON CENTER/doctor if you feel unwell.');
  if (/P321|具体治疗/i.test(cnPrecaution)) resp.push('P321: Specific treatment (see supplemental first aid instructions on this label).');
  if (/P370|火灾|灭火/i.test(cnPrecaution)) resp.push('P370 + P378: In case of fire: Use water spray, alcohol-resistant foam, dry chemical or carbon dioxide to extinguish.');
  if (resp.length > 1) sections.push(resp.join('\n'));

  const stor = ['Storage:'];
  if (/P405|加锁/i.test(cnPrecaution)) stor.push('P405: Store locked up.');
  if (/P403|通风处|阴凉/i.test(cnPrecaution)) stor.push('P403 + P233: Store in a well-ventilated place. Keep container tightly closed.');
  if (stor.length > 1) sections.push(stor.join('\n'));

  const disp = ['Disposal:'];
  if (/P501|处置内装物|容器.*规章/i.test(cnPrecaution)) disp.push('P501: Dispose of contents/container in accordance with local/regional/national/international regulations.');
  if (disp.length > 1) sections.push(disp.join('\n'));

  return sections.join('\n\n');
}

/**
 * Section 1 化学品分类专业英译转换器 (遵从源文件事实，精准反映改性等修饰语)
 */
export function translateChemicalCategoryToEnglish(cnCategory, cnName = '') {
  const combined = `${cnCategory || ''} ${cnName || ''}`.trim();
  if (/封闭(?:型)?(?:聚)?异氰酸酯/i.test(combined)) {
    return 'Blocked polyisocyanate water dispersion';
  }
  if (/改性.*聚氨酯/i.test(combined)) {
    return 'Modified polyurethane resin aqueous dispersion';
  }
  if (/聚氨酯/i.test(combined)) {
    return 'Waterborne polyurethane resin dispersion';
  }
  if (/环氧/i.test(combined)) {
    return 'Epoxy water dispersion';
  }
  if (/高密度聚乙烯蜡/i.test(combined)) {
    return 'High density polyethylene wax emulsion';
  }
  if (/蜡/i.test(combined)) {
    return 'Polyethylene wax emulsion';
  }
  if (/丙烯酸/i.test(combined)) {
    return 'Aqueous acrylic dispersion';
  }
  return 'Aqueous polymer dispersion';
}

/**
 * Section 1 产品用途建议专业英译转换器 (精准提取源文件行业词汇，拒绝虚构假数据)
 */
export function translateRecommendedUseToEnglish(cnUse) {
  if (!cnUse || typeof cnUse !== 'string') return 'Raw material for industrial coatings';
  const clean = cnUse.trim();

  const USE_TERMS_MAP = [
    { regex: /金属涂层|金属漆|金属表面/i, en: 'metal coatings' },
    { regex: /透水地坪|地坪涂料|地坪漆|地坪/i, en: 'permeable flooring' },
    { regex: /纸张涂层|纸张印刷|纸张上光|纸张/i, en: 'paper coating' },
    { regex: /木器漆|木器涂料|木器/i, en: 'wood coatings' },
    { regex: /皮革涂饰|皮革涂层|皮革光亮|皮革/i, en: 'leather finishing' },
    { regex: /纺织涂层|纺织印染|织物涂层|纺织/i, en: 'textile coating' },
    { regex: /塑料涂层|塑料表面/i, en: 'plastic coatings' },
    { regex: /汽车内饰|汽车涂料/i, en: 'automotive coatings' },
    { regex: /油墨|印刷油墨/i, en: 'printing inks' },
    { regex: /粘合剂|胶粘剂|胶水/i, en: 'adhesives' },
    { regex: /工业涂料/i, en: 'industrial coatings' },
    { regex: /建筑涂料/i, en: 'architectural coatings' },
    { regex: /涂料/i, en: 'coatings' },
    { regex: /原材料|原料/i, en: 'raw materials' }
  ];

  const matchedEnTerms = [];
  const matchedEnSet = new Set();

  for (const item of USE_TERMS_MAP) {
    if (item.regex.test(clean)) {
      if (!matchedEnSet.has(item.en)) {
        matchedEnSet.add(item.en);
        matchedEnTerms.push(item.en);
      }
    }
  }

  if (matchedEnTerms.length > 0) {
    const hasEtc = /等(?:行业|领域|方面|)?/i.test(clean);
    if (matchedEnTerms.length === 1) {
      return hasEtc ? `Used in ${matchedEnTerms[0]} and other industries.` : `Used in ${matchedEnTerms[0]}.`;
    }
    const lastTerm = matchedEnTerms[matchedEnTerms.length - 1];
    const leadingTerms = matchedEnTerms.slice(0, -1).join(', ');
    if (hasEtc) {
      return `Used in ${leadingTerms}, ${lastTerm} and other industries.`;
    } else {
      return `Used in ${leadingTerms} and ${lastTerm}.`;
    }
  }

  if (/粘合剂.*涂料|涂料.*粘合剂/i.test(clean)) return 'Adhesives, coatings.';
  if (/涂料/i.test(clean)) return 'Raw material for coatings.';

  return 'Raw material for industrial coatings';
}


/**
 * 依据中文母版真实危险性事实，动态推导 GHS 象形图代号，严禁硬编码
 */
export function deriveGhsPictograms(cnText) {
  const text = String(cnText || '');
  const pics = [];
  if (/生殖毒性|致癌|致畸|特异性靶器官|吸入危[害险]|H360|H350|H370|H372|H373|H304/i.test(text)) {
    pics.push('[GHS08]');
  }
  if (/急性毒性.*(?:吸入|经口|经皮)|皮肤刺激|眼睛刺激|过敏|致敏|H302|H312|H332|H315|H319|H317|H335/i.test(text)) {
    pics.push('[GHS07]');
  }
  if (/易燃|高度易燃|引燃|闪点|H224|H225|H226/i.test(text)) {
    pics.push('[GHS02]');
  }
  if (/腐蚀|严重损伤|H314|H318/i.test(text)) {
    pics.push('[GHS05]');
  }
  if (/水生|环境危害|水生生物|H400|H410|H411/i.test(text)) {
    pics.push('[GHS09]');
  }
  return pics.length > 0 ? pics.join(' ') : 'Not applicable';
}

/**
 * 依据中文母版动态推导英文信号词
 */
export function deriveSignalWord(cnText) {
  const text = String(cnText || '');
  if (/危险/i.test(text)) return 'Danger';
  if (/警告/i.test(text)) return 'Warning';
  return 'Not applicable';
}

export function buildEnglishFacts(modelCode, facts = {}, baseCnEngine = null) {
  const entity = facts.entity || ENTITY_MATRIX.GUANZHI;

  // 1. Section 1 动态派生 (严格对齐算法训练材料 PU-1003 等规范)
  let prodName = facts.productNameEn;
  let categoryEn = facts.chemicalCategoryEn;
  let useEn = facts.recommendedUseEn || 'Raw material for industrial coatings';

  if (baseCnEngine) {
    const s1 = baseCnEngine.records.find(r => r.sectionNumber === 1);
    if (s1) {
      let cnName = '';
      let cnCategory = '';
      let cnUse = '';
      for (const r of s1.rows) {
        const lbl = (r.cells[0]?.text || '').trim();
        const val = (r.cells[1]?.text || '').trim();
        if (/中文名称|产品名称|物料名称|品名/i.test(lbl) && val) {
          cnName = val;
        }
        if (/化学品分类|化学品类别|产品类别|产品分类/i.test(lbl) && val) {
          cnCategory = val;
        }
        if (/用途|使用建议/i.test(lbl) && val) {
          cnUse = val;
        }
      }

      if (!prodName) {
        if (/封闭(?:型)?(?:聚)?异氰酸酯/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Waterborne blocked isocyanate curing agent ${modelCode}`;
        } else if (/聚氨酯/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Waterborne polyurethane dispersion ${modelCode}`;
        } else if (/环氧/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Waterborne epoxy emulsion ${modelCode}`;
        } else if (/蜡/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Waterborne wax emulsion ${modelCode}`;
        } else if (/丙烯酸/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Aqueous acrylic dispersion ${modelCode}`;
        } else {
          prodName = modelCode;
        }
      }
      if (!categoryEn) {
        categoryEn = translateChemicalCategoryToEnglish(cnCategory, cnName);
      }
      if (cnUse) {
        useEn = translateRecommendedUseToEnglish(cnUse);
      }
    }
  }
  if (!prodName) prodName = modelCode;
  if (!categoryEn) categoryEn = 'Polymer dispersion';

  // 2. Section 2 危险分类动态识别 (以中文母版事实为准，彻底杜绝旧模板 H412 串入)
  let isNonHaz = true;
  let ghsClassEn = 'GHS hazard class:\nNot classified as a hazardous chemical according to GHS.';
  let ghsLabelEn = 'GHS pictogram:\nNot classified as a hazardous chemical according to GHS.';
  let ghsPrecautionEn = '';
  let otherHazEn = 'No applicable information.';

  if (baseCnEngine) {
    const s2 = baseCnEngine.records.find(r => r.sectionNumber === 2);
    if (s2) {
      const fullS2 = s2.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ');
      if (!/不属于危害|非危险|不属于危险/i.test(fullS2)) {
        isNonHaz = false;
        const cnClassRow = s2.rows.find(r => /危险性类别|分类|GHS危险性/i.test(r.cells[0]?.text || ''));
        const cnClass = cnClassRow?.cells[1]?.text?.trim() || '';

        const cnSignal = s2.rows.find(r => /信号词|警示词/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
        const cnHazRow = s2.rows.find(r => /危险性说明|危害说明/i.test(r.cells[0]?.text || ''));
        const cnHaz = cnHazRow?.cells[1]?.text?.trim() || '';
        const cnLabel = `${cnSignal} ${cnHaz}`.trim();

        const cnPrecRow = s2.rows.find(r => /防范说明|预防措施/i.test(r.cells[0]?.text || ''));
        const cnPrecaution = cnPrecRow?.cells[1]?.text?.trim() || '';

        ghsClassEn = facts.ghsClassificationEn || translateGhsClassificationToEnglish(cnClass || cnHaz || fullS2);
        ghsLabelEn = facts.ghsLabelElementsEn || translateGhsLabelElementsToEnglish(cnLabel || fullS2);
        ghsPrecautionEn = facts.precautionaryStatementsEn || translateGhsPrecautionaryToEnglish(cnPrecaution || fullS2);
        if (/透皮吸收.*N.*甲基吡咯烷酮|透皮吸收.*NMP/i.test(fullS2)) {
          otherHazEn = 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).';
        }
      }
    }
  }

  // 3. Section 5 灭火剂动态识别 (防止复制粘贴错误)
  let unsuitableExtinguishing = 'High-volume water jet.';
  if (baseCnEngine) {
    const s5 = baseCnEngine.records.find(r => r.sectionNumber === 5);
    if (s5) {
      const cnUnsuitable = s5.rows.find(r => /不合适/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
      if (/高流量|高压水|水喷射/i.test(cnUnsuitable)) {
        unsuitableExtinguishing = 'High-volume water jet.';
      } else if (/无数据|无特别/i.test(cnUnsuitable)) {
        unsuitableExtinguishing = 'None known.';
      }
    }
  }

  // 4. Section 9 理化特性动态智能翻译 (100% 遵从中文母版事实)
  const sec9Facts = {
    appearance: 'Milky white liquid',
    odour_threshold: 'No data available.',
    ph: 'No data available.',
    ionicity: 'Non-ionic',
    boiling_point: 'Approx. 100℃',
    flash_point: 'No flash point below initial boiling point',
    evaporation_rate: 'No data available.',
    flammability: 'Not applicable',
    combustion_value: 'Not applicable',
    saturated_vapour: 'No data available.',
    vapour_density: 'No data available.',
    density: '1.0-1.1 g/cm³',
    solubility: 'Miscible',
    surface_tension: 'No data available.',
    partition_coefficient: 'No data available.',
    auto_ignition: 'Not applicable',
    ignition_temp: 'No data available.',
    decomposition_temp: 'No data available.',
    viscosity: '< 1000 mPa.s',
    explosive_properties: 'No data available.',
    dust_explosion: 'No data available.',
    solids: '40±2%',
    other_info: 'The above data are not product specifications. Please refer to the Technical Data Sheet for specifications.'
  };

  if (baseCnEngine) {
    const s9 = baseCnEngine.records.find(r => r.sectionNumber === 9);
    if (s9) {
      for (const row of s9.rows) {
        const lbl = (row.cells[0]?.text || '').trim();
        const val = (row.cells[1]?.text || '').trim();
        if (!val) continue;

        if (/外观/i.test(lbl)) {
          if (/乳白/i.test(val)) sec9Facts.appearance = 'Milky white liquid';
          else if (/均质/i.test(val) && /微黄|淡黄/i.test(val)) sec9Facts.appearance = 'Light yellow homogeneous liquid';
          else if (/透明/i.test(val) && /微黄|淡黄/i.test(val)) sec9Facts.appearance = 'Light yellow transparent liquid';
          else if (/透明/i.test(val)) sec9Facts.appearance = 'Transparent liquid';
          else if (/微黄|淡黄/i.test(val)) sec9Facts.appearance = 'Slightly yellowish liquid';
          else if (/均质/i.test(val)) sec9Facts.appearance = 'Homogeneous liquid';
          else sec9Facts.appearance = 'Liquid';
        } else if (/嗅觉阈值/i.test(lbl)) {
          sec9Facts.odour_threshold = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/pH/i.test(lbl)) {
          sec9Facts.ph = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/离子性/i.test(lbl)) {
          if (/阳离子/i.test(val)) sec9Facts.ionicity = 'Cationic';
          else if (/阴离子/i.test(val)) sec9Facts.ionicity = 'Anionic';
          else if (/非离子/i.test(val)) sec9Facts.ionicity = 'Non-ionic';
          else sec9Facts.ionicity = val;
        } else if (/初沸点/i.test(lbl)) {
          sec9Facts.boiling_point = val.replace(/约\s*/g, 'Approx. ').replace(/℃/g, '℃');
        } else if (/闪点/i.test(lbl)) {
          if (/无闪点/i.test(val)) sec9Facts.flash_point = 'No flash point below initial boiling point';
          else if (/不适用/i.test(val)) sec9Facts.flash_point = 'Not applicable';
          else if (/无数据/i.test(val)) sec9Facts.flash_point = 'No data available.';
          else sec9Facts.flash_point = val;
        } else if (/蒸发速率/i.test(lbl)) {
          sec9Facts.evaporation_rate = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/可燃性/i.test(lbl)) {
          sec9Facts.flammability = /不适用/i.test(val) ? 'Not applicable' : val;
        } else if (/燃烧值/i.test(lbl)) {
          sec9Facts.combustion_value = /不适用/i.test(val) ? 'Not applicable' : val;
        } else if (/相对蒸气密度/i.test(lbl)) {
          sec9Facts.vapour_density = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/密度/i.test(lbl)) {
          sec9Facts.density = val.replace(/约\s*/g, 'Approx. ').replace(/g\/cm3/gi, ' g/cm³');
        } else if (/水溶性/i.test(lbl)) {
          if (/混溶|互溶|完全/i.test(val)) sec9Facts.solubility = 'Miscible';
          else sec9Facts.solubility = val;
        } else if (/表面张力/i.test(lbl)) {
          sec9Facts.surface_tension = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/分配系数/i.test(lbl)) {
          sec9Facts.partition_coefficient = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/自燃温度/i.test(lbl)) {
          sec9Facts.auto_ignition = /不适用/i.test(val) ? 'Not applicable' : val;
        } else if (/引燃温度/i.test(lbl)) {
          sec9Facts.ignition_temp = /不适用/i.test(val) ? 'Not applicable' : (/无数据/i.test(val) ? 'No data available.' : val);
        } else if (/动力粘度|粘度/i.test(lbl)) {
          sec9Facts.viscosity = val.replace(/＜/g, '< ').replace(/＞/g, '> ');
        } else if (/固体含量|固含/i.test(lbl)) {
          sec9Facts.solids = val;
        }
      }
    }
  }

  // 5. Section 10 特征分解产物提取
  let decompEn = 'Flammable and harmful gases generated during thermal decomposition.';
  if (baseCnEngine) {
    const s10 = baseCnEngine.records.find(r => r.sectionNumber === 10);
    if (s10) {
      const cnDecomp = s10.rows.find(r => /分解产物/i.test(r.cells[0]?.text || ''))?.cells[1]?.text?.trim() || '';
      if (/二甲基吡唑/i.test(cnDecomp)) {
        decompEn = 'Releases 3,5-dimethylpyrazole under baking conditions. Gases released during baking should be vented.';
      }
    }
  }

  return {
    // Section 1
    'sec1.product_name': prodName,
    'sec1.chemical_category': categoryEn,
    'sec1.recommended_use': useEn,
    'sec1.supplier_name': entity.en.name,
    'sec1.supplier_address': entity.en.address,
    'sec1.telephone': entity.en.tel,
    'sec1.fax': entity.en.fax,

    // Section 2
    'sec2.is_non_haz': isNonHaz,
    'sec2.ghs_classification': ghsClassEn,
    'sec2.ghs_label_elements': ghsLabelEn,
    'sec2.precautionary_statements': ghsPrecautionEn,
    'sec2.other_hazards': otherHazEn,

    // Section 3
    'sec3.product_type': 'Mixture',

    // Section 4
    'sec4.general_advice': 'Remove all contaminated clothing immediately.',
    'sec4.ingestion': 'Do NOT induce vomiting. Seek medical attention immediately.',
    'sec4.eye_contact': 'Hold eyelids open and flush with plenty of warm water for at least 10 minutes. Consult an ophthalmologist.',
    'sec4.skin_contact': 'Wash immediately with plenty of soap and water. If skin reaction occurs, seek medical advice.',
    'sec4.inhalation': 'If respiratory irritation occurs, seek medical advice.',

    // Section 5
    'sec5.suitable_extinguishing': 'Carbon dioxide (CO2), foam, extinguishing powder. For large fires, use water spray.',
    'sec5.unsuitable_extinguishing': unsuitableExtinguishing,
    'sec5.specific_hazards': 'Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide.\nDo not breathe fumes/smoke in case of fire or explosion.',
    'sec5.protective_equipment': 'Firefighters must wear self-contained breathing apparatus.\nDo not allow contaminated fire-fighting water to enter soil, groundwater, or surface water.',

    // Section 6
    'sec6.personal_precautions': 'Wear protective equipment.\nEnsure adequate ventilation. Keep unauthorized persons away.',
    'sec6.environmental_precautions': 'Do not discharge into drains, wastewater, or soil.',
    'sec6.cleaning_method': 'Absorb with chemical absorbent material or dry sand if necessary, and store in tightly closed containers.',

    // Section 7
    'sec7.handling': 'Observe common chemical precautions during handling. Avoid contact with skin and eyes.\nKeep away from food, drink and tobacco. Wash hands before breaks and at the end of workday. Store work clothing separately.\nChange contaminated or soaked clothing.',
    'sec7.storage': 'Keep containers tightly closed in a dry, well-ventilated place. To maintain product quality, strictly follow the storage conditions in our technical data sheet.',

    // Section 8
    'sec8.respiratory_protection': 'Respiratory protection equipment is required during spraying.',
    'sec8.hand_protection': 'Protective gloves are recommended.',
    'sec8.glove_material': 'EN 374-3',
    'sec8.fkm_glove': 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min.',
    'sec8.iir_glove': 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min.',
    'sec8.nbr_glove': 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min.',
    'sec8.glove_recommendation': 'Contaminated gloves should be discarded.',
    'sec8.eye_protection': 'Wear protective goggles or face shield.',
    'sec8.body_protection': 'Wear appropriate protective clothing.',
    'sec8.engineering_controls': 'No exposure limit information is available under EC Directive 2006/121/EC.',

    // Section 9
    'sec9.appearance': sec9Facts.appearance,
    'sec9.odour_threshold': sec9Facts.odour_threshold,
    'sec9.ph': sec9Facts.ph,
    'sec9.ionicity': sec9Facts.ionicity,
    'sec9.boiling_point': sec9Facts.boiling_point,
    'sec9.flash_point': sec9Facts.flash_point,
    'sec9.evaporation_rate': sec9Facts.evaporation_rate,
    'sec9.flammability': sec9Facts.flammability,
    'sec9.combustion_value': sec9Facts.combustion_value,
    'sec9.saturated_vapour': sec9Facts.saturated_vapour,
    'sec9.vapour_density': sec9Facts.vapour_density,
    'sec9.density': sec9Facts.density,
    'sec9.solubility': sec9Facts.solubility,
    'sec9.surface_tension': sec9Facts.surface_tension,
    'sec9.partition_coefficient': sec9Facts.partition_coefficient,
    'sec9.auto_ignition': sec9Facts.auto_ignition,
    'sec9.ignition_temp': sec9Facts.ignition_temp,
    'sec9.decomposition_temp': sec9Facts.decomposition_temp,
    'sec9.viscosity': sec9Facts.viscosity,
    'sec9.explosive_properties': sec9Facts.explosive_properties,
    'sec9.dust_explosion': sec9Facts.dust_explosion,
    'sec9.solids': sec9Facts.solids,
    'sec9.other_info': sec9Facts.other_info,

    // Section 10
    'sec10.stability': 'No decomposition if used according to specifications.',
    'sec10.hazardous_decomp': decompEn,
    'sec10.hazardous_reactions': 'No hazardous reactions when stored and handled correctly.',

    // Section 11
    'sec11.toxicological': 'No toxicological studies are available for this product.',

    // Section 12
    'sec12.ecotoxicity': 'No ecotoxicological studies are available for this product.\nDo not allow to enter drains, water courses or soil.',
    'sec12.persistence': 'The product is not readily biodegradable.',
    'sec12.other_effects': 'According to ecotoxicological data, the product is classified as non-hazardous to fish and daphnia.',

    // Section 13
    'sec13.line1': 'Dispose of in accordance with applicable national standards and national or local regulations.',
    'sec13.line2': 'Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
    'sec13.general': 'Dispose of in accordance with applicable national standards and national or local regulations.\nWithin the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
    'sec13.methods': 'Empty containers as completely as possible (e.g., by pouring, scraping, or draining until “drip-dry”).\nThey may be sent to an appropriate collection point under existing chemical industry recycling schemes.\nRecycle containers in accordance with national regulations and applicable environmental requirements.\nDo not discharge waste via wastewater.',

    // Section 14
    'sec14.road_rail': 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.',
    'sec14.sea': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
    'sec14.air': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
    'sec14.special_precautions': 'Not regulated as dangerous goods.\nTemperature must not exceed +40℃ and must not fall below +5℃.\nKeep away from food, acids and bases.',

    // Section 15
    'sec15.regulations': 'Relevant safety, health and environmental regulations for the substance or mixture',

    // Section 16
    'sec16.other': 'To the best of our knowledge, the information provided in this Safety Data Sheet is accurate as of the date of publication. The information given is designed only as guidance for safe handling, use, processing, storage, transportation, disposal, and release and is not to be considered a warranty or quality specification. The information relates only to the specific material designated and may not be valid for such material used in combination with any other materials or in any process, unless specified in the text.',

    ...(facts.overrides || {})
  };
}

/**
 * 阶段一：建立中文基准文档 (Base-CN)
 */

/**
 * 规范化 Section 11 行高，消除模板历史写死的 1169 twips (2.06cm) 异常行高，收敛为标准行高 285 twips (0.50cm)
 */
function normalizeSection11RowHeight(row) {
  if (!row || !row.node) return;
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const trPr = row.node.getElementsByTagNameNS(W_NS, 'trPr')[0];
  if (!trPr) return;
  const trHeight = trPr.getElementsByTagNameNS(W_NS, 'trHeight')[0];
  if (trHeight) {
    const val = trHeight.getAttributeNS(W_NS, 'val') || trHeight.getAttribute('w:val');
    if (val && parseInt(val, 10) > 424) {
      trHeight.setAttributeNS(W_NS, 'w:val', '285');
    }
  }
}

export async function buildBaseChineseEngine({
  modelCode,
  cnGroundTruthBuffer = null,
  cnGroundTruthPath = null,
  sourceDocxBuffer = null,
  sourceDocxPath = null,
  revisionDate = null,
  viscosityOverride = null
}) {
  // 1. 读取源文件 Buffer
  let srcBuf = sourceDocxBuffer || cnGroundTruthBuffer;
  const srcPath = sourceDocxPath || cnGroundTruthPath;
  if (!srcBuf && srcPath) {
    srcBuf = await fs.readFile(srcPath);
  }
  if (!srcBuf) {
    throw new Error('建立中文基准必须提供 sourceDocxBuffer / cnGroundTruthBuffer 或路径');
  }

  // 2. 载入源文档并提取 16 大项事实记录与自适应真实修订日期
  const srcEngine = await loadDocx(srcBuf, 'source.docx');
  const adaptiveDate = extractAdaptiveRevisionDate(srcEngine);
  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !adaptiveDate || adaptiveDate.startsWith('2023') || adaptiveDate.startsWith('2024') || adaptiveDate.startsWith('2025');
  const finalRevisionDate = revisionDate || (!isOutdated ? adaptiveDate : todayDateStr);

  // 3. 运行官方智能匹配算法，从源文件中提取结构化事实 (践行“容器归母版，事实归源文”核心哲学)
  const matchResult = runSmartMatching(srcEngine.records);

  // 4. 载入官方正式中文底模 (铁律：必须使用官方标准模板，严禁直接使用源文件作为母版)
  const cnTplPath = path.join(TEMPLATES_DIR, '正式模板_MSDS_CN_冠志(1).docx');
  const cnTplBuf = await fs.readFile(cnTplPath);
  let engine = await loadDocx(cnTplBuf, `${modelCode} msds_CN 冠志.docx`);

  // 5. 将匹配结果精准装配映射入官方底模插槽，并执行空白精删、防污染与语义剪枝
  applyMatchResultToEditor(matchResult, engine);

  // 6. 统一底层 XML 页眉页脚数据 (支持自适应多模态注入)
  updateHeaderFooterData(engine, {
    model: modelCode,
    company: ENTITY_MATRIX.GUANZHI.cn.name,
    title: '物料安全数据表',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: finalRevisionDate,
    language: 'CN',
    entity: '冠志'
  });

  // 7. 规范化 Section 13 (消除拆行残余，确保标准 3 行结构)
  let s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13 && s13.rows.length === 4) {
    safeWriteCellValue(s13.rows[1].cells[0], '必须遵守适用的国标、国家或当地法规进行废弃。\n在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。');
    s13 = deleteRow(engine, s13, 2);
  }

  // 8. 若传入 viscosityOverride，原子级确保 Section 9 粘度值
  if (viscosityOverride) {
    const s9 = engine.records.find(r => r.sectionNumber === 9);
    if (s9) {
      for (const row of s9.rows) {
        const lbl = (row.cells[0]?.text || '').trim();
        if (/粘度/i.test(lbl) && row.cells[1]) {
          safeWriteCellValue(row.cells[1], viscosityOverride);
        }
      }
    }
  }

  // 9. 规范化 Section 2：非危化学品统一标准 4 行（1 标题 + 3 业务行：2.1 分类、2.2 标签、2.3 其他危害）
  // 遵循“左主干父级，右展开子级”法则与 457 dxa 悬挂缩进
  let s2 = engine.records.find(r => r.sectionNumber === 2);
  if (s2) {
    const isNonHaz = s2.rows.some(row => row.cells.some(c => /不属于危害化学品|不属于危险|not classified/i.test(c.text)));
    if (isNonHaz) {
      while (s2.rows.length < 4) {
        s2 = addRowAfter(engine, s2, s2.rows.length - 1);
      }
      while (s2.rows.length > 4) {
        s2 = deleteRow(engine, s2, s2.rows.length - 1);
      }

      writeCellLabel(s2.rows[1].cells[0], '2.1  物质或混合物的分类：', true);
      applyStandardHangingIndent(s2.rows[1].cells[0], '420', '420');
      safeWriteCellValue(s2.rows[1].cells[s2.rows[1].cells.length - 1], 'GHS 危险性类别：\r\n根据 GHS 不属于危害化学品。');

      writeCellLabel(s2.rows[2].cells[0], '2.2  标签要素：', true);
      applyStandardHangingIndent(s2.rows[2].cells[0], '420', '420');
      safeWriteCellValue(s2.rows[2].cells[s2.rows[2].cells.length - 1], 'GHS-象形图\r\n根据 GHS 不属于危害化学品。');

      writeCellLabel(s2.rows[3].cells[0], '2.3  其他危害：', true);
      applyStandardHangingIndent(s2.rows[3].cells[0], '420', '420');
      safeWriteCellValue(s2.rows[3].cells[s2.rows[3].cells.length - 1], '无适用资料。');
    }
  }

  // 10. 规范化 Section 8：若 8.2 为“不含有职业接触限值的物质”，一并删除下方的工作场所组分控制参数及四列表格
  let s8 = engine.records.find(r => r.sectionNumber === 8);
  if (s8) {
    const row82 = s8.rows.find(r => /8\.2\s*工程控制/i.test(r.cells[0]?.text || ''));
    const isNoOEL = row82 && /不含有职业接触限值|不含职业接触/i.test(row82.cells[row82.cells.length - 1]?.text || '');
    if (isNoOEL) {
      const r82Idx = s8.rows.indexOf(row82);
      while (s8.rows.length > r82Idx + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
    }
  }

  // 11. 规范化 Section 11：剪枝所有无值纯空行与未测端点，若为纯声明型严格收敛为 2 行
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    const hasPreambleOnly = s11.rows.length >= 2 && /无可用的毒理学研究/i.test(s11.rows[1].cells[0]?.text || '') &&
      !s11.rows.slice(2).some(row => row.cells.slice(1).some(c => {
        const t = (c.text || '').trim();
        return t.length > 0 && !/无数据资料/i.test(t);
      }));
    if (hasPreambleOnly) {
      while (s11.rows.length > 2) {
        s11 = deleteRow(engine, s11, s11.rows.length - 1);
      }
    } else {
      for (let i = s11.rows.length - 1; i >= 2; i--) {
        const row = s11.rows[i];
        const labelText = (row.cells[0]?.text || '').trim();
        // 法定保护行：特异性靶器官系统毒性、生殖毒性、吸入危险、附加信息与说明行即便为“无数据资料”亦属法定声明，严禁物理删除
        if (/特异性靶器官|生殖毒性|附加信息/i.test(labelText)) {
          continue;
        }
        if (/吸入危险|吸入危害/i.test(labelText)) {
          continue;
        }
        if (row.cells.length === 1) {
          continue;
        }
        const lastCell = row.cells[row.cells.length - 1];
        const lastText = (lastCell?.text || '').trim();
        const hasVal = lastText.length > 0 && !/无数据资料|AA|BB|CC/i.test(lastText);
        if (!hasVal) {
          s11 = deleteRow(engine, s11, i);
        }
      }
      renumberRecord(s11, '11');
      // 优先遵照源文件对齐皮肤刺激性法律标签 (如源文件为“主要皮肤刺激性:”)
      const skinRow = s11.rows.find(r => /原发性皮肤刺激|主要皮肤刺激/i.test(r.cells[0]?.text || ''));
      if (skinRow) {
        const hasMajorSkinInSource = matchResult?.matchedSections?.find(s => s.sectionNumber === 11)?.sourceRecord?.rows?.some(r => /主要皮肤刺激/i.test(r.cells.map(c => c.text).join('')));
        if (hasMajorSkinInSource) {
          writeCellLabel(skinRow.cells[0], '11.2  主要皮肤刺激性:', true);
        }
      }
    }
    // 确保 Section 11 附加信息完整注入
    const addInfoItem = matchResult?.matchedSections?.find(s => s.sectionNumber === 11)?.matchedRows?.find(r => r.key === 'additional_info');
    if (addInfoItem && addInfoItem.value) {
      const addRow = s11.rows.find(r => /附加信息/i.test(r.cells?.[0]?.text || ''));
      if (addRow && addRow.cells?.length > 1) {
        safeWriteCellValue(addRow.cells[addRow.cells.length - 1], addInfoItem.value);
      }
    }
    // 规范化 Section 11 实测各行行高，消除 11.4 致敏性等行的超高留白
    for (const row of s11.rows) {
      normalizeSection11RowHeight(row);
    }
  }

  // 严格保留模板原装序号与格式，严禁全局重排序号
  engine._adaptiveRevisionDate = finalRevisionDate;
  return engine;
}

/**
 * 阶段二：由中文基准事实派生英文基准文档 (Base-EN)
 */
/**
 * 毒理学描述与实测数据动态英译引擎 (彻底废除硬编码假数据)
 */
function translateToxicologyValueToEnglish(cnText) {
  if (!cnText || typeof cnText !== 'string') return '';
  let t = cnText.trim();
  if (!t) return '';
  if (/^无数据(?:资料)?[。.]?$/i.test(t)) return 'No data available.';

  // 提示语
  t = t.replace(/以下[为是]N[－-]甲基吡咯烷酮毒理学数据[：:]/g, 'The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):');
  t = t.replace(/以下[为是]N,N[－-]二甲基乙酰胺毒理学数据[：:]/g, 'The following are toxicological data for N,N-Dimethylacetamide (DMAC):');

  // 急性毒性经口/吸入/经皮实测值翻译
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*大鼠\s*[:：]\s*/g, 'LD50 / Oral / Rat: ');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*1h\s*[/／]\s*大鼠(?:\s*雌性)?\s*[:：]\s*/g, 'LC50 / Inhalation / 1h / Rat: ');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*4h\s*[/／]\s*大鼠(?:\s*雌性)?\s*[:：]\s*/g, 'LC50 / Inhalation / 4h / Rat: ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*豚鼠\s*[:：]\s*/g, 'LD50 / Dermal / Guinea pig: ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*兔\s*[:：]\s*/g, 'LD50 / Dermal / Rabbit: ');
  t = t.replace(/（此值仅用于有可吸入的颗粒形成的情况。?）/g, '(applicable only where respirable aerosols are formed)');

  // 皮肤与眼睛刺激
  t = t.replace(/物种\s*[:：]\s*兔子?/g, 'Species: Rabbit');
  t = t.replace(/物种\s*[:：]\s*小鼠/g, 'Species: Mouse');
  t = t.replace(/物种\s*[:：]\s*大鼠/g, 'Species: Rat');
  t = t.replace(/分类\s*[:：]\s*刺激皮肤/g, 'Classification: Irritating to skin');
  t = t.replace(/结果\s*[:：]\s*(?:轻度的皮肤刺激|轻度皮肤刺激)/g, 'Result: Mild skin irritation');
  t = t.replace(/结果\s*[:：]\s*造成皮肤刺激/g, 'Result: Causes skin irritation');
  t = t.replace(/分类\s*[:：]\s*刺激眼睛/g, 'Classification: Irritating to eyes');
  t = t.replace(/结果\s*[:：]\s*(?:轻度的眼睛刺激|轻度眼睛刺激)/g, 'Result: Mild eye irritation');
  t = t.replace(/结果\s*[:：]\s*严重的眼睛刺激/g, 'Result: Causes serious eye irritation');

  // 致敏性
  t = t.replace(/物种\s*[:：]\s*豚鼠/g, 'Species: Guinea pig');
  t = t.replace(/物种\s*[:：]\s*人类/g, 'Species: Human');
  t = t.replace(/分类\s*[:：]\s*不是皮肤过敏物质/g, 'Classification: Not a skin sensitizer');
  t = t.replace(/结果\s*[:：]\s*未引起实验室动物过敏/g, 'Result: Did not cause sensitization in laboratory animals');
  t = t.replace(/结果\s*[:：]\s*对志愿者做的皮肤接触试验证明没有过敏特性/g, 'Result: Patch test on human volunteers demonstrated no sensitizing properties');

  // 致突变性、致癌性
  t = t.replace(/在细菌细胞培养中没有引起基因损害。?/g, 'Did not cause genetic damage in bacterial cell culture. ');
  t = t.replace(/在哺乳类细胞培养中没有引起基因损害。?/g, 'Did not cause genetic damage in mammalian cell culture. ');
  t = t.replace(/有证据认为此物质不会在动物中引起基因损伤。?/g, 'Evidence indicates substance does not cause genetic damage in animals.');
  t = t.replace(/对细菌或哺乳动物细胞培养未见致突变影响。?\s*动物试验中未见致突变性影响。?/g, 'No mutagenic effects observed in bacterial or mammalian cell cultures. No mutagenic effects observed in animal studies.');
  t = t.replace(/在动物试验中未见致癌影响。?/g, 'No carcinogenic effects observed in animal studies.');

  // 生殖毒性
  t = t.replace(/动物试验表明无生殖毒性。?/g, 'Animal testing showed no reproductive toxicity. ');
  t = t.replace(/动物实验表明在低于那些引起母体中毒的量时，对胚胎有影响。?/g, 'Animal experiments showed effects on the embryo at levels below those causing maternal toxicity. ');
  t = t.replace(/降低了胚胎胎儿的成活力，胎儿发育缓慢[（(]变异[）)]，胎儿畸形。?/g, 'Reduced embryo-fetal viability, slow fetal development (variations), fetal malformations.');
  t = t.replace(/在动物试验中，发现仅在射入高剂量的此物质后才有损坏生育的风险。?/g, 'Animal experiments showed risks of impaired fertility only at high doses. ');
  t = t.replace(/在动物试验显现出致畸效应。?/g, 'Animal experiments showed teratogenic effects. ');
  t = t.replace(/可能对胎儿造成伤害。?/g, 'May damage the unborn child.');

  // STOT 与 附加信息
  t = t.replace(/可能造成呼吸道刺激。?/g, 'May cause respiratory irritation.');
  t = t.replace(/饮酒精饮料会加剧毒性影响。?/g, 'Drinking alcoholic beverages can exacerbate toxic effects.\n');
  t = t.replace(/N[－-]甲基吡咯烷酮有经皮吸收危险。?/g, 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).');
  t = t.replace(/重复剂量中毒\s*[:：]\s*经口/g, 'Repeated dose toxicity: Oral');
  t = t.replace(/病理变化\s*[:：]\s*胃，睾丸，肝，肾，红血球异常减少。?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red blood cells.\n');
  t = t.replace(/重复剂量中毒\s*[:：]\s*吸入/g, 'Repeated dose toxicity: Inhalation');
  t = t.replace(/病理变化\s*[:：]\s*肾、肝影响，视网膜损伤。?/g, 'Pathological changes: kidney and liver effects, retinal damage.');

  return t.trim();
}


/**
 * Section 12 前置组分引言说明行专业英译
 */
export function translateSection12PreambleToEnglish(cnText) {
  if (!cnText) return '';
  if (/无可用的生态|未做任何试验|生态学/i.test(cnText)) {
    return 'No ecotoxicological studies are available for this product.';
  }
  const match = cnText.match(/以下(?:是|为)(.*?)(?:生态毒理学(?:参考)?数据|毒理学数据)[：:]?/);
  if (match) {
    let comp = match[1].trim();
    if (/N,N[－-]二甲基乙酰胺|二甲基乙酰胺|DMAC/i.test(comp)) comp = 'N,N-Dimethylacetamide';
    else if (/N[－-]甲基吡咯烷酮|NMP/i.test(comp)) comp = 'N-Methyl-2-pyrrolidone (NMP)';
    else if (/N[－-]乙基吡咯烷酮|NEP/i.test(comp)) comp = '1-Ethylpyrrolidin-2-one (NEP)';
    else if (/二乙二醇单丁醚/i.test(comp)) comp = 'Diethylene glycol monobutyl ether (CAS: 112-34-5)';
    else if (/异丙醇/i.test(comp)) comp = 'Isopropanol';
    return `The following are ecotoxicological data for ${comp}:`;
  }
  return 'The following are ecotoxicological data for the components:';
}

/**
 * Section 12 生态毒理实测指标专业英译 (鱼类、藻类、水蚤等)
 */
export function translateEcotoxicityValueToEnglish(cnText) {
  if (!cnText) return 'No ecotoxicological studies are available for this product.\nDo not allow to enter drains, water courses or soil.';
  let en = cnText;
  en = en.replace(/对鱼类的毒性[：:]/g, 'Toxicity to fish:\n');
  en = en.replace(/半数致死浓度[（(]LC50[）)]\/(\d+)\s*h\/虹鳟[：:]/gi, 'LC50 / $1 h / Oncorhynchus mykiss (rainbow trout): ');
  en = en.replace(/半数致死浓度[（(]LC50[）)]\/(\d+)\s*h\/黑头呆鱼[：:]/gi, 'LC50 / $1 h / Pimephales promelas (fathead minnow): ');
  en = en.replace(/半数致死浓度[（(]LC50[）)]\/(\d+)\s*h\/斑马鱼[：:]/gi, 'LC50 / $1 h / Danio rerio (zebra fish): ');
  en = en.replace(/其他[：:]/g, 'Other:\n');
  en = en.replace(/半数致死有效浓度[（(]EC50[）)]\/(\d+)\s*h\/藻类[：:]/g, 'EC50 / $1 h / Algae: ');
  en = en.replace(/半数致死有效浓度[（(]EC50[）)]\/(\d+)\s*h\/大型溞[：:]/g, 'EC50 / $1 h / Daphnia magna: ');
  en = en.replace(/对水蚤及其他水生无脊椎动物的毒性[：:]/g, 'Toxicity to daphnia and other aquatic invertebrates:\n');
  en = en.replace(/对藻类的毒性[：:]/g, 'Toxicity to algae:\n');
  en = en.replace(/对微生物的毒性[：:]/g, 'Toxicity to microorganisms:\n');
  return en.replace(/\n\s*\n+/g, '\n').trim();
}

export function translatePersistenceValueToEnglish(cnText) {
  if (!cnText) return 'The product is not readily biodegradable.';
  if (/无数据/i.test(cnText)) return 'No data available.';
  if (/易生物降解/i.test(cnText)) {
    let t = cnText;
    t = t.replace(/生物降解性[：:]/g, 'Biodegradability: ');
    t = t.replace(/，即易生物降解[。.]?/g, ', readily biodegradable.');
    t = t.replace(/易生物降解[。.]?/g, 'Readily biodegradable.');
    t = t.replace(/，/g, ', ');
    return t.trim();
  }
  if (/不易生物降解|不属于易降解/i.test(cnText)) return 'The product is not readily biodegradable.';
  return 'The product is not readily biodegradable.';
}

export async function buildBaseEnglishEngine({
  modelCode,
  baseCnEngine = null,
  enTemplateBuffer = null,
  facts = {},
  revisionDate = null
}) {
  let tplBuf = enTemplateBuffer;
  if (!tplBuf) {
    const tplPath = path.join(TEMPLATES_DIR, '正式模板_MSDS_EN_冠志(1).docx');
    tplBuf = await fs.readFile(tplPath);
  }

  // 1. 载入官方正式英文底模 (必须使用模板，构建编辑器实例)
  const engine = await loadDocx(tplBuf, `MSDS_EN_${modelCode}.docx`);
  const enValues = buildEnglishFacts(modelCode, facts, baseCnEngine);

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine?._adaptiveRevisionDate || baseCnEngine._adaptiveRevisionDate.startsWith('2023') || baseCnEngine._adaptiveRevisionDate.startsWith('2024') || baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveRevisionDate = revisionDate || (!isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr);

  updateHeaderFooterData(engine, {
    model: modelCode,
    company: ENTITY_MATRIX.GUANZHI.en.name,
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: effectiveRevisionDate,
    language: 'EN',
    entity: '冠志'
  });

  const safeWrite = (cell, val) => {
    if (cell && val !== undefined && val !== null) {
      if (!cell.editable) cell.editable = true;
      let finalVal = val;
      if (typeof finalVal === 'string') {
        const trimmed = finalVal.trim();
        if (/^不适用$/i.test(trimmed)) finalVal = 'Not applicable';
        else if (/^无数据(?:资料)?$/i.test(trimmed)) finalVal = 'No data available.';
        else if (/^未测定$/i.test(trimmed)) finalVal = 'Not determined';
        else if (/^商业机密|商业秘密$/i.test(trimmed)) finalVal = 'Trade secret';
      }
      writeCellValue(cell, finalVal);
      normalizeCellEnglishFonts(cell);
    }
  };

  const safeWriteLabel = (cell, val) => {
    if (cell && val !== undefined && val !== null) {
      writeCellLabel(cell, val, true);
    }
  };

  // Section 1 (严格遵从底模原生结构，保留 1.3 序号与空行，严禁改动任何标签与格式)
  const s1 = engine.records.find(r => r.sectionNumber === 1);
  if (s1) {
    for (const row of s1.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue; // 1.3 供应商信息单列行直接保留原样，绝不删除，绝不改序号
      if (/Product name/i.test(lbl)) safeWrite(c1, enValues['sec1.product_name']);
      else if (/Chemical category/i.test(lbl)) safeWrite(c1, enValues['sec1.chemical_category']);
      else if (/Product use suggestions/i.test(lbl)) safeWrite(c1, enValues['sec1.recommended_use']);
      else if (/Name of supplier/i.test(lbl)) safeWrite(c1, ENTITY_MATRIX.GUANZHI.en.name);
      else if (/Supplier address/i.test(lbl)) safeWrite(c1, enValues['sec1.supplier_address'] || ENTITY_MATRIX.GUANZHI.en.address);
      else if (/Tel/i.test(lbl)) safeWrite(c1, enValues['sec1.telephone'] || ENTITY_MATRIX.GUANZHI.en.tel);
      else if (/Fax/i.test(lbl)) safeWrite(c1, enValues['sec1.fax'] || ENTITY_MATRIX.GUANZHI.en.fax);
    }
  }

  // Section 2 (非危品严格 4 行对称，危害品动态展开，457 dxa 悬挂缩进)
  let s2 = engine.records.find(r => r.sectionNumber === 2);
  if (s2) {
    const isNonHaz = enValues['sec2.is_non_haz'] !== false;
    if (isNonHaz) {
      // 非危险化学品：严格收敛为 4 行结构 (标题 + 2.1分类 + 2.2标签 + 2.3其他危害)，彻底物理删除 2.3 防范说明旧行
      while (s2.rows.length < 4) s2 = addRowAfter(engine, s2, s2.rows.length - 1);
      while (s2.rows.length > 4) s2 = deleteRow(engine, s2, s2.rows.length - 1);

      writeCellLabel(s2.rows[1].cells[0], '2.1  Classification of the substance or mixture: ', true);
      applyStandardHangingIndent(s2.rows[1].cells[0], '420', '420');
      safeWriteCellValue(s2.rows[1].cells[1], 'GHS hazard class:\nNot classified as a hazardous chemical according to GHS.');

      writeCellLabel(s2.rows[2].cells[0], '2.2  GHS Label Elements: ', true);
      applyStandardHangingIndent(s2.rows[2].cells[0], '420', '420');
      safeWriteCellValue(s2.rows[2].cells[1], 'GHS pictogram:\nNot classified as a hazardous chemical according to GHS.');

      writeCellLabel(s2.rows[3].cells[0], '2.3  Other Hazards: ', true);
      applyStandardHangingIndent(s2.rows[3].cells[0], '420', '420');
      safeWriteCellValue(s2.rows[3].cells[1], 'No applicable information.');
    } else {
      // 危险化学品：基于中文母版 1:1 绝对镜像同构 (严格收敛为 8 行，彻底消灭 Emergency Overview 虚构假数据与旧模板占位符)
      // 1. 删除底模无意义且未对齐中文的 Row 1 (Emergency Overview)
      s2 = deleteRow(engine, s2, 1);

      // 2. 删除第 8 行及之后的所有冗余死重行 (只保留 Row 0 到 Row 7 共 8 行)
      while (s2.rows.length > 8) {
        s2 = deleteRow(engine, s2, s2.rows.length - 1);
      }

      // 3. 从中文母版中动态提取真实危险性事实
      const cnS2 = baseCnEngine?.records?.find(r => r.sectionNumber === 2);
      const fullCnS2Text = cnS2 ? cnS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';
      const cnSignalText = cnS2?.rows?.find(r => /信号词|警示词/i.test(r.cells[0]?.text || ''))?.cells[1]?.text || fullCnS2Text;

      const dynamicPictogram = deriveGhsPictograms(fullCnS2Text);
      const dynamicSignalWord = deriveSignalWord(cnSignalText);

      let dynamicHazardStatements = enValues['sec2.ghs_label_elements'] || '';
      dynamicHazardStatements = dynamicHazardStatements
        .replace(/^Signal word:[^\r\n]*[\r\n]+/i, '')
        .replace(/^Hazard statement\(s\):\s*/i, '')
        .trim();

      // Row 1: 2.1 GHS Hazard Classification:
      writeCellLabel(s2.rows[1].cells[0], '2.1  GHS Hazard Classification:', true);
      safeWrite(s2.rows[1].cells[1], enValues['sec2.ghs_classification']);

      // Row 2: 2.2 GHS Label Elements: (单列/右列空，彻底清理 F 占位符)
      writeCellLabel(s2.rows[2].cells[0], '2.2  GHS Label Elements:', true);
      safeWrite(s2.rows[2].cells[1], '');

      // Row 3: GHS Pictograms: (无序号子项，优先从中文母版移植真实 GHS 象形图图片)
      writeCellLabel(s2.rows[3].cells[0], 'GHS Pictograms:', true);
      let picTransferred = false;
      if (baseCnEngine) {
        const cnPicRow = cnS2?.rows?.find(r => /象形图/i.test(r.cells[0]?.text || ''));
        const cnDrawings = Array.from(cnPicRow?.cells?.[1]?.node?.getElementsByTagNameNS(W_NS, 'drawing') || []);
        if (cnDrawings.length > 0) {
          try {
            picTransferred = transferDrawingToCell(baseCnEngine, engine, cnDrawings, s2.rows[3].cells[1]);
          } catch (e) {
            console.warn('[GHS Pictogram] 移植象形图图片失败，降级为文本符号:', e.message);
          }
        }
      }
      if (!picTransferred) {
        safeWrite(s2.rows[3].cells[1], dynamicPictogram);
      }

      // Row 4: 2.3 Signal Word:
      writeCellLabel(s2.rows[4].cells[0], '2.3  Signal Word:', true);
      safeWrite(s2.rows[4].cells[1], dynamicSignalWord);

      // Row 5: 2.4 Hazard Statements:
      writeCellLabel(s2.rows[5].cells[0], '2.4  Hazard Statements:', true);
      safeWrite(s2.rows[5].cells[1], dynamicHazardStatements);

      // Row 6: 2.5 Precautionary Statements:
      writeCellLabel(s2.rows[6].cells[0], '2.5  Precautionary Statements:', true);
      safeWrite(s2.rows[6].cells[1], enValues['sec2.precautionary_statements']);

      // Row 7: 2.6 Other Hazards: (承接透皮吸收等其他危害事实)
      writeCellLabel(s2.rows[7].cells[0], '2.6  Other Hazards:', true);
      safeWrite(s2.rows[7].cells[1], enValues['sec2.other_hazards'] || 'No applicable information.');
    }
  }

  // Section 3 (以中文母版组分顺序为绝对镜像，动态同构增减行)
  let s3 = engine.records.find(r => r.sectionNumber === 3);
  if (s3) {
    if (s3.rows[1]?.cells[1]) safeWrite(s3.rows[1].cells[1], enValues['sec3.product_type'] || 'Mixture');
    
    // 优先从 baseCnEngine 真实提取组分列表
    let comps = facts.components;
    if (!comps && baseCnEngine) {
      const cnS3 = baseCnEngine.records.find(r => r.sectionNumber === 3);
      if (cnS3 && cnS3.rows.length > 4) {
        comps = [];
        for (let i = 4; i < cnS3.rows.length; i++) {
          const r = cnS3.rows[i];
          const cnName = (r.cells[0]?.text || '').trim();
          let cas = (r.cells[1]?.text || '').trim();
          const conc = (r.cells[2]?.text || '').trim();
          let enName = cnName;
          if (/封闭型脂肪族聚异氰酸酯/i.test(cnName)) enName = 'Blocked aliphatic polyisocyanate';
          else if (/丙酮/i.test(cnName)) enName = 'Acetone';
          else if (/乙酸/i.test(cnName)) enName = 'Acetic acid';
          else if (/聚乙烯蜡/i.test(cnName)) enName = 'Polyethylene wax';
          else if (/蜡/i.test(cnName)) enName = 'Wax';
          else if (/二甲基乙酰胺|DMAC/i.test(cnName)) enName = 'N,N-Dimethylacetamide (DMAC)';
          else if (/甲基吡咯烷酮|NMP/i.test(cnName)) enName = 'N-Methyl-2-pyrrolidone (NMP)';
          else if (/乙基吡咯烷酮|NEP/i.test(cnName)) enName = '1-Ethylpyrrolidin-2-one (NEP)';
          else if (/去离子水/i.test(cnName)) enName = 'Deionized water';
          else if (/聚氨酯.*分散体|水性聚氨酯/i.test(cnName)) enName = 'Polyurethane dispersion';
          else if (/聚氨酯/i.test(cnName)) enName = 'Polyurethane';
          else if (/水$/i.test(cnName)) enName = 'Water';
          if (/商业机密|商业秘密/i.test(cas)) cas = 'Trade secret';

          comps.push({
            name: enName,
            cas: /商业机密|商业秘密/i.test(cas) ? 'Trade secret' : cas,
            conc: conc
          });
        }
      }
    }
    if (!comps || comps.length === 0) {
      comps = [
        enValues['sec3.comp1_name'] ? { name: enValues['sec3.comp1_name'], cas: enValues['sec3.comp1_cas'], conc: enValues['sec3.comp1_conc'] } : null,
        enValues['sec3.comp2_name'] ? { name: enValues['sec3.comp2_name'], cas: enValues['sec3.comp2_cas'], conc: enValues['sec3.comp2_conc'] } : null,
        enValues['sec3.comp3_name'] ? { name: enValues['sec3.comp3_name'], cas: enValues['sec3.comp3_cas'], conc: enValues['sec3.comp3_conc'] } : null
      ].filter(Boolean);
    }

    const targetRowCount = 4 + comps.length;
    while (s3.rows.length < targetRowCount) {
      s3 = addRowAfter(engine, s3, s3.rows.length - 1);
    }
    while (s3.rows.length > targetRowCount) {
      s3 = deleteRow(engine, s3, s3.rows.length - 1);
    }
    comps.forEach((comp, idx) => {
      const row = s3.rows[4 + idx];
      if (row) {
        safeWrite(row.cells[0], comp.name);
        safeWrite(row.cells[1], comp.cas);
        safeWrite(row.cells[2], comp.conc);
      }
    });
  }

  // Section 4
  const s4 = engine.records.find(r => r.sectionNumber === 4);
  if (s4) {
    for (const row of s4.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/General/i.test(lbl)) safeWrite(c1, enValues['sec4.general_advice']);
      else if (/Ingestion/i.test(lbl)) safeWrite(c1, enValues['sec4.ingestion']);
      else if (/Eye/i.test(lbl)) safeWrite(c1, enValues['sec4.eye_contact']);
      else if (/Skin/i.test(lbl)) safeWrite(c1, enValues['sec4.skin_contact']);
      else if (/Inhalation/i.test(lbl)) safeWrite(c1, enValues['sec4.inhalation']);
    }
  }

  // Section 5
  const s5 = engine.records.find(r => r.sectionNumber === 5);
  if (s5) {
    for (const row of s5.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      // 关键修复：Unsuitable 包含 Suitable 子串，必须优先严格匹配 Unsuitable，严禁被 Suitable 错误截胡！
      if (/Unsuitable/i.test(lbl)) safeWrite(c1, enValues['sec5.unsuitable_extinguishing']);
      else if (/Suitable/i.test(lbl)) safeWrite(c1, enValues['sec5.suitable_extinguishing']);
      else if (/Special hazards/i.test(lbl)) safeWrite(c1, enValues['sec5.specific_hazards']);
      else if (/Firefighting precautions/i.test(lbl)) safeWrite(c1, enValues['sec5.protective_equipment']);
    }
  }

  // Section 6 (严格保持底模原生标签、字体与段落格式不变，仅写入右侧内容值)
  const s6 = engine.records.find(r => r.sectionNumber === 6);
  if (s6) {
    for (const row of s6.rows) {
      const c0 = row.cells[0];
      const c1 = row.cells[1];
      if (!c1) continue;
      const lbl = (c0?.text || '').trim();
      if (/6\.1/i.test(lbl)) {
        safeWrite(c1, enValues['sec6.personal_precautions']);
      } else if (/6\.2|Environmental/i.test(lbl)) {
        safeWrite(c1, enValues['sec6.environmental_precautions']);
      } else if (/6\.3|Methods/i.test(lbl)) {
        safeWrite(c1, enValues['sec6.cleaning_method']);
      }
    }
  }

  // Section 7
  const s7 = engine.records.find(r => r.sectionNumber === 7);
  if (s7) {
    for (const row of s7.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Safe handling/i.test(lbl)) safeWrite(c1, enValues['sec7.handling']);
      else if (/Safe storage/i.test(lbl)) safeWrite(c1, enValues['sec7.storage']);
    }
  }

  // Section 8
  let s8 = engine.records.find(r => r.sectionNumber === 8);
  if (s8) {
    for (const row of s8.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (c1) {
        if (/Respiratory protection/i.test(lbl)) safeWrite(c1, enValues['sec8.respiratory_protection']);
        else if (/Hand protection/i.test(lbl)) safeWrite(c1, enValues['sec8.hand_protection']);
        else if (/Suitable material/i.test(lbl)) safeWrite(c1, enValues['sec8.glove_material']);
        else if (/Fluororubber|FKM/i.test(lbl)) safeWrite(c1, enValues['sec8.fkm_glove']);
        else if (/Butyl rubber|IIR/i.test(lbl)) safeWrite(c1, enValues['sec8.iir_glove']);
        else if (/Nitrile rubber|NBR/i.test(lbl)) safeWrite(c1, enValues['sec8.nbr_glove']);
        else if (/Recommendation/i.test(lbl)) safeWrite(c1, enValues['sec8.glove_recommendation']);
        else if (/Eye protection/i.test(lbl)) safeWrite(c1, enValues['sec8.eye_protection']);
        else if (/Body protection/i.test(lbl)) safeWrite(c1, enValues['sec8.body_protection']);
        else if (/Engineering controls/i.test(lbl)) safeWrite(c1, enValues['sec8.engineering_controls']);
      }
    }
    while (s8.rows.length > 12) {
      s8 = deleteRow(engine, s8, s8.rows.length - 1);
    }
  }

  // Section 9 【核心重构：以中文母版保留项为绝对基准，对英文底模执行同构剪枝与编号对齐】
  let s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    // 1. 先将已知的值写入英文模板对应槽位
    for (const row of s9.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Appearance/i.test(lbl)) safeWrite(c1, enValues['sec9.appearance']);
      else if (/Odour threshold/i.test(lbl)) safeWrite(c1, enValues['sec9.odour_threshold']);
      else if (/pH value/i.test(lbl)) safeWrite(c1, enValues['sec9.ph']);
      else if (/Ionicity/i.test(lbl)) safeWrite(c1, enValues['sec9.ionicity']);
      else if (/Initial boiling/i.test(lbl)) safeWrite(c1, enValues['sec9.boiling_point']);
      else if (/Flash point/i.test(lbl)) safeWrite(c1, enValues['sec9.flash_point']);
      else if (/Evaporation rate/i.test(lbl)) safeWrite(c1, enValues['sec9.evaporation_rate']);
      else if (/Flammability/i.test(lbl)) safeWrite(c1, enValues['sec9.flammability']);
      else if (/Heat of combustion|Combustion/i.test(lbl)) safeWrite(c1, enValues['sec9.combustion_value']);
      else if (/Saturated vapour/i.test(lbl)) safeWrite(c1, enValues['sec9.saturated_vapour']);
      else if (/Relative vapour/i.test(lbl)) safeWrite(c1, enValues['sec9.vapour_density']);
      else if (/Density/i.test(lbl)) safeWrite(c1, enValues['sec9.density']);
      else if (/Solubility in water/i.test(lbl)) safeWrite(c1, enValues['sec9.solubility']);
      else if (/Surface tension/i.test(lbl)) safeWrite(c1, enValues['sec9.surface_tension']);
      else if (/log Pow|Partition/i.test(lbl)) safeWrite(c1, enValues['sec9.partition_coefficient']);
      else if (/Auto-ignition/i.test(lbl)) safeWrite(c1, enValues['sec9.auto_ignition']);
      else if (/Ignition temp/i.test(lbl)) safeWrite(c1, enValues['sec9.ignition_temp']);
      else if (/Decomposition/i.test(lbl)) safeWrite(c1, enValues['sec9.decomposition_temp']);
      else if (/Dynamic viscosity/i.test(lbl)) safeWrite(c1, enValues['sec9.viscosity']);
      else if (/Explosive properties/i.test(lbl)) safeWrite(c1, enValues['sec9.explosive_properties']);
      else if (/Dust explosion/i.test(lbl)) safeWrite(c1, enValues['sec9.dust_explosion']);
      else if (/Solid(?:s)?\s*content/i.test(lbl)) safeWrite(c1, enValues['sec9.solids']);
      else if (/Other information/i.test(lbl)) safeWrite(c1, enValues['sec9.other_info']);
    }

    // 2. 若有 baseCnEngine，提取中文 Section 9 包含的物理量关键词白名单
    if (baseCnEngine) {
      const cnS9 = baseCnEngine.records.find(r => r.sectionNumber === 9);
      if (cnS9) {
        const cnIndicators = cnS9.rows.map(r => (r.cells[0]?.text || '').trim());
        const hasSaturatedVapour = cnIndicators.some(t => /饱和蒸气压/i.test(t));
        const hasSurfaceTension = cnIndicators.some(t => /表面张力/i.test(t));
        const hasPartition = cnIndicators.some(t => /分配系数/i.test(t));
        const hasAutoIgnition = cnIndicators.some(t => /自燃温度/i.test(t));
        const hasIgnitionTemp = cnIndicators.some(t => /引燃温度/i.test(t));
        const hasDecompTemp = cnIndicators.some(t => /分解温度/i.test(t));
        const hasExplosive = cnIndicators.some(t => /爆炸特性|爆炸极限/i.test(t));
        const hasDustExplosion = cnIndicators.some(t => /粉尘爆炸/i.test(t));

        // 倒序对中文不存在的未测死重行执行同构剪枝
        for (let rIdx = s9.rows.length - 1; rIdx >= 1; rIdx--) {
          const rowText = (s9.rows[rIdx]?.cells[0]?.text || '').trim();
          let shouldPrune = false;
          if (!hasSaturatedVapour && /Saturated vapour/i.test(rowText)) shouldPrune = true;
          else if (!hasSurfaceTension && /Surface tension/i.test(rowText)) shouldPrune = true;
          else if (!hasPartition && /log Pow|Partition/i.test(rowText)) shouldPrune = true;
          else if (!hasAutoIgnition && /Auto-ignition/i.test(rowText)) shouldPrune = true;
          else if (!hasIgnitionTemp && /Ignition temp/i.test(rowText)) shouldPrune = true;
          else if (!hasDecompTemp && /Decomposition/i.test(rowText)) shouldPrune = true;
          else if (!hasExplosive && /Explosive properties/i.test(rowText)) shouldPrune = true;
          else if (!hasDustExplosion && /Dust explosion/i.test(rowText)) shouldPrune = true;

          if (shouldPrune) {
            s9 = deleteRow(engine, s9, rIdx);
          }
        }
      }
    }

    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号
    renumberRecord(s9, '9');
  }

  // Section 10 (提取真实分解产物并英译，如二甲基吡唑)
  let s10 = engine.records.find(r => r.sectionNumber === 10);
  if (s10) {
    let decompEn = enValues['sec10.hazardous_decomp'];
    if (baseCnEngine) {
      const cnS10 = baseCnEngine.records.find(r => r.sectionNumber === 10);
      const decompRow = cnS10?.rows?.find(r => /10\.2|危险分解/i.test(r.cells[0]?.text || ''));
      const decompCn = decompRow?.cells?.[decompRow.cells.length - 1]?.text || '';
      if (/二甲基吡唑/i.test(decompCn)) {
        decompEn = 'Releases 3,5-dimethylpyrazole under baking conditions. Gases released during baking should be vented.';
      }
    }

    for (const row of s10.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Chemical stability/i.test(lbl)) safeWrite(c1, enValues['sec10.stability']);
      else if (/Hazardous decomposition/i.test(lbl)) safeWrite(c1, decompEn);
      else if (/Possible hazardous|Possibility of hazardous/i.test(lbl)) safeWrite(c1, enValues['sec10.hazardous_reactions']);
      else if (/无数据/i.test(c1.text)) safeWrite(c1, 'No data available.');
    }
    while (s10.rows.length > 4) {
      s10 = deleteRow(engine, s10, s10.rows.length - 1);
    }
  }

  // Section 11 【核心重构：彻底废除硬编码假数据与粗暴删行，基于中文母版实测端点动态英译装配】
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    const cnS11 = baseCnEngine?.records?.find(r => r.sectionNumber === 11);
    
    // 1. 动态自适应顶部的产品毒理学声明语（双说明行对齐中文母版）
    const cnS11Preambles = [];
    if (cnS11) {
      for (let i = 1; i < cnS11.rows.length; i++) {
        const t = cnS11.rows[i].cells.map(c => c.text || '').join('').trim();
        if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|Acute toxicity|11\.\d/i.test(t)) break;
        if (t) cnS11Preambles.push(t);
      }
    }

    if (cnS11Preambles.length >= 2) {
      if (s11.rows[1]?.cells?.[0]) {
        safeWrite(s11.rows[1].cells[0], 'No toxicological studies were available for this product.');
      }
      if (s11.rows[2]?.cells?.[0]) {
        let enIntro = 'The following are toxicological data for the component:';
        if (/N[－\-—\s]*甲基吡咯烷酮|NMP/i.test(cnS11Preambles[1])) {
          enIntro = 'The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):';
        } else if (/N,N[－\-—\s]*二甲基乙酰胺|DMAC/i.test(cnS11Preambles[1])) {
          enIntro = 'The following are toxicological data for N,N-Dimethylacetamide (DMAC):';
        } else if (/以[下为](?:是)?(.*?)毒理学数据/i.test(cnS11Preambles[1])) {
          const comp = cnS11Preambles[1].match(/以[下为](?:是)?(.*?)毒理学数据/i)[1].trim();
          enIntro = `The following are toxicological data for ${comp}:`;
        }
        safeWrite(s11.rows[2].cells[0], enIntro);
      }
    } else if (cnS11Preambles.length === 1) {
      if (s11.rows[1]?.cells?.[0]) {
        safeWrite(s11.rows[1].cells[0], 'No toxicological studies were available for this product.');
      }
      if (s11.rows[2]?.cells?.length === 1) {
        s11 = deleteRow(engine, s11, 2);
      }
    } else if (cnS11Preambles.length === 0) {
      if (s11.rows[2]?.cells?.length === 1) s11 = deleteRow(engine, s11, 2);
      if (s11.rows[1]?.cells?.length === 1) s11 = deleteRow(engine, s11, 1);
    }

    // 2. 从中文母版动态映射并英译实测端点 (绝不写死假数据)
    if (cnS11) {
      const findCnVal = (re) => {
        const row = cnS11.rows.find(r => re.test(r.cells.map(c => c.text).join(' ')));
        if (!row) return '';
        return (row.cells[row.cells.length - 1]?.text || '').trim();
      };

      const oralCn = findCnVal(/经口/i);
      const inhalCn = findCnVal(/吸入/i);
      const dermCn = findCnVal(/经皮/i);
      const skinIrrCn = findCnVal(/皮肤刺激/i);
      const eyeIrrCn = findCnVal(/主要粘膜刺激|眼睛刺激/i);
      const sensCn = findCnVal(/致敏性/i);
      const mutCn = findCnVal(/致突变性|遗传毒性/i);
      const carcCn = findCnVal(/致癌性/i);
      const repCn = findCnVal(/生殖毒性/i);
      const stotCn = findCnVal(/特异性靶器官/i);
      const aspCn = findCnVal(/吸入危险|吸入危害/i);
      const addInfoCn = findCnVal(/附加信息/i);

      for (let i = 0; i < s11.rows.length; i++) {
        const row = s11.rows[i];
        const rText = row.cells.map(c => c.text).join(' ');
        const lastCell = row.cells[row.cells.length - 1];
        if (!lastCell) continue;

        if (/Oral/i.test(rText) && oralCn) safeWrite(lastCell, translateToxicologyValueToEnglish(oralCn));
        else if (/Inhalation/i.test(rText) && inhalCn) safeWrite(lastCell, translateToxicologyValueToEnglish(inhalCn));
        else if (/Dermal/i.test(rText) && dermCn) safeWrite(lastCell, translateToxicologyValueToEnglish(dermCn));
        else if (/Primary skin irritation/i.test(rText) && skinIrrCn) safeWrite(lastCell, translateToxicologyValueToEnglish(skinIrrCn));
        else if (/Primary eye irritation/i.test(rText) && eyeIrrCn) safeWrite(lastCell, translateToxicologyValueToEnglish(eyeIrrCn));
        else if (/Sensitization/i.test(rText) && sensCn) safeWrite(lastCell, translateToxicologyValueToEnglish(sensCn));
        else if (/Mutagenicity/i.test(rText) && mutCn) safeWrite(lastCell, translateToxicologyValueToEnglish(mutCn));
        else if (/Carcinogenicity/i.test(rText) && carcCn) safeWrite(lastCell, translateToxicologyValueToEnglish(carcCn));
        else if (/Reproductive toxicity/i.test(rText) && repCn) safeWrite(lastCell, translateToxicologyValueToEnglish(repCn));
        else if (/Specific target organ/i.test(rText) && stotCn) safeWrite(lastCell, translateToxicologyValueToEnglish(stotCn));
        else if (/Aspiration hazard/i.test(rText) && aspCn) safeWrite(lastCell, translateToxicologyValueToEnglish(aspCn));
        else if (/Additional information/i.test(rText) && addInfoCn) safeWrite(lastCell, translateToxicologyValueToEnglish(addInfoCn));
      }

      // 3. 动态精简：仅删除中文母版中确实不存在且英文模板中无实测值的空白行，严禁误删生殖毒性、STOT与附加信息
      for (let i = s11.rows.length - 1; i >= 3; i--) {
        const row = s11.rows[i];
        const rText = row.cells.map(c => c.text).join(' ');
        const lastCellText = (row.cells[row.cells.length - 1]?.text || '').trim();
        let shouldPrune = false;
        if (/Inhalation:/i.test(rText) && !inhalCn) shouldPrune = true;
        else if (/Dermal:/i.test(rText) && !dermCn) shouldPrune = true;
        else if (/Carcinogenicity/i.test(rText) && !carcCn) shouldPrune = true;
        else if (/Teratogenicity/i.test(rText) && !findCnVal(/致畸/i)) shouldPrune = true;
        else if (/In vitro genotoxicity/i.test(rText) && !findCnVal(/体外遗传毒性|体外基因毒性/i)) shouldPrune = true;
        else if (/Reproductive toxicity/i.test(rText) && !repCn) shouldPrune = true;
        else if (/Specific target organ/i.test(rText) && !stotCn) shouldPrune = true;
        else if (/Additional information/i.test(rText) && !addInfoCn) shouldPrune = true;
        else if (/根据现有数据，二乙二醇/i.test(rText)) shouldPrune = true;
        else if (/Aspiration hazard/i.test(rText) && !aspCn) shouldPrune = true;
        else if (/^(?:AA|BB|CC)$/.test(lastCellText)) shouldPrune = true;

        if (shouldPrune) {
          s11 = deleteRow(engine, s11, i);
        }
      }

      // 若生殖毒性未拆分为子项，清理模板原生残留的 Fertility 内部子标签
      if (repCn && !findCnVal(/致畸/i)) {
        const repRow = s11.rows.find(r => /Reproductive toxicity/i.test(r.cells[0]?.text || ''));
        if (repRow && repRow.cells.length > 2) {
          while (repRow.cells.length > 2) {
            removeCellFromRow(repRow, 1);
          }
          normalizeRowGeometry(repRow);
        }
      }
    }

    // 4. 重新编号确保 11.1 ~ 11.N 严密对齐
    renumberRecord(s11, '11');
  }

  // Section 12 (自适应双模态说明行英译装配与实测数据英译)
  let s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12) {
    const cnS12 = baseCnEngine?.records?.find(r => r.sectionNumber === 12);
    const cnPreambles = [];
    if (cnS12) {
      for (let i = 1; i < cnS12.rows.length; i++) {
        const t = cnS12.rows[i].cells.map(c => c.text || '').join('').trim();
        if (/生态毒性|持久性|Ecotoxicity|Persistence|12\.\d/i.test(t)) break;
        if (t) cnPreambles.push(t);
      }
    }

    if (cnPreambles.length >= 2) {
      // 中文母版有 2 行说明行：Row 1 产品免责，Row 2 组分引言
      if (s12.rows[1]?.cells?.[0]) {
        safeWrite(s12.rows[1].cells[0], 'No ecotoxicological studies are available for this product.');
      }
      if (s12.rows[2]?.cells?.[0]) {
        safeWrite(s12.rows[2].cells[0], translateSection12PreambleToEnglish(cnPreambles[1]));
      }
    } else if (cnPreambles.length === 1) {
      if (s12.rows[1]?.cells?.[0]) {
        safeWrite(s12.rows[1].cells[0], 'No ecotoxicological studies are available for this product.');
      }
      if (s12.rows[2]?.cells?.length === 1) {
        s12 = deleteRow(engine, s12, 2);
      }
    } else if (cnPreambles.length === 0) {
      if (s12.rows[2]?.cells?.length === 1) s12 = deleteRow(engine, s12, 2);
      if (s12.rows[1]?.cells?.length === 1) s12 = deleteRow(engine, s12, 1);
    }

    // 动态提取中文生态毒性实测值并专业英译
    const cnEcoRow = cnS12?.rows?.find(r => /生态毒性/i.test(r.cells[0]?.text || ''));
    const cnEcoVal = cnEcoRow?.cells?.[cnEcoRow.cells.length - 1]?.text || '';
    const ecoEn = cnEcoVal ? translateEcotoxicityValueToEnglish(cnEcoVal) : enValues['sec12.ecotoxicity'];

    for (const row of s12.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Ecotoxicity/i.test(lbl)) safeWrite(c1, ecoEn);
      else if (/Persistence/i.test(lbl)) {
        const cnPersistRow = cnS12?.rows?.find(r => /持久|降解/i.test(r.cells[0]?.text || ''));
        const cnPersistVal = cnPersistRow?.cells?.[cnPersistRow.cells.length - 1]?.text || '';
        const persistEn = cnPersistVal ? translatePersistenceValueToEnglish(cnPersistVal) : enValues['sec12.persistence'];
        safeWrite(c1, persistEn);
      }
      else if (/Other adverse/i.test(lbl)) safeWrite(c1, enValues['sec12.other_effects']);
    }
  }

  // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 13 必须严格保持 4 行独立结构（两行单列独立说明行 + 处置方法行），严禁合并删行
  // Section 13 (标准 4 行：标题行 + 2 行独立说明行 + 处置方法行)
  let s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13) {
    if (s13.rows.length === 3) {
      s13 = addRowAfter(engine, s13, 1);
    }
    if (s13.rows.length >= 4) {
      safeWrite(s13.rows[1].cells[0], enValues['sec13.line1']);
      safeWrite(s13.rows[2].cells[0], enValues['sec13.line2']);
      if (s13.rows[3]?.cells[1]) {
        safeWrite(s13.rows[3].cells[1], enValues['sec13.methods']);
      }
    } else {
      if (s13.rows[1]?.cells[0]) safeWrite(s13.rows[1].cells[0], enValues['sec13.line1']);
      if (s13.rows[2]?.cells[1]) safeWrite(s13.rows[2].cells[1], enValues['sec13.methods']);
    }
  }
  // @ANTIGRAVITY_INVARIANT_LOCK_END

  // Section 14 (标准 5 行)
  const s14 = engine.records.find(r => r.sectionNumber === 14);
  if (s14) {
    for (const row of s14.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Road and rail/i.test(lbl)) safeWrite(c1, enValues['sec14.road_rail']);
      else if (/Maritime/i.test(lbl)) safeWrite(c1, enValues['sec14.sea']);
      else if (/Air transport/i.test(lbl)) safeWrite(c1, enValues['sec14.air']);
      else if (/Special precautions/i.test(lbl)) safeWrite(c1, enValues['sec14.special_precautions']);
    }
  }

  // Section 15 (法规标准 100% 官方标准纯英文化，绝对零中文)
  const s15 = engine.records.find(r => r.sectionNumber === 15);
  if (s15) {
    const stdRegulations = [
      'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591',
      'GB/T 16483 Safety data sheet for chemical products - Content and order of sections',
      'GB 13690 General rules for classification and hazard communication of chemicals',
      'GB 30000.2-29 Rules for classification and labelling of chemicals',
      'GB 15258 General rules for preparation of precautionary label for chemicals'
    ];
    let regIdx = 0;
    for (let i = 0; i < s15.rows.length; i++) {
      const row = s15.rows[i];
      const lbl = (row.cells[0]?.text || '').trim();
      if (/591|16483|13690|30000|15258|危险化学品|化学品安全|分类和危险性|标签规范|安全标签/i.test(lbl) || (i >= 4 && regIdx < stdRegulations.length)) {
        safeWrite(row.cells[0], stdRegulations[regIdx]);
        if (row.cells[1]) safeWrite(row.cells[1], 'Complies');
        regIdx++;
      }
    }
  }

  // 规范化英文 Section 11 实测各行行高
  if (s11) {
    for (const row of s11.rows) {
      normalizeSection11RowHeight(row);
    }
  }

  // Section 16
  const s16 = engine.records.find(r => r.sectionNumber === 16);
  if (s16) {
    if (s16.rows[1]?.cells[0]) {
      safeWrite(s16.rows[1].cells[0], enValues['sec16.other']);
    }
  }

  // 严格保留模板原装序号与格式，严禁全局重排序号

  // 方案 A 标准英文排版收敛：中英文统一 序号+标签、420 dxa悬挂缩进、零制表位、Arial 9.5pt
  standardizeEnglishTypographyAndLabels(engine);

  // 零中文严格门禁审计 (确保交付物 100% 零中文)
  assertZeroChinese(engine, `MSDS_EN_${modelCode}`);

  return engine;
}

export async function derivePresetEngines({
  modelCode,
  baseCnEngine,
  baseEnEngine,
  entityId = 'GUOCAI',
  revisionDate = null
}) {
  const activeDate = revisionDate || baseCnEngine?._adaptiveRevisionDate || '2026/10/20';
  const entity = ENTITY_MATRIX[entityId] || ENTITY_MATRIX.GUOCAI;

  // 1. 派生中文变体 (如国彩中文)
  const cnBuf = await baseCnEngine.exportArrayBuffer();
  const cnPresetEngine = await loadDocx(cnBuf, `${modelCode} msds_CN ${entity.cn.shortName}.docx`);
  updateHeaderFooterData(cnPresetEngine, {
    model: modelCode,
    company: entity.cn.name,
    title: '物料安全数据表',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: activeDate,
    language: 'CN',
    entity: entity.cn.shortName
  });

  const s1Cn = tableRecords(cnPresetEngine).find(r => r.sectionNumber === 1);
  if (s1Cn) {
    for (const row of s1Cn.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/供应商名称/i.test(lbl)) safeWriteCellValue(c1, entity.cn.name);
      else if (/供应商地址/i.test(lbl)) safeWriteCellValue(c1, entity.cn.address);
      else if (/电话/i.test(lbl)) safeWriteCellValue(c1, entity.cn.tel);
      else if (/传真/i.test(lbl)) safeWriteCellValue(c1, entity.cn.fax);
    }
  }

  // 2. 派生英文变体 (如国彩英文)
  const enBuf = await baseEnEngine.exportArrayBuffer();
  const enPresetEngine = await loadDocx(enBuf, `${modelCode} msds_EN ${entity.en.shortName}.docx`);
  updateHeaderFooterData(enPresetEngine, {
    model: modelCode,
    company: entity.en.name,
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: activeDate,
    language: 'EN',
    entity: entity.en.shortName
  });

  const s1En = tableRecords(enPresetEngine).find(r => r.sectionNumber === 1);
  if (s1En) {
    for (const row of s1En.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Name of supplier/i.test(lbl)) safeWriteCellValue(c1, entity.en.name);
      else if (/Supplier address/i.test(lbl)) safeWriteCellValue(c1, entity.en.address);
      else if (/Tel/i.test(lbl)) safeWriteCellValue(c1, entity.en.tel);
      else if (/Fax/i.test(lbl)) safeWriteCellValue(c1, entity.en.fax);
    }
  }

  // 英文预设派生：标准化统一排版收敛
  standardizeEnglishTypographyAndLabels(enPresetEngine);

  // 国彩英文派生零中文门禁审计
  assertZeroChinese(enPresetEngine, `${modelCode} msds_EN ${entity.en.shortName}`);

  return {
    cnPresetEngine,
    enPresetEngine
  };
}

/**
 * 源文件安全保留留存助手 (Source File Preservation Helper)
 * 铁律规范：在覆盖写入任何同名文件前，若目标路径已存在文件且尚未建立留存备份，
 * 自动将其安全克隆为 "${baseName}_源文件留存${ext}"。
 * 绝对不变量：留存文件一旦生成，后续执行严禁二次覆盖留存文件，永久锁死源文件最原始真实母本！
 */
export async function preserveOriginalFileBackup(filePath) {
  if (!filePath) return null;
  try {
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) return null;

    const ext = path.extname(filePath);
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, ext);

    // 若当前文件本身就是留存备份，不再嵌套备份
    if (baseName.endsWith('_源文件留存') || baseName.endsWith('_原版留存')) {
      return null;
    }

    const backupPath = path.join(dir, `${baseName}_源文件留存${ext}`);
    const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
    if (!backupExists) {
      await fs.copyFile(filePath, backupPath);
      console.log(`[SourcePreservation] 成功安全留存源文件: ${filePath} -> ${backupPath}`);
      return backupPath;
    }
  } catch (err) {
    console.warn(`[SourcePreservation] 备份留存异常: ${filePath}`, err.message);
  }
  return null;
}

/**
 * 阶段四：批量极速写入与并行 PDF 转换
 * 注入源文件不可逆灭失防御：覆写前务必自动保留源文件留存副本
 */

async function safeWriteFileWithLockGuard(targetPath, buffer) {
  try {
    await fs.writeFile(targetPath, buffer);
    return targetPath;
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`[文件锁防御] ${targetPath} 正被外部编辑器占用，尝试等待 1 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await fs.writeFile(targetPath, buffer);
        return targetPath;
      } catch (retryErr) {
        if (retryErr.code === 'EBUSY') {
          const ext = path.extname(targetPath);
          const base = path.basename(targetPath, ext);
          const dir = path.dirname(targetPath);
          const fallbackPath = path.join(dir, `${base} (更新)${ext}`);
          console.warn(`[文件锁保护] ${targetPath} 仍被独占锁定，已安全降级写入至备选路径: ${fallbackPath}`);
          await fs.writeFile(fallbackPath, buffer);
          return fallbackPath;
        }
        throw retryErr;
      }
    }
    throw err;
  }
}

export async function batchExportDeliverables({
  modelCode,
  targetDir,
  engines = {}, // { cnGuanzhi, cnGuocai, enGuanzhi, enGuocai }
  cnGroundTruthPath = null
}) {
  if (targetDir) {
    await fs.mkdir(targetDir, { recursive: true });
  }

  // 若传入了源文件路径，先对源文件及同名 PDF 实施主动留存保护
  if (cnGroundTruthPath) {
    await preserveOriginalFileBackup(cnGroundTruthPath);
    const ext = path.extname(cnGroundTruthPath);
    const dir = path.dirname(cnGroundTruthPath);
    const base = path.basename(cnGroundTruthPath, ext);
    await preserveOriginalFileBackup(path.join(dir, `${base}.pdf`));
  }

  const docxItems = [
    { name: `${modelCode} msds_CN 冠志.docx`, engine: engines.cnGuanzhi },
    { name: `${modelCode} msds_CN 国彩.docx`, engine: engines.cnGuocai },
    { name: `${modelCode} msds_EN Guanzhi.docx`, engine: engines.enGuanzhi },
    { name: `${modelCode} msds_EN Guocai.docx`, engine: engines.enGuocai },
  ];

  const results = [];
  const convertInputs = [];

  for (const item of docxItems) {
    const buf = await item.engine.exportArrayBuffer();
    const docxPath = targetDir ? path.join(targetDir, item.name) : null;
    if (docxPath) {
      // 覆写前务必自动保留源文件（若目标文件已存在且未建立留存）
      await preserveOriginalFileBackup(docxPath);
      await safeWriteFileWithLockGuard(docxPath, Buffer.from(buf));
    }
    results.push({
      name: item.name,
      format: 'docx',
      size: buf.byteLength,
      path: docxPath
    });

    convertInputs.push({
      docxBuffer: buf,
      fileName: item.name
    });
  }

  // 批量高速无头转译 4 份高保真 PDF
  const pdfOutputs = await convertBatchDocxToPdf(convertInputs);
  for (const p of pdfOutputs) {
    const finalPdfPath = targetDir ? path.join(targetDir, p.pdfName) : null;
    if (finalPdfPath && p.pdfBuffer) {
      // 覆写前务必自动保留源 PDF（若目标文件已存在且未建立留存）
      await preserveOriginalFileBackup(finalPdfPath);
      await safeWriteFileWithLockGuard(finalPdfPath, p.pdfBuffer);
    }
    results.push({
      name: p.pdfName,
      format: 'pdf',
      size: p.size,
      durationMs: p.durationMs,
      path: finalPdfPath
    });
  }

  return results;
}

/**
 * 门面接口：四阶流水线一步原子完成 (Zero Scripting Facade)
 */
export async function executeEightDeliverablesPipeline({
  modelCode,
  cnGroundTruthPath,
  cnGroundTruthBuffer,
  targetDir,
  facts = {},
  revisionDate = null
}) {
  const startTime = Date.now();
  const preservedFiles = [];

  // 0. 源文件绝对无损安全防御：流水线第一步，若指定了源文件物理路径，立即提前封存留存源文件及对应 PDF
  if (cnGroundTruthPath) {
    const docxBackup = await preserveOriginalFileBackup(cnGroundTruthPath);
    if (docxBackup) preservedFiles.push(docxBackup);

    const ext = path.extname(cnGroundTruthPath);
    const dir = path.dirname(cnGroundTruthPath);
    const base = path.basename(cnGroundTruthPath, ext);
    const pdfBackup = await preserveOriginalFileBackup(path.join(dir, `${base}.pdf`));
    if (pdfBackup) preservedFiles.push(pdfBackup);
  }

  // 1. 做基础 1 (中文基准)
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode,
    cnGroundTruthPath,
    cnGroundTruthBuffer,
    revisionDate,
    viscosityOverride: facts.viscosityOverride || facts.viscosity
  });

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine._adaptiveRevisionDate || baseCnEngine._adaptiveRevisionDate.startsWith('2023') || baseCnEngine._adaptiveRevisionDate.startsWith('2024') || baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveDate = revisionDate || (!isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr);

  // 2. 做基础 2 (英文基准：以中文基准为源事实，驱动英文模板识别与同构装配)
  const baseEnEngine = await buildBaseEnglishEngine({
    modelCode,
    baseCnEngine,
    facts,
    revisionDate: effectiveDate
  });

  // 3. 应用预设产出指定预设格式 (国彩双语派生)
  const { cnPresetEngine, enPresetEngine } = await derivePresetEngines({
    modelCode,
    baseCnEngine,
    baseEnEngine,
    entityId: 'GUOCAI',
    revisionDate: effectiveDate
  });

  // 3.5 真实性交叉质检门禁（防止再犯：拦截任何模板残留或中英文不一致）
  assertBilingualIntegrity(baseCnEngine, baseEnEngine);

  // 3.6 执行交付前全量硬性质量门禁 (Gate 1~5)
  // 动态探知源文件的 Section 12 说明行数量
  const s12RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 12);
  let expectedS12PreamblesCount = 0;
  if (s12RecordForAudit) {
    for (let i = 1; i < s12RecordForAudit.rows.length; i++) {
      const t = s12RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|12\.\d/i.test(t)) break;
      if (t) expectedS12PreamblesCount++;
    }
  }

  const s11RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 11);
  let expectedS11PreamblesCount = 0;
  if (s11RecordForAudit) {
    for (let i = 1; i < s11RecordForAudit.rows.length; i++) {
      const t = s11RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|11\.\d/i.test(t)) break;
      if (t) expectedS11PreamblesCount++;
    }
  }

  const sourceFactsForAudit = { expectedS11PreamblesCount, expectedS12PreamblesCount, expectedDate: effectiveDate };

  assertDeliverableQuality(baseCnEngine, 'Base Chinese (冠志)', false, sourceFactsForAudit);
  assertDeliverableQuality(cnPresetEngine, 'Preset Chinese (国彩)', false, sourceFactsForAudit);
  assertDeliverableQuality(baseEnEngine, 'Base English (Guanzhi)', true, sourceFactsForAudit);
  assertDeliverableQuality(enPresetEngine, 'Preset English (Guocai)', true, sourceFactsForAudit);


  // 4. 导出成 Word 与 PDF
  const deliverables = await batchExportDeliverables({
    modelCode,
    targetDir,
    cnGroundTruthPath,
    engines: {
      cnGuanzhi: baseCnEngine,
      cnGuocai: cnPresetEngine,
      enGuanzhi: baseEnEngine,
      enGuocai: enPresetEngine
    }
  });

  return {
    success: true,
    model: modelCode,
    targetDir,
    durationMs: Date.now() - startTime,
    preservedFiles,
    deliverables
  };
}


/**
 * 方案 A 标准英文工业级排版与“序号+标签”全量规范化引擎
 * 1. 彻底连根拔除底模残留的所有 <w:tabs> 制表位与 <w:tab/>，杜绝跨版本排版崩塌；
 * 2. 统一二级序号与标签规范：序号 + 两个半角空格 + 英文标签 + 半角冒号 (X.Y  Label:)；
 * 3. 统一下沉 <w:ind w:left="420" w:hanging="420"/> 悬挂缩进几何；
 * 4. 全量清洗全角标点（全角冒号、逗号、分号、中文括号）为标准半角西文标点；
 * 5. 全量收敛为 Arial 工业合规字体：章节标题 11pt Bold、标签 9.5pt Bold、内容值/说明行 9.5pt Regular。
 */
export function standardizeEnglishTypographyAndLabels(engine) {
  if (!engine?.documentXml) return;
  const xmlDoc = engine.documentXml;
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tables = Array.from(xmlDoc.getElementsByTagNameNS(W_NS, 'tbl'));

  for (const tbl of tables) {
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (rows.length === 0) continue;

    // 探测 Section 章节编号
    let sectionNumber = null;
    const r0Text = (rows[0]?.textContent || '').trim();
    const secMatch = r0Text.match(/^(\d+)\./);
    if (secMatch) sectionNumber = parseInt(secMatch[1], 10);

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length === 0) continue;

      // 1. 章节大标题行 (Row 0)
      if (rIdx === 0 && sectionNumber !== null) {
        formatRowAsSectionHeader(row, W_NS);
        continue;
      }

      const isSingleCellRow = cells.length === 1;

      // 2. Section 3 专属豁免：表头加粗无冒号，具体成分名称绝不加粗且末尾绝无冒号
      if (sectionNumber === 3) {
        if (rIdx === 3 && cells.length >= 3) {
          // 表头行: Chemical name, CAS NO., Concentration % (w/w) -> 均加粗，末尾无冒号
          for (let cIdx = 0; cIdx < cells.length; cIdx++) {
            const cell = cells[cIdx];
            cleanTabsInNode(cell, W_NS);
            const p = cell.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              let t = (p.textContent || '').replace(/[:：]/g, '').trim();
              removeHangingIndentFromP(p, W_NS);
              rebuildRunsWithTypography(p, t, { font: 'Arial', sizeVal: '19', bold: true }, W_NS);
            }
          }
          continue;
        } else if (rIdx > 3 && cells.length >= 3) {
          // 具体成分数据行: Col 0 为成分名称，普通数据网格，绝不加粗，绝不追加冒号
          for (let cIdx = 0; cIdx < cells.length; cIdx++) {
            const cell = cells[cIdx];
            cleanTabsInNode(cell, W_NS);
            const p = cell.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              let t = (p.textContent || '').replace(/[:：]$/g, '').trim();
              removeHangingIndentFromP(p, W_NS);
              rebuildRunsWithTypography(p, t, { font: 'Arial', sizeVal: '19', bold: false }, W_NS);
            }
          }
          continue;
        }
      }

      // 3. Section 11 专属：二级标签 (Oral:, Inhalation:, Dermal:, Fertility:) 加粗，续行标签空首列
      if (sectionNumber === 11 && rIdx >= 3) {
        const c0 = cells[0];
        if (c0) {
          cleanTabsInNode(c0, W_NS);
          const c0Text = (c0.textContent || '').trim();
          if (!c0Text || c0Text === ':' || c0Text === '：') {
            const p = c0.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              removeHangingIndentFromP(p, W_NS);
              rebuildRunsWithTypography(p, '', { font: 'Arial', sizeVal: '19', bold: false }, W_NS);
            }
          } else {
            formatEnglishLabelCell(c0, W_NS, sectionNumber);
          }
        }
        if (cells.length >= 2) {
          const c1 = cells[1];
          cleanTabsInNode(c1, W_NS);
          const c1Text = (c1.textContent || '').trim();
          if (/^(?:Oral|Inhalation|Dermal|Fertility|Eye|Skin|Respiratory):?/i.test(c1Text)) {
            let cleanSub = c1Text.replace(/：/g, ':').trim();
            if (!cleanSub.endsWith(':')) cleanSub += ':';
            const p = c1.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              removeHangingIndentFromP(p, W_NS);
              setParagraphAlign(p, 'left', W_NS);
              rebuildRunsWithTypography(p, cleanSub, { font: 'Arial', sizeVal: '19', bold: true }, W_NS);
            }
          } else if (cells.length === 2) {
            formatValueCell(c1, W_NS);
          }
        }
        if (cells.length >= 3) {
          formatValueCell(cells[2], W_NS);
        }
        continue;
      }

      // 4. Section 13 专属：
      // Row 1 & Row 2: 两行独立通栏说明行（强制左对齐、9.5pt 常规体、无缩进）
      // Row 3: Disposal methods 垂直居中、水平居中加粗；右侧值格全左对齐
      if (sectionNumber === 13) {
        if ((rIdx === 1 || rIdx === 2) && isSingleCellRow) {
          const c0 = cells[0];
          formatValueCell(c0, W_NS);
          continue;
        }
        if ((rIdx === 2 || rIdx === 3) && cells.length >= 2) {
          const c0 = cells[0];
          setCellVAlign(c0, 'center', W_NS);
          const p0 = c0.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p0) {
            setParagraphAlign(p0, 'center', W_NS);
            removeHangingIndentFromP(p0, W_NS);
            cleanTabsInNode(c0, W_NS);
            rebuildRunsWithTypography(p0, 'Disposal methods:', { font: 'Arial', sizeVal: '19', bold: true }, W_NS);
          }
          const c1 = cells[1];
          setCellVAlign(c1, 'center', W_NS);
          formatValueCell(c1, W_NS);
          continue;
        }
      }

      // 5. 通用行/单元格遍历
      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const isLabelCell = (cIdx === 0 && !isSingleCellRow);

        cleanTabsInNode(cell, W_NS);

        if (isLabelCell) {
          formatEnglishLabelCell(cell, W_NS, sectionNumber);
        } else if (isSingleCellRow) {
          formatSingleCellRow(cell, W_NS);
        } else {
          if (sectionNumber === 2 && rIdx === 6) {
            // Section 2.5 防范说明：移除多余总标题，加粗子标题，分类段落物理空行隔开
            formatPrecautionaryValueCell(cell, W_NS);
          } else {
            formatValueCell(cell, W_NS);
          }
        }
      }
    }
  }

  // 刷新缓存
  if (typeof engine.refresh === 'function') {
    engine.refresh();
  }
}

function cleanTabsInNode(node, W_NS) {
  const tabs = Array.from(node.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => t.parentNode?.removeChild(t));
  const tabRuns = Array.from(node.getElementsByTagNameNS(W_NS, 'tab'));
  tabRuns.forEach(t => t.parentNode?.removeChild(t));
}

function applyHangingIndentToP(p, left = '420', hanging = '420', W_NS) {
  let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (!pPr) {
    pPr = p.ownerDocument.createElementNS(W_NS, 'w:pPr');
    p.insertBefore(pPr, p.firstChild);
  }
  const inds = Array.from(pPr.getElementsByTagNameNS(W_NS, 'ind'));
  inds.forEach(i => pPr.removeChild(i));

  const ind = p.ownerDocument.createElementNS(W_NS, 'w:ind');
  ind.setAttributeNS(W_NS, 'w:left', left);
  ind.setAttributeNS(W_NS, 'w:hanging', hanging);
  pPr.appendChild(ind);

  // 严禁在 pPr 中注入非法 <w:tabs>，彻底遵守底模质量门禁
  const tabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => pPr.removeChild(t));
}

function applyLeftIndentToP(p, left = '420', W_NS) {
  let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (!pPr) {
    pPr = p.ownerDocument.createElementNS(W_NS, 'w:pPr');
    p.insertBefore(pPr, p.firstChild);
  }
  const inds = Array.from(pPr.getElementsByTagNameNS(W_NS, 'ind'));
  inds.forEach(i => pPr.removeChild(i));

  const ind = p.ownerDocument.createElementNS(W_NS, 'w:ind');
  ind.setAttributeNS(W_NS, 'w:left', left);
  pPr.appendChild(ind);

  const tabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => pPr.removeChild(t));
}

function removeHangingIndentFromP(p, W_NS) {
  const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (!pPr) return;
  const inds = Array.from(pPr.getElementsByTagNameNS(W_NS, 'ind'));
  inds.forEach(i => pPr.removeChild(i));
  const tabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => pPr.removeChild(t));
}

function setCellVAlign(cell, val, W_NS) {
  let tcPr = cell.getElementsByTagNameNS(W_NS, 'tcPr')[0];
  if (!tcPr) {
    tcPr = cell.ownerDocument.createElementNS(W_NS, 'w:tcPr');
    cell.insertBefore(tcPr, cell.firstChild);
  }
  const vAligns = Array.from(tcPr.getElementsByTagNameNS(W_NS, 'vAlign'));
  vAligns.forEach(v => tcPr.removeChild(v));
  const v = cell.ownerDocument.createElementNS(W_NS, 'w:vAlign');
  v.setAttributeNS(W_NS, 'w:val', val);
  tcPr.appendChild(v);
}

function setParagraphAlign(p, jcVal, W_NS) {
  let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (!pPr) {
    pPr = p.ownerDocument.createElementNS(W_NS, 'w:pPr');
    p.insertBefore(pPr, p.firstChild);
  }
  const jcs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'jc'));
  jcs.forEach(j => pPr.removeChild(j));
  const jc = p.ownerDocument.createElementNS(W_NS, 'w:jc');
  jc.setAttributeNS(W_NS, 'w:val', jcVal);
  pPr.appendChild(jc);
}

// @ANTIGRAVITY_INVARIANT_LOCK_START: 第一列双基准悬挂缩进 (常规 420 dxa / Sec 11 565 dxa 防弹飞) 与无序号标签右缩进对齐
function formatEnglishLabelCell(cell, W_NS, sectionNumber) {
  const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  // 方案 2：Section 11 包含 11.10（5字符宽约452 dxa），悬挂缩进统一采用 565 dxa，防止制表符弹飞；其余章节采用 420 dxa
  const indent = (sectionNumber === 11 ? '565' : '420');

  const fullText = ps.map(p => p.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
  const seqMatch = fullText.match(/^(\d+\.\d+)\s*(.*)$/);

  let cleanLabel = fullText;
  let hasSeq = false;
  let seqStr = '';

  if (seqMatch) {
    hasSeq = true;
    seqStr = seqMatch[1];
    cleanLabel = seqMatch[2].trim();
  }

  // 清洗全角符号为标准半角西文符号
  cleanLabel = cleanLabel
    .replace(/：/g, ':')
    .replace(/，/g, ', ')
    .replace(/；/g, '; ')
    .replace(/（/g, ' (')
    .replace(/）/g, ') ')
    .replace(/\s+/g, ' ')
    .trim();

  // 清洗多段合并导致的残留重复词
  cleanLabel = cleanLabel
    .replace(/pressure:\s*pressure:?/gi, 'pressure:')
    .replace(/temperature:\s*temperature:?/gi, 'temperature:')
    .replace(/coefficient\)?:\s*partition coefficient\)?/gi, 'coefficient):')
    .replace(/partition coefficient\)?:\s*partition coefficient\)?/gi, 'partition coefficient):')
    .replace(/:\s*:/g, ':')
    .trim();

  // 确保标签末尾带有半角冒号
  if (!cleanLabel.endsWith(':') && !/Other hazards/i.test(cleanLabel)) {
    cleanLabel += ':';
  }

  // 保留首段并物理移除其余多余的人工断行段落
  const firstP = ps[0];
  for (let i = 1; i < ps.length; i++) {
    ps[i].parentNode?.removeChild(ps[i]);
  }

  if (hasSeq) {
    applyHangingIndentToP(firstP, indent, indent, W_NS);
    rebuildTabbedLabelWithTypography(firstP, seqStr, cleanLabel, {
      font: 'Arial',
      sizeVal: '19', // 9.5pt
      bold: true
    }, W_NS);
  } else {
    // 若为 Recommendation: 参照中文版，取消缩进，直接顶格左对齐加粗！
    if (/^Recommendation:?/i.test(cleanLabel)) {
      removeHangingIndentFromP(firstP, W_NS);
      setParagraphAlign(firstP, 'left', W_NS);
      rebuildRunsWithTypography(firstP, 'Recommendation:', {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: true
      }, W_NS);
    } else {
      // 第一列无序号标签（如 Chemical category:、GHS Pictograms: 等）：
      // 强制应用 indent (420/565 dxa) 左缩进，使其文字首字母与有序号标签的文字首字母严格垂直对齐！
      applyLeftIndentToP(firstP, indent, W_NS);
      rebuildRunsWithTypography(firstP, cleanLabel, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: true
      }, W_NS);
    }
  }
}

function rebuildTabbedLabelWithTypography(p, seqStr, labelText, { font, sizeVal, bold }, W_NS) {
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));

  const doc = p.ownerDocument;

  // Run 1: seqStr + tab
  const r1 = doc.createElementNS(W_NS, 'w:r');
  const rPr1 = doc.createElementNS(W_NS, 'w:rPr');
  applyRunProps(rPr1, { font, sizeVal, bold }, W_NS);
  r1.appendChild(rPr1);

  const t1 = doc.createElementNS(W_NS, 'w:t');
  t1.setAttribute('xml:space', 'preserve');
  t1.textContent = seqStr;
  r1.appendChild(t1);

  const tab = doc.createElementNS(W_NS, 'w:tab');
  r1.appendChild(tab);
  p.appendChild(r1);

  // Run 2: labelText
  const r2 = doc.createElementNS(W_NS, 'w:r');
  const rPr2 = doc.createElementNS(W_NS, 'w:rPr');
  applyRunProps(rPr2, { font, sizeVal, bold }, W_NS);
  r2.appendChild(rPr2);

  const t2 = doc.createElementNS(W_NS, 'w:t');
  t2.setAttribute('xml:space', 'preserve');
  t2.textContent = labelText;
  r2.appendChild(t2);
  p.appendChild(r2);
}

function formatSingleCellRow(cell, W_NS) {
  const p = cell.getElementsByTagNameNS(W_NS, 'p')[0];
  if (!p) return;

  let text = (p.textContent || '').trim();
  if (!text) return;

  const seqMatch = text.match(/^(\d+\.\d+)\s*(.*)$/);
  if (seqMatch) {
    const seqStr = seqMatch[1];
    let cleanLabel = seqMatch[2].replace(/：/g, ':').trim();
    if (!cleanLabel.endsWith(':')) cleanLabel += ':';
    applyHangingIndentToP(p, '420', '420', W_NS);
    rebuildTabbedLabelWithTypography(p, seqStr, cleanLabel, {
      font: 'Arial',
      sizeVal: '19', // 9.5pt
      bold: true
    }, W_NS);
  } else if (/^(?:Other provisions|Complies with the following regulations):?/i.test(text)) {
    // Section 15 单列子标题加粗，左对齐
    let cleanLabel = text.replace(/：/g, ':').trim();
    if (!cleanLabel.endsWith(':')) cleanLabel += ':';
    removeHangingIndentFromP(p, W_NS);
    setParagraphAlign(p, 'left', W_NS);
    rebuildRunsWithTypography(p, cleanLabel, {
      font: 'Arial',
      sizeVal: '19', // 9.5pt
      bold: true
    }, W_NS);
  } else {
    // 说明行或法规条目：清洗全角符号，压缩多余空格，强制左对齐收敛为 Arial 9.5pt Regular
    text = text.replace(/：/g, ': ').replace(/[ \t]{2,}/g, ' ');
    removeHangingIndentFromP(p, W_NS);
    setParagraphAlign(p, 'left', W_NS);
    rebuildRunsWithTypography(p, text, {
      font: 'Arial',
      sizeVal: '19', // 9.5pt
      bold: false
    }, W_NS);
  }
}

function getCellTextWithLineBreaks(cell, W_NS) {
  let text = '';
  function walk(n) {
    if (n.nodeType === 3) {
      text += n.nodeValue;
    } else if (n.nodeType === 1) {
      const local = n.localName || n.nodeName.split(':').pop();
      if (local === 'br' || local === 'cr') {
        text += '\n';
      } else if (local === 'p') {
        if (text && !text.endsWith('\n')) text += '\n';
        for (let child = n.firstChild; child; child = child.nextSibling) walk(child);
        if (text && !text.endsWith('\n')) text += '\n';
      } else {
        for (let child = n.firstChild; child; child = child.nextSibling) walk(child);
      }
    }
  }
  walk(cell);
  return text;
}

function formatPrecautionaryValueCell(cell, W_NS) {
  // 从 cell 中穿透提取包含 <w:br/> 换行符的完整文本行
  const rawText = getCellTextWithLineBreaks(cell, W_NS);
  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 连根剔除重复的值单元格总标题 Precautionary statement(s):
  const filtered = rawLines.filter(l => !/^Precautionary statement\(s\):?/i.test(l));

  // 物理清除原旧段落
  const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
  ps.forEach(p => p.parentNode?.removeChild(p));

  const doc = cell.ownerDocument;

  for (const line of filtered) {
    const isHeading = /^(?:Prevention|Response|Storage|Disposal):?/i.test(line);

    if (isHeading) {
      let cleanHead = line.replace(/：/g, ':').trim();
      if (!cleanHead.endsWith(':')) cleanHead += ':';
      const p = doc.createElementNS(W_NS, 'w:p');
      removeHangingIndentFromP(p, W_NS);
      setParagraphAlign(p, 'left', W_NS);
      rebuildRunsWithTypography(p, cleanHead, { font: 'Arial', sizeVal: '19', bold: true }, W_NS);
      cell.appendChild(p);
    } else {
      let cleanLine = line.replace(/：/g, ': ').replace(/[ \t]{2,}/g, ' ').trim();
      const p = doc.createElementNS(W_NS, 'w:p');
      removeHangingIndentFromP(p, W_NS);
      setParagraphAlign(p, 'left', W_NS);
      rebuildRunsWithTypography(p, cleanLine, { font: 'Arial', sizeVal: '19', bold: false }, W_NS);
      cell.appendChild(p);
    }
  }
}

// @ANTIGRAVITY_INVARIANT_LOCK_START: 值格 100% 纯左对齐与自然词距公理，根治 Word 两端对齐造成的字词拉大间距
function formatValueCell(cell, W_NS) {
  cleanTabsInNode(cell, W_NS);
  const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
  for (const p of ps) {
    removeHangingIndentFromP(p, W_NS);
    // 核心：强制左对齐，彻底清除两端对齐/分散对齐/居中引起的词距拉伸与空白拉大
    setParagraphAlign(p, 'left', W_NS);
    const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
    for (let rIdx = 0; rIdx < runs.length; rIdx++) {
      const r = runs[rIdx];
      const t = r.getElementsByTagNameNS(W_NS, 't')[0];
      if (t && t.textContent) {
        let text = t.textContent.replace(/：/g, ': ');
        text = text.replace(/[ \t]{2,}/g, ' '); // 压缩多余连续空格，避免视觉大间距
        if (rIdx === 0) {
          text = text.replace(/^\s+/, ''); // 清除行首前导空格
        }
        t.textContent = text;
      }
      applyRunStyle(r, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: false
      }, W_NS);
    }
  }
}

function formatRowAsSectionHeader(row, W_NS) {
  const ps = Array.from(row.getElementsByTagNameNS(W_NS, 'p'));
  for (const p of ps) {
    removeHangingIndentFromP(p, W_NS);
    const text = (p.textContent || '').trim();
    rebuildRunsWithTypography(p, text, {
      font: 'Arial',
      sizeVal: '22', // 11pt
      bold: true
    }, W_NS);
  }
}

function rebuildRunsWithTypography(p, text, { font, sizeVal, bold }, W_NS) {
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));

  if (!text) return;

  const doc = p.ownerDocument;
  const r = doc.createElementNS(W_NS, 'w:r');
  const rPr = doc.createElementNS(W_NS, 'w:rPr');
  applyRunProps(rPr, { font, sizeVal, bold }, W_NS);
  r.appendChild(rPr);

  const t = doc.createElementNS(W_NS, 'w:t');
  t.setAttribute('xml:space', 'preserve');
  t.textContent = text;
  r.appendChild(t);

  p.appendChild(r);
}

function applyRunProps(rPr, { font, sizeVal, bold }, W_NS) {
  const doc = rPr.ownerDocument;
  const oldFonts = Array.from(rPr.getElementsByTagNameNS(W_NS, 'rFonts'));
  oldFonts.forEach(f => rPr.removeChild(f));

  const rFonts = doc.createElementNS(W_NS, 'w:rFonts');
  rFonts.setAttribute('w:ascii', font);
  rFonts.setAttribute('w:hAnsi', font);
  rFonts.setAttribute('w:eastAsia', font);
  rFonts.setAttribute('w:cs', font);
  rPr.appendChild(rFonts);

  const oldBs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
  oldBs.forEach(b => rPr.removeChild(b));
  if (bold) {
    rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
  }

  const oldSzs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'sz'));
  oldSzs.forEach(s => rPr.removeChild(s));
  const sz = doc.createElementNS(W_NS, 'w:sz');
  sz.setAttribute('w:val', sizeVal);
  rPr.appendChild(sz);

  const oldSzCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'szCs'));
  oldSzCss.forEach(s => rPr.removeChild(s));
  const szCs = doc.createElementNS(W_NS, 'w:szCs');
  szCs.setAttribute('w:val', sizeVal);
  rPr.appendChild(szCs);
}

function applyRunStyle(r, { font, sizeVal, bold }, W_NS) {
  const doc = r.ownerDocument;
  let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
  if (!rPr) {
    rPr = doc.createElementNS(W_NS, 'w:rPr');
    r.insertBefore(rPr, r.firstChild);
  }
  applyRunProps(rPr, { font, sizeVal, bold }, W_NS);
}

export function sanitizeEnglishTypography(engine) {
  standardizeEnglishTypographyAndLabels(engine);
}

export function assertZeroChinese(engine, docName = '') {
  const xmlDoc = engine.documentXml;
  const tNodes = xmlDoc.getElementsByTagName('w:t');
  const hits = [];
  for (let i = 0; i < tNodes.length; i++) {
    const txt = (tNodes[i].textContent || '').trim();
    if (/[\u4e00-\u9fa5]/.test(txt)) {
      hits.push(txt);
    }
  }
  if (hits.length > 0) {
    throw new Error(`[CRITICAL AUDIT ERROR] English deliverable ${docName} contains ${hits.length} Chinese text segments: ${hits.slice(0, 5).join(' | ')}`);
  }
}


/**
 * 规范化英文值单元格的西文字体为 Arial，彻底消除底模残留的宋体污染
 */
export function normalizeCellEnglishFonts(cell) {
  if (!cell?.node) return;
  const runs = cell.node.getElementsByTagName('w:r');
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    let rPr = run.getElementsByTagName('w:rPr')[0];
    if (!rPr) {
      rPr = cell.node.ownerDocument.createElement('w:rPr');
      run.insertBefore(rPr, run.firstChild);
    }
    let rFonts = rPr.getElementsByTagName('w:rFonts')[0];
    if (!rFonts) {
      rFonts = cell.node.ownerDocument.createElement('w:rFonts');
      rPr.appendChild(rFonts);
    }
    rFonts.setAttribute('w:ascii', 'Arial');
    rFonts.setAttribute('w:hAnsi', 'Arial');
    rFonts.setAttribute('w:cs', 'Arial');
  }
}


/**
 * 法定全项硬性门禁 (Quality Assertion Gates)
 * 在发布前拦截任何 S9 格式、S11 拓扑、S12 说明行数量、页脚时间或中文残余缺陷
 */
export function assertDeliverableQuality(engine, docName, isEnglish, sourceFacts = {}) {
  // Gate 1: Section 9 格式严格符合模板 (420 dxa 悬挂，零 tabs)
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    for (let rIdx = 1; rIdx < s9.rows.length; rIdx++) {
      const c0 = s9.rows[rIdx]?.cells[0];
      if (!c0?.node) continue;
      const p = c0.node.getElementsByTagNameNS(W_NS, 'p')[0];
      const pPr = p?.getElementsByTagNameNS(W_NS, 'pPr')[0];
      const ind = pPr?.getElementsByTagNameNS(W_NS, 'ind')[0];
      const tabs = pPr?.getElementsByTagNameNS(W_NS, 'tabs')[0];
      if (tabs) {
        throw new Error(`【质量门禁拦截】${docName} Section 9 Row ${rIdx} 含有非法注入的 <w:tabs> 制表位！`);
      }
      if (ind) {
        const l = ind.getAttributeNS(W_NS, 'left');
        const h = ind.getAttributeNS(W_NS, 'hanging');
        if (l !== '420' || h !== '420') {
          throw new Error(`【质量门禁拦截】${docName} Section 9 Row ${rIdx} 悬挂缩进异常: left=${l}, hanging=${h} (必须为 420)!`);
        }
      }
    }
  }

  // Gate 2: Section 11 表格拓扑与 11.7 (6262 宽度与 gridSpan="3")
  const s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    const repRow = s11.rows.find(r => /生殖毒性|Reproductive/i.test(r.cells[0]?.text || ''));
    if (repRow && repRow.cells.length === 2) {
      const valCell = repRow.cells[1];
      const tcPr = valCell.node?.getElementsByTagNameNS(W_NS, 'tcPr')[0];
      const tcW = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')[0]?.getAttributeNS(W_NS, 'w');
      const span = tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')[0]?.getAttributeNS(W_NS, 'val');
      const vMerge = repRow.cells[0]?.node?.getElementsByTagNameNS(W_NS, 'vMerge')[0];
      if (vMerge) {
        throw new Error(`【质量门禁拦截】${docName} 11.7 含有悬空未清除的 <w:vMerge>！`);
      }
      if (tcW !== '6262' || span !== '3') {
        throw new Error(`【质量门禁拦截】${docName} 11.7 宽度与跨列异常: tcW=${tcW}, span=${span} (必须为 6262 / 3)!`);
      }
    }
  }

  // Gate 3: Section 11 与 Section 12 说明行数量严格一致
  const s11PreAudit = engine.records.find(r => r.sectionNumber === 11);
  if (s11PreAudit && sourceFacts.expectedS11PreamblesCount) {
    let actualS11Preambles = 0;
    for (let i = 1; i < s11PreAudit.rows.length; i++) {
      const t = s11PreAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|Acute toxicity|Primary skin irritation|11\.\d/i.test(t)) break;
      if (t) actualS11Preambles++;
    }
    if (actualS11Preambles !== sourceFacts.expectedS11PreamblesCount) {
      throw new Error(`【质量门禁拦截】${docName} Section 11 说明行数量不匹配: 期望 ${sourceFacts.expectedS11PreamblesCount} 行，实际产出 ${actualS11Preambles} 行！`);
    }
  }

  const s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12 && sourceFacts.expectedS12PreamblesCount) {
    let actualPreambles = 0;
    for (let i = 1; i < s12.rows.length; i++) {
      const t = s12.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|Ecotoxicity|Persistence|12\.\d/i.test(t)) break;
      if (t) actualPreambles++;
    }
    if (actualPreambles !== sourceFacts.expectedS12PreamblesCount) {
      throw new Error(`【质量门禁拦截】${docName} Section 12 说明行数量不匹配: 期望 ${sourceFacts.expectedS12PreamblesCount} 行，实际产出 ${actualPreambles} 行！`);
    }
  }

  // Gate 4: 英文版零中文门禁
  if (isEnglish) {
    assertZeroChinese(engine, docName);
  }

  // Gate 5: Section 2 危险性分类与引导行纯净度门禁
  const s2 = engine.records.find(r => r.sectionNumber === 2);
  if (s2) {
    const row22 = s2.rows.find(r => /2\.2|GHS标签要素|GHS label elements/i.test(r.cells[0]?.text || ''));
    if (row22 && row22.cells.length >= 2) {
      const valText = (row22.cells[1].text || '').trim();
      if (valText && valText !== '') {
        throw new Error(`【质量门禁拦截 (Gate 5)】${docName} Section 2 引导行 2.2 右侧值格含有非法注入字符: "${valText}"！必须保持为空占位。`);
      }
    }
  }

  // Gate 6: 全篇值格 100% 纯左对齐与自然词距断言
  const xmlDoc = engine.documentXml;
  const allTbls = Array.from(xmlDoc.getElementsByTagNameNS(W_NS, 'tbl'));
  for (let t = 0; t < allTbls.length; t++) {
    const tbl = allTbls[t];
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (let r = 0; r < rows.length; r++) {
      const cells = Array.from(rows[r].getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length < 2) continue;
      for (let c = 1; c < cells.length; c++) {
        const cell = cells[c];
        const cellText = (cell.textContent || '').trim();
        if (cellText === 'CAS编号' || cellText === 'CAS NO.' || /^\d{2,7}-\d{2}-\d$/.test(cellText)) continue;
        const pList = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of pList) {
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          const jc = pPr?.getElementsByTagNameNS(W_NS, 'jc')[0]?.getAttributeNS(W_NS, 'val');
          if (jc === 'both' || jc === 'distribute') {
            throw new Error(`【质量门禁拦截 (Gate 6)】${docName} 表格 ${t + 1} 行 ${r + 1} 列 ${c + 1} 值格出现非法 "${jc}" 对齐！严禁两端对齐/分散对齐造成词间拉大。`);
          }
          const ind = pPr?.getElementsByTagNameNS(W_NS, 'ind')[0];
          const firstLine = ind?.getAttributeNS(W_NS, 'firstLine');
          if (firstLine && firstLine !== '0') {
            throw new Error(`【质量门禁拦截 (Gate 6)】${docName} 表格 ${t + 1} 行 ${r + 1} 列 ${c + 1} 值格出现非法首行缩进: firstLine=${firstLine}！值格文字严禁公文式首行缩进。`);
          }
        }
      }
    }
  }

  // Gate 7: Section 13 四行独立结构门禁
  const s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13 && s13.rows.length !== 4) {
    throw new Error(`【质量门禁拦截 (Gate 7)】${docName} Section 13 行数异常: 当前 ${s13.rows.length} 行 (必须严格保持 4 行独立结构)!`);
  }

  // Gate 8: 值格数值常规体与字体纯净度断言 (G-11 字体分离法定不变量)
  for (let t = 0; t < allTbls.length; t++) {
    const tbl = allTbls[t];
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (let r = 0; r < rows.length; r++) {
      const cells = Array.from(rows[r].getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length < 2) continue;
      for (let c = 1; c < cells.length; c++) {
        const cell = cells[c];
        const cellText = (cell.textContent || '').trim();
        if (cellText === 'CAS编号' || cellText === '含量%（w/w）' || cellText === 'CAS NO.' || cellText === 'Concentration % (w/w)') continue;
        const runs = Array.from(cell.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          const runText = (run.textContent || '').trim();
          if (!runText) continue;
          const bEl = run.getElementsByTagNameNS(W_NS, 'b')[0];
          const isBold = bEl && bEl.getAttributeNS(W_NS, 'val') !== '0';
          if (isBold) {
            const isSubLabel = /^(预防措施|事故响应|安全储存|废弃处置|经口|吸入|经皮|物种|分类|结果|Oral|Inhalation|Dermal|Species|Classification|Result)[：:]?$/i.test(runText);
            if (!isSubLabel) {
              throw new Error(`【质量门禁拦截 (Gate 8)】${docName} 表格 ${t + 1} 行 ${r + 1} 列 ${c + 1} 发现非法加粗数值: "${runText}"！违反 G-11 字体分离法定不变量。`);
            }
          }
          if (!isEnglish) {
            const rFonts = run.getElementsByTagNameNS(W_NS, 'rFonts')[0];
            if (rFonts) {
              const ascii = rFonts.getAttributeNS(W_NS, 'ascii');
              const eastAsia = rFonts.getAttributeNS(W_NS, 'eastAsia');
              if (ascii === 'Calibri' || eastAsia === 'Calibri') {
                throw new Error(`【质量门禁拦截 (Gate 8)】${docName} 表格 ${t + 1} 行 ${r + 1} 列 ${c + 1} 发现非法 Calibri 字体污染: "${runText}"！中文版必须保持受控宋体。`);
              }
            }
          }
        }
      }
    }
  }
}
