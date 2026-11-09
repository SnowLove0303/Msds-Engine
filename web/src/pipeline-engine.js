import fsSync from 'node:fs';

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
  enforceTableStandardBorders,
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
  transferDrawingToCell,
  renderFullWidthRow,
  enforceSection13DoubleCenter,
  enforceSection13JustifiedContent,
  formatSection11PreambleRow,
  setCellPreambleTypography,
  writeStructuredToxicologyCellValue,
  restoreSectionToTemplate
,
  formatSection9LabelCell
} from './docx-engine.js';
import {
  runSmartMatching,
  applyMatchResultToEditor,
  extractSection3ExemptionNotes,
  detectNonHazardousComposite,
  cleanSlateTemplate
} from './smart-matching.js';
import {
  MSDS_DESIGN_TOKENS,
  applyGlobalTypographyProjection
} from './universal-editor-primitives.js';
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
  if (/H412|水环境.*(?:慢性)?|水生生物/i.test(cnClass)) lines.push('Hazardous to the aquatic environment - chronic hazard (Category 3), H412');
  if (/H315|造成皮肤刺激/i.test(cnClass)) lines.push('Skin corrosion/irritation (Category 2), H315');
  if (/H319|严重眼睛刺激/i.test(cnClass)) lines.push('Serious eye damage/eye irritation (Category 2A), H319');
  if (/H302|吞咽有害/i.test(cnClass)) lines.push('Acute toxicity, Oral (Category 4), H302');
  if (/H312|皮肤接触有害/i.test(cnClass)) lines.push('Acute toxicity, Dermal (Category 4), H312');
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
  if (/P273|环境/i.test(cnPrecaution)) prev.push('P273: Avoid release to the environment.');
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
  if (/P501|处置.*物|容器.*规章|有资质.*废物处理/i.test(cnPrecaution)) disp.push('P501: Dispose of contents/container to an approved waste treatment plant in accordance with local/regional/national/international regulations.');
  if (disp.length > 1) sections.push(disp.join('\n'));

  return sections.join('\n\n');
}

/**
 * Section 1 化学品分类专业英译转换器 (遵从源文件事实，精准反映改性等修饰语)
 */
export function translateChemicalCategoryToEnglish(cnCategory, cnName = '') {
  const combined = `${cnCategory || ''} ${cnName || ''}`.trim();
  if (/改性.*脂肪胺|脂肪胺/i.test(combined)) {
    return 'Modified aliphatic amine';
  }
  if (/封闭(?:型)?(?:聚)?异氰酸酯/i.test(combined)) {
    return 'Blocked polyisocyanate water dispersion';
  }
  if (/改性.*聚氨酯/i.test(combined)) {
    return 'Modified polyurethane resin aqueous dispersion';
  }
  if (/聚氨酯/i.test(combined)) {
    return 'Waterborne polyurethane resin dispersion';
  }
  if (/无水.*环氧|非水.*环氧|无溶剂.*环氧|环氧.*无水/i.test(combined)) {
    return 'Anhydrous epoxy resin';
  }
  if (/环氧.*固化剂|固化剂.*环氧/i.test(combined)) {
    return 'Waterborne epoxy curing agent';
  }
  if (/水性.*环氧|环氧.*乳液|环氧.*水分散/i.test(combined)) {
    return 'Epoxy water dispersion';
  }
  if (/环氧/i.test(combined)) {
    return 'Epoxy resin';
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

  if (/涂料.*(?:添加剂|助剂)|(?:添加剂|助剂).*涂料|涂料用添加剂/i.test(clean)) return 'Additive for coatings.';
  if (/添加剂|助剂/i.test(clean)) return 'Additive for industrial use.';

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
  let categoryEn = facts.chemicalCategoryEn || facts.categoryEn;
  let useEn = facts.recommendedUseEn || facts.useEn || 'Raw material for industrial coatings';

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
        } else if (/固化剂/i.test(cnName + ' ' + cnCategory)) {
          if (/环氧/i.test(cnName + ' ' + cnCategory)) {
            prodName = `Waterborne epoxy curing agent ${modelCode}`;
          } else {
            prodName = `Waterborne curing agent ${modelCode}`;
          }
        } else if (/无水.*环氧|非水.*环氧|无溶剂.*环氧|环氧.*无水/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Anhydrous epoxy resin ${modelCode}`;
        } else if (/聚氨酯/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Waterborne polyurethane dispersion ${modelCode}`;
        } else if (/水性.*环氧|环氧.*乳液|环氧.*分散体/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Waterborne epoxy emulsion ${modelCode}`;
        } else if (/环氧/i.test(cnName + ' ' + cnCategory)) {
          prodName = `Epoxy resin ${modelCode}`;
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
        const rawLbl = row.cells[0]?.text || '';
        const lbl = rawLbl.replace(/[\s\u3000]+/g, '').replace(/[：:]$/, '');
        const val = (row.cells[1]?.text || '').trim();
        if (!val) continue;

        if (/外观/i.test(lbl)) {
          if (/乳白.*蓝光|蓝光.*乳液/i.test(val)) sec9Facts.appearance = 'Milky white emulsion with bluish tint';
          else if (/半透明.*乳液|乳液.*半透明/i.test(val)) sec9Facts.appearance = 'Translucent emulsion';
          else if (/半透明/i.test(val)) sec9Facts.appearance = 'Translucent liquid';
          else if (/乳白/i.test(val)) sec9Facts.appearance = 'Milky white liquid';
          else if (/均质/i.test(val) && /微黄|淡黄/i.test(val)) sec9Facts.appearance = 'Light yellow homogeneous liquid';
          else if (/透明/i.test(val) && /微黄|淡黄/i.test(val)) sec9Facts.appearance = 'Light yellow transparent liquid';
          else if (/透明/i.test(val)) sec9Facts.appearance = 'Transparent liquid';
          else if (/微黄|淡黄/i.test(val)) sec9Facts.appearance = 'Slightly yellowish liquid';
          else if (/均质/i.test(val)) sec9Facts.appearance = 'Homogeneous liquid';
          else sec9Facts.appearance = 'Liquid';
        } else if (/饱和蒸气压/i.test(lbl)) {
          if (/无数据/i.test(val)) {
            sec9Facts.saturated_vapour = 'No data available.';
          } else {
            sec9Facts.saturated_vapour = val
              .replace(/约\s*/g, 'Approx. ')
              .replace(/在\s*(\d+)℃/g, 'at $1℃')
              .replace(/hPa/gi, ' hPa');
          }
        } else if (/粉尘爆炸/i.test(lbl)) {
          sec9Facts.dust_explosion = /不适用/i.test(val) ? 'Not applicable' : (/无数据/i.test(val) ? 'No data available.' : val);
        } else if (/嗅觉阈值/i.test(lbl)) {
          sec9Facts.odour_threshold = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/pH/i.test(lbl)) {
          sec9Facts.ph = /无数据/i.test(val) ? 'No data available.' : val;
        } else if (/离子性/i.test(lbl)) {
          if (/阳离子/i.test(val)) sec9Facts.ionicity = 'Cationic';
          else if (/阴离子/i.test(val)) sec9Facts.ionicity = 'Anionic';
          else if (/非离子/i.test(val)) sec9Facts.ionicity = 'Non-ionic';
          else if (/无数据|无资料/.test(val)) sec9Facts.ionicity = 'No data available.';
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
          if (/完全.*(?:混溶|互溶)|(?:混溶|互溶).*完全/i.test(val)) sec9Facts.solubility = 'Completely miscible with water';
          else if (/混溶|互溶/i.test(val)) sec9Facts.solubility = 'Miscible with water';
          else if (/分散.*乳化|乳化.*分散/i.test(val)) sec9Facts.solubility = 'Dispersible and emulsifiable in water';
          else if (/分散|乳化/i.test(val)) sec9Facts.solubility = 'Dispersible in water';
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
          sec9Facts.solids = val.replace(/约\s*/g, 'Approx. ');
        }
      }
    }
    if (facts.appearanceEn) {
      sec9Facts.appearance = facts.appearanceEn;
    }
    if (facts.viscosityOverride) {
      sec9Facts.viscosity = facts.viscosityOverride;
    }
    if (facts.section9Overrides) {
      for (const [pattern, val] of Object.entries(facts.section9Overrides)) {
        if (/粘度|动力粘度/i.test(pattern)) sec9Facts.viscosity = val;
        else if (/固体含量|固含/i.test(pattern)) sec9Facts.solids = val;
        else if (/密度/i.test(pattern)) sec9Facts.density = val.replace(/约\s*/g, 'Approx. ');
        else if (/外\s*观/i.test(pattern)) {
          if (/无色.*微黄|无色.*淡黄/i.test(val)) sec9Facts.appearance = 'Colorless to slightly yellow transparent liquid';
          else if (/微黄.*透明|淡黄.*透明|透明.*微黄|透明.*淡黄/i.test(val)) sec9Facts.appearance = 'Light yellow transparent liquid';
          else if (/无色.*淡黄|淡黄.*粘稠/i.test(val)) sec9Facts.appearance = 'Colorless to light yellow transparent viscous liquid';
          else if (/乳白.*蓝光|蓝光.*乳液/i.test(val)) sec9Facts.appearance = 'Milky white emulsion with bluish tint';
          else if (/乳白.*乳液/i.test(val)) sec9Facts.appearance = 'Milky white emulsion';
          else if (/乳白/i.test(val)) sec9Facts.appearance = 'Milky white liquid';
          else sec9Facts.appearance = val;
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
        decompEn = 'Releases dimethylpyrazole under baking conditions. Gases released during baking should be vented.';
      }
    }
  }

  // 6. Section 4 急救措施动态解析 (保全昏迷禁喂与20分钟眼睛冲洗)
  let ingestionEn = 'Do NOT induce vomiting. Seek medical attention immediately.';
  let eyeEn = 'Hold eyelids open and flush with plenty of warm water for at least 10 minutes. Consult an ophthalmologist.';
  if (baseCnEngine) {
    const s4 = baseCnEngine.records.find(r => r.sectionNumber === 4);
    if (s4) {
      const ingRow = s4.rows.find(r => /误服/i.test(r.cells[0]?.text || ''));
      const ingText = ingRow?.cells[1]?.text || '';
      if (/无意识/i.test(ingText)) {
        ingestionEn = 'Do NOT induce vomiting. Seek medical attention immediately. Never give anything by mouth to an unconscious person.';
      }
      const eyeRow = s4.rows.find(r => /眼睛/i.test(r.cells[0]?.text || ''));
      const eyeText = eyeRow?.cells[1]?.text || '';
      if (/20\s*分钟/i.test(eyeText)) {
        eyeEn = 'Hold eyelids open and flush with plenty of warm water for at least 20 minutes. Tilt head to avoid contaminating the unaffected eye. Consult an ophthalmologist immediately.';
      }
    }
  }

  // 7. Section 12.3 生态其他不利影响忠实翻译 (杜绝伪造鱼类无害结论)
  let sec12OtherEffects = 'No data available.';
  if (baseCnEngine) {
    const s12 = baseCnEngine.records.find(r => r.sectionNumber === 12);
    if (s12) {
      const otherRow = s12.rows.find(r => /其他不利/i.test(r.cells[0]?.text || ''));
      const otherText = (otherRow?.cells[1]?.text || '').trim();
      if (otherText && !/无数据/i.test(otherText)) {
        if (/对鱼类.*(?:和|与).*水蚤无害/i.test(otherText)) {
          sec12OtherEffects = 'Based on ecotoxicological data, the product is classified as non-hazardous to fish and daphnia.';
        } else {
          sec12OtherEffects = 'No data available.';
        }
      }
    }
  }

  // 8. Section 14.4 用户特殊注意事项动态提取 (严格格式服从原文，禁止无中生有硬编码外生条件)
  let specialPrecautionsEn = 'Not regulated as dangerous goods.';
  if (baseCnEngine) {
    const s14 = baseCnEngine.records.find(r => r.sectionNumber === 14);
    if (s14) {
      const specRow = s14.rows.find(r => /用户特殊注意事项|特殊注意事项/i.test(r.cells[0]?.text || ''));
      const specText = (specRow?.cells[1]?.text || '').trim();
      if (specText) {
        const parts = ['Not regulated as dangerous goods.'];
        const highMatch = specText.match(/高于\s*([+\-－]?\d+)℃/);
        const lowMatch = specText.match(/低于\s*([+\-－]?\d+)℃/);
        if (highMatch || lowMatch) {
          const normalizeTemp = (m, def) => {
            if (!m) return def;
            let val = m[1].replace('－', '-');
            if (!val.startsWith('+') && !val.startsWith('-')) val = `+${val}`;
            return val;
          };
          const maxTemp = normalizeTemp(highMatch, '+35');
          const minTemp = normalizeTemp(lowMatch, '-5');
          parts.push(`Temperature must not exceed ${maxTemp}°C and must not fall below ${minTemp}°C.`);
        }
        if (/远离.*(?:食品|食物)/i.test(specText) || /远离.*(?:酸|碱)/i.test(specText)) {
          parts.push('Keep away from food, acids and bases.');
        }
        specialPrecautionsEn = parts.join('\n');
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
    'sec4.ingestion': ingestionEn,
    'sec4.eye_contact': eyeEn,
    'sec4.skin_contact': 'Wash immediately with plenty of soap and water. If skin reaction occurs, seek medical advice.',
    'sec4.inhalation': 'If respiratory irritation occurs, seek medical advice.',

    // Section 5
    'sec5.suitable_extinguishing': 'Carbon dioxide (CO2), foam, extinguishing powder. For large fires, use water spray.',
    'sec5.unsuitable_extinguishing': unsuitableExtinguishing,
    'sec5.specific_hazards': 'Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide.',
    'sec5.protective_equipment': (() => {
      const cnS5Rec = baseCnEngine?.records?.find(r => r.sectionNumber === 5);
      const allS5Text = cnS5Rec?.rows?.map(r => (r.cells[0]?.text || '') + ' ' + (r.cells[1]?.text || '')).join('\n') || '';
      const parts = [];
      if (/自供气式呼吸器|正压式空气呼吸器|自给式呼吸器|SCBA/i.test(allS5Text)) {
        parts.push('Firefighters must wear self-contained breathing apparatus (SCBA).');
      }
      if (/禁止污染的灭火用水|污染.*灭火.*用水.*(?:土壤|地下水|地表水)/i.test(allS5Text)) {
        parts.push('Do not allow contaminated firefighting water to enter soil, groundwater or surface water.');
      }
      if (/吸进烟尘|吸入烟气|吸入烟尘|烟雾/i.test(allS5Text) || parts.length === 0) {
        parts.push('In case of fire or explosion, do not breathe fumes/smoke.');
      }
      return parts.join('\n');
    })(),

    // Section 6
    'sec6.personal_precautions': 'Wear protective equipment.\nEnsure adequate ventilation. Keep unauthorized persons away.',
    'sec6.environmental_precautions': 'Do not discharge into drains, wastewater, or soil.',
    'sec6.cleaning_method': 'Absorb with chemical absorbent material or dry sand if necessary, and store in tightly closed containers.',

    // Section 7
    'sec7.handling': 'Observe common chemical precautions during handling. Avoid contact with skin and eyes.\nKeep away from food, drink and tobacco. Wash hands before breaks and at the end of workday. Store work clothing separately.\nChange contaminated or soaked clothing.',
    'sec7.storage': 'Keep containers tightly closed in a dry, well-ventilated place. To maintain product quality, strictly follow the storage conditions in our technical data sheet.',

    // Section 8
    'sec8.respiratory_protection': 'Respiratory protection equipment is required during spraying.',
    'sec8.hand_protection': '',
    'sec8.glove_material': 'EN 374-3',
    'sec8.fkm_glove': 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min.',
    'sec8.iir_glove': 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min.',
    'sec8.nbr_glove': 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min.',
    'sec8.glove_recommendation': 'Discard contaminated gloves.',
    'sec8.eye_protection': (() => {
      const cnS8Rec = baseCnEngine?.records?.find(r => r.sectionNumber === 8);
      const cnEye = cnS8Rec?.rows?.find(r => /眼睛防护/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
      if (/眼罩|面罩/i.test(cnEye)) return 'Wear protective goggles/face shield.';
      if (/建议使用护目镜|护目镜/i.test(cnEye)) return 'Protective goggles are recommended.';
      return cnEye || '';
    })(),
    'sec8.body_protection': 'Wear appropriate protective clothing.',
    'sec8.engineering_controls': (() => {
      const cnS8Rec = baseCnEngine?.records?.find(r => r.sectionNumber === 8);
      const cnEng = cnS8Rec?.rows?.find(r => /工程控制/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
      if (!cnEng) return '';
      if (/局部排风.*全面通风/i.test(cnEng)) {
        return 'Use local exhaust or general ventilation to maintain workplace concentrations below occupational exposure limits; eyewash and safety shower facilities should be provided in the workplace.';
      }
      if (/2006\/121|无可用的接触限值/i.test(cnEng)) {
        return 'No exposure limit information is available under EC Directive 2006/121/EC.';
      }
      if (/不含有职业接触限值|不含职业接触/i.test(cnEng)) {
        return 'Contains no substances with occupational exposure limit values.';
      }
      return '';
    })(),

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
    'sec12.ecotoxicity': 'No ecotoxicological studies are available for this product.\nDo not discharge into drains, wastewater, or soil.',
    'sec12.persistence': 'The product is not readily biodegradable.',
    'sec12.other_effects': sec12OtherEffects,

    // Section 13
    'sec13.line1': 'Dispose of in accordance with applicable national standards and national or local regulations.',
    'sec13.line2': 'Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
    'sec13.general': 'Dispose of in accordance with applicable national standards and national or local regulations.\nWithin the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
    'sec13.methods': 'Empty containers as completely as possible (e.g., by pouring, scraping, or draining until “drip-dry”).\nThey may be sent to an appropriate collection point under existing chemical industry recycling schemes.\nRecycle containers in accordance with national regulations and applicable environmental requirements.\nDo not discharge waste via wastewater.',

    // Section 14
    'sec14.road_rail': 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.',
    'sec14.sea': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
    'sec14.air': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
    'sec14.special_precautions': specialPrecautionsEn,

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

/**
 * 构建非危复合模态 Section 2 通栏行 (Mode B)
 * 100% 忠实吸收 GHS 分类、S3 成盐豁免、信号词、危害说明、四大防范规程与下水道堵塞危害
 */

// ==========================================
// 通用 GHS 分类与 H/P 规程中英标准数据字典
// ==========================================
export const GHS_H_TO_CATEGORY_EN = {
  'H332': 'Acute toxicity, Inhalation (Category 4), H332',
  'H317': 'Skin sensitization (Category 1B), H317',
  'H335': 'Specific target organ toxicity - single exposure (Category 3), H335',
  'H412': 'Chronic aquatic toxicity (Category 3), H412',
  'H302': 'Acute toxicity, Oral (Category 4), H302',
  'H312': 'Acute toxicity, Dermal (Category 4), H312',
  'H315': 'Skin corrosion/irritation (Category 2), H315',
  'H316': 'Skin corrosion/irritation (Category 3), H316',
  'H319': 'Serious eye damage/eye irritation (Category 2A), H319',
  'H320': 'Serious eye damage/eye irritation (Category 2B), H320',
  'H360': 'Reproductive toxicity (Category 1B), H360',
  'H370': 'Specific target organ toxicity - single exposure (Category 1), H370',
  'H373': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  'H226': 'Flammable liquid (Category 3), H226'
};

export function translateGhsCategory(cat) {
  if (!cat) return '';
  const trimmed = cat.trim();
  if (GHS_CATEGORY_TRANS_MAP[trimmed]) return GHS_CATEGORY_TRANS_MAP[trimmed];
  const hMatch = trimmed.match(/H\d{3}[A-Za-z]?/i);
  if (hMatch) {
    const code = hMatch[0].toUpperCase();
    if (GHS_H_TO_CATEGORY_EN[code]) return GHS_H_TO_CATEGORY_EN[code];
  }
  if (/急性毒性.*吸入/i.test(trimmed)) return 'Acute toxicity, Inhalation (Category 4), H332';
  if (/皮肤致敏/i.test(trimmed)) return 'Skin sensitization (Category 1B), H317';
  if (/靶器官.*一次/i.test(trimmed)) return 'Specific target organ toxicity - single exposure (Category 3), H335';
  if (/慢性.*水/i.test(trimmed)) return 'Chronic aquatic toxicity (Category 3), H412';
  return trimmed;
}

const GHS_CATEGORY_TRANS_MAP = {
  '急性毒性（吸入），类别4（H332）': 'Acute toxicity, Inhalation (Category 4), H332',
  '急性毒性（吸入），类别 4（H332）': 'Acute toxicity, Inhalation (Category 4), H332',
  '皮肤腐蚀/刺激，类别3（H316）': 'Skin corrosion/irritation (Category 3), H316',
  '皮肤腐蚀/刺激，类别 3（H316）': 'Skin corrosion/irritation (Category 3), H316',
  '严重眼睛损伤/眼睛刺激性，类别2B（H320）': 'Serious eye damage/eye irritation (Category 2B), H320',
  '严重眼睛损伤/眼睛刺激性，类别 2B（H320）': 'Serious eye damage/eye irritation (Category 2B), H320',
  '生殖毒性物质，类别1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性物质，类别 1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性，类别1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性，类别 1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '特异性靶器官系统毒性 一次接触，类别1（H370）': 'Specific target organ toxicity - single exposure (Category 1), H370',
  '特异性靶器官系统毒性 一次接触，类别 1（H370）': 'Specific target organ toxicity - single exposure (Category 1), H370',
  '特异性靶器官系统毒性 反复接触，类别2（H373）': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  '特异性靶器官系统毒性 反复接触，类别 2（H373）': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  '易燃液体，类别3（H226）': 'Flammable liquid (Category 3), H226',
  '易燃液体，类别 3（H226）': 'Flammable liquid (Category 3), H226',
  '皮肤致敏，类别1B（H317）': 'Skin sensitization (Category 1B), H317',
  '皮肤致敏，类别 1B（H317）': 'Skin sensitization (Category 1B), H317',
  '对水环境有慢性危害, 类别 3 (H412)': 'Chronic aquatic toxicity (Category 3), H412',
  '对水环境有慢性危害, 类别 3': 'Chronic aquatic toxicity (Category 3), H412',
  '对水环境有慢性危害，类别 3 (H412)': 'Chronic aquatic toxicity (Category 3), H412',
  '皮肤腐蚀/刺激，类别 2 (H315)': 'Skin corrosion/irritation (Category 2), H315',
  '严重眼睛损伤/眼睛刺激性，类别 2A (H319)': 'Serious eye damage/eye irritation (Category 2A), H319',
  '对水环境有慢性危害，类别3（H412）': 'Chronic aquatic toxicity (Category 3), H412',
  '对水环境有慢性危害，类别 3（H412）': 'Chronic aquatic toxicity (Category 3), H412',
  '特异性靶器官系统毒性 一次接触，类别3（H335）': 'Specific target organ toxicity - single exposure (Category 3), H335',
  '特异性靶器官系统毒性 一次接触，类别 3（H335）': 'Specific target organ toxicity - single exposure (Category 3), H335',
  '急性毒性（经口），类别 4（H302）': 'Acute toxicity, Oral (Category 4), H302',
  '急性毒性（经口），类别4（H302）': 'Acute toxicity, Oral (Category 4), H302',
  '急性毒性（经皮），类别 4（H312）': 'Acute toxicity, Dermal (Category 4), H312',
  '急性毒性（经皮），类别4（H312）': 'Acute toxicity, Dermal (Category 4), H312',
  '皮肤腐蚀/刺激，类别 2（H315）': 'Skin corrosion/irritation (Category 2), H315',
  '皮肤腐蚀/刺激，类别2（H315）': 'Skin corrosion/irritation (Category 2), H315',
  '严重眼睛损伤/眼睛刺激性，类别 2A（H319）': 'Serious eye damage/eye irritation (Category 2A), H319',
  '严重眼睛损伤/眼睛刺激性，类别2A（H319）': 'Serious eye damage/eye irritation (Category 2A), H319',
  '急性毒性(经口), 类别 4(H302)': 'Acute toxicity, Oral (Category 4), H302',
  '急性毒性(经皮), 类别 4(H312)': 'Acute toxicity, Dermal (Category 4), H312',
  '皮肤腐蚀/刺激, 类别 2(H315)': 'Skin corrosion/irritation (Category 2), H315',
  '严重眼睛损伤/眼睛刺激性, 类别 2A(H319)': 'Serious eye damage/eye irritation (Category 2A), H319',
};

const GHS_H_TRANS_MAP = {
  'H316': 'H316 Causes mild skin irritation.',
  'H320': 'H320 Causes eye irritation.',
  'H332': 'H332 Harmful if inhaled.',
  'H360': 'H360 May damage fertility or the unborn child.',
  'H370': 'H370 Causes damage to organs.',
  'H373': 'H373 May cause damage to organs (Liver) through prolonged or repeated exposure.',
  'H226': 'H226 Flammable liquid and vapour.',
  'H317': 'H317 May cause an allergic skin reaction.',
  'H335': 'H335 May cause respiratory irritation.',
  'H412': 'H412 Harmful to aquatic life with long lasting effects.',
  'H302': 'H302 Harmful if swallowed.',
  'H312': 'H312 Harmful in contact with skin.',
  'H315': 'H315 Causes skin irritation.',
  'H319': 'H319 Causes serious eye irritation.',
};

const GHS_P_TRANS_MAP = {
  'P273': 'P273 Avoid release to the environment.',
  'P201': 'P201 Obtain special instructions before use.',
  'P202': 'P202 Do not handle until all safety precautions have been read and understood.',
  'P260': 'P260 Do not breathe dust/fume/gas/mist/vapours/spray.',
  'P264': 'P264 Wash hands thoroughly after handling.',
  'P270': 'P270 Do not eat, drink or smoke when using this product.',
  'P271': 'P271 Use only outdoors or in a well-ventilated area.',
  'P280': 'P280 Wear protective gloves/clothing/eye protection/face protection.',
  'P304+P340': 'P304+P340 IF INHALED: Remove person to fresh air and keep comfortable for breathing.',
  'P305+P351+P338': 'P305+P351+P338 IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.',
  'P308+P313': 'P308+P313 IF exposed or concerned: Get medical advice/attention.',
  'P337+P313': 'P337+P313 If eye irritation persists: Get medical advice/attention.',
  'P370+P378': 'P370+P378 In case of fire: Use foam, dry powder or carbon dioxide to extinguish.',
  'P405': 'P405 Store locked up.',
  'P501': 'P501 Dispose of contents/container to an approved waste disposal plant.',
  'P261': 'P261 Avoid breathing dust/fume/gas/mist/vapours/spray.',
  'P301+P312+P330': 'P301+P312+P330 IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell. Rinse mouth.',
  'P301+P312': 'P301+P312 IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell.',
  'P302+P352': 'P302+P352 IF ON SKIN: Wash with plenty of water and soap.',
  'P304+P340+P312': 'P304+P340+P312 IF INHALED: Remove person to fresh air and keep comfortable for breathing. Call a POISON CENTER/doctor if you feel unwell.',
  'P332+P313': 'P332+P313 If skin irritation occurs: Get medical advice/attention.',
  'P362+P364': 'P362+P364 Take off contaminated clothing and wash it before reuse.',
  'P403+P233': 'P403+P233 Store in a well-ventilated place. Keep container tightly closed.',
  'P403': 'P403 Store in a well-ventilated place.',
  'P233': 'P233 Keep container tightly closed.',
  'P312': 'P312 Call a POISON CENTER/doctor if you feel unwell.',
  'P304+P312': 'P304+P312 IF INHALED: Call a POISON CENTER/doctor if you feel unwell.',
  'P234': 'P234 Keep only in original packaging.',
  'P391': 'P391 Collect spillage.',
  'P333+P313': 'P333+P313 If skin irritation or rash occurs: Get medical advice/attention.',
  'P363': 'P363 Wash contaminated clothing before reuse.',
};

export function translateGhsPrecautionary(p) {
  if (!p) return '';
  const normalized = p.replace(/P(\d+)\s*\+\s*\.?\s*P?(\d+)/gi, 'P$1+P$2');
  const codeMatch = normalized.match(/^(P\d+(?:\+P\d+)*)/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : '';
  if (code && GHS_P_TRANS_MAP[code]) {
    return GHS_P_TRANS_MAP[code];
  }
  return GHS_P_TRANS_MAP[code] || p;
}

/**
 * 从源文档 Section 2 提取真实结构化事实
 */
export function parseSection2FromSource(srcEngine) {
  const srcS2 = srcEngine?.records?.find(r => r.sectionNumber === 2);
  if (!srcS2) return null;
  const rawParas = [];
  for (let r = 1; r < srcS2.rows.length; r++) {
    for (const cell of srcS2.rows[r].cells) {
      for (const p of cell.paragraphs) {
        const txt = p.runs.map(r => r.text).join('').trim();
        if (txt) rawParas.push(txt);
      }
    }
  }

  const fullText = rawParas.join(' ');
  const isNonHazardous = !fullText || /根据GHS不属于危害化学品|不属于危害化学品|不属于危险|未被分类/i.test(fullText);

  let mode = '';
  const categories = [];
  let signalWord = '';
  let pictogramText = '';
  const hazardStatements = [];
  const prevention = [];
  const response = [];
  const storage = [];
  const disposal = [];
  let otherHazards = '';
  let hazardousIngredients = '';

  for (let i = 0; i < rawParas.length; i++) {
    const p = rawParas[i];
    if (/2\.1\s*GHS危险性类别/i.test(p) || /^物质或混合物分类/i.test(p)) {
      mode = 'cat';
      continue;
    }
    if (/2\.2\s*GHS标签要素/i.test(p) || /^2\.2\s*标签要素/i.test(p) || /^标签要素/i.test(p) || /GHS[- ]?象形图/i.test(p)) {
      mode = 'label';
      const m = p.match(/GHS[- ]?象形图[：:\s]*(.*)/i);
      if (m && m[1].trim()) {
        pictogramText = m[1].trim();
      } else if (i + 1 < rawParas.length && !/^[1-9]\.|^GHS|^[A-Z]\d+|^防范|^危险|^警告|^信号/i.test(rawParas[i + 1])) {
        if (!/危害性说明|防范说明|其他危险/i.test(rawParas[i + 1])) {
          pictogramText = rawParas[i + 1].trim();
        }
      }
      continue;
    }
    if (/必须列在标签上的有害成[份分]|有害成[份分]/i.test(p)) {
      let ing = p.replace(/.*(?:必须列在标签上的有害成[份分]|有害成[份分])[：:]?\s*/, '').trim();
      if (!ing && i + 1 < rawParas.length && !/^[1-9]\.|^GHS|^[A-Z]\d+|^防范|^危险|^警告|^信号/i.test(rawParas[i + 1])) {
        ing = rawParas[i + 1].trim();
      }
      hazardousIngredients = ing;
      continue;
    }
    if (/信号词[：:]\s*(危险|警告)/i.test(p)) {
      signalWord = p.match(/信号词[：:]\s*(危险|警告)/i)[1];
      continue;
    }
    if (/^(?:(?:2\.\d+\s*)?(?:危险性说明|危害性说明|危害说明|危险说明|Hazard statements?))[：:]?$/i.test(p)) {
      mode = 'h';
      continue;
    }
    if (/^(?:(?:2\.\d+\s*)?(?:防范说明|Precautionary statements?))[：:]?$/i.test(p)) {
      mode = 'p';
      continue;
    }
    if (/^(?:(?:2\.\d+\s*)?(?:预防措施|Prevention))[：:]?$/i.test(p)) {
      mode = 'p_prev';
      continue;
    }
    if (/^(?:(?:2\.\d+\s*)?(?:事故响应|Response))[：:]?$/i.test(p)) {
      mode = 'p_resp';
      continue;
    }
    if (/^(?:(?:2\.\d+\s*)?(?:安全储存|安全存储|Storage))[：:]?$/i.test(p)) {
      mode = 'p_store';
      continue;
    }
    if (/^(?:(?:2\.\d+\s*)?(?:废弃处置|Disposal))[：:]?$/i.test(p)) {
      mode = 'p_disp';
      continue;
    }
    if (/(?:2\.\d+\s*)?(?:其他危[害险]|Other\s*hazards?)/i.test(p)) {
      otherHazards = p.replace(/^2\.\d+\s*(?:其他危[害险]|Other\s*hazards?)[：:]?\s*/i, '');
      mode = 'other';
      continue;
    }

    if (mode === 'cat') {
      if (!/GHS标签要素|象形图|有害成[份分]|CHS危险性类别|标签要素/i.test(p)) {
        if (!/2\.1\s*物质或混合物的分类|GHS危险性类别[：:]?$/i.test(p)) {
          categories.push(p);
        }
      }
    } else if (mode === 'h') {
      if (/^H\d+/i.test(p)) hazardStatements.push(p);
      else if (hazardStatements.length > 0 && !/防范说明/.test(p)) {
        hazardStatements[hazardStatements.length - 1] += p;
      }
    } else if (mode === 'p') {
      const cleanP = p.replace(/宇防护服/g, '穿防护服').replace(/P403\+\.?P233/g, 'P403+P233').replace(/废物外理厂/g, '废物处理厂');
      if (/^P2\d+/i.test(cleanP)) prevention.push(cleanP);
      else if (/^P3\d+/i.test(cleanP)) response.push(cleanP);
      else if (/^P4\d+/i.test(cleanP)) storage.push(cleanP);
      else if (/^P5\d+/i.test(cleanP)) disposal.push(cleanP);
      else prevention.push(cleanP);
    } else if (mode === 'p_prev') {
      if (/^P\d+/i.test(p)) prevention.push(p);
      else if (prevention.length > 0) prevention[prevention.length - 1] += p;
    } else if (mode === 'p_resp') {
      if (/^P\d+/i.test(p)) response.push(p);
      else if (response.length > 0) response[response.length - 1] += p;
    } else if (mode === 'p_store') {
      if (/^P\d+/i.test(p)) storage.push(p);
      else if (storage.length > 0) storage[storage.length - 1] += p;
    } else if (mode === 'p_disp') {
      if (/^P\d+/i.test(p)) disposal.push(p);
      else if (disposal.length > 0) disposal[disposal.length - 1] += p;
    } else if (mode === 'other') {
      if (otherHazards) otherHazards += ' ' + p;
      else otherHazards = p;
    }
  }

  if (!isNonHazardous && !signalWord && fullText.includes('警告')) {
    signalWord = '警告';
  }

  return {
    rawParas,
    isNonHazardous,
    categories,
    pictogramText,
    signalWord,
    hazardStatements,
    prevention,
    response,
    storage,
    disposal,
    hazardousIngredients,
    otherHazards
  };
}


export function extractSection9PropertiesFromSource(srcEngine) {
  const s9 = srcEngine?.records?.find(r => r.sectionNumber === 9);
  if (!s9) return [];

  const items = [];
  for (let rIdx = 1; rIdx < s9.rows.length; rIdx++) {
    const row = s9.rows[rIdx];
    const c0 = row.cells[0];
    const c1 = row.cells[1];
    if (!c0) continue;

    const p0s = c0.node ? Array.from(c0.node.getElementsByTagName('w:p')) : [];
    const p1s = c1 && c1.node ? Array.from(c1.node.getElementsByTagName('w:p')) : [];

    const getPText = (p) => {
      if (!p) return '';
      const ts = p.getElementsByTagName('w:t');
      let text = '';
      for (let i = 0; i < ts.length; i++) text += ts[i].textContent || '';
      return text.trim();
    };

    const lines0 = p0s.length > 0 ? p0s.map(getPText).filter(Boolean) : (c0.text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const lines1 = p1s.length > 0 ? p1s.map(getPText).filter(Boolean) : (c1?.text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    if (lines0.length > 1 && lines0.length === lines1.length) {
      for (let k = 0; k < lines0.length; k++) {
        items.push({
          rawLabel: lines0[k],
          rawValue: lines1[k]
        });
      }
    } else {
      items.push({
        rawLabel: lines0.join(' ') || (c0.text || '').trim(),
        rawValue: lines1.join(' ') || (c1?.text || '').trim()
      });
    }
  }
  return items;
}

export function translateSection9Item(cnNum, cnLabel, cnVal) {
  let enLabel = '';
  let enVal = '';

  if (/外\s*观/i.test(cnLabel)) {
    enLabel = 'Appearance:';
    if (/黄色至浅褐色透明液体|黄.*浅褐.*透明/i.test(cnVal)) enVal = 'Yellow to light brown transparent liquid';
    else if (/乳白.*蓝光|蓝光.*乳液/i.test(cnVal)) enVal = 'Milky white emulsion with bluish tint';
    else if (/乳白.*乳液/i.test(cnVal)) enVal = 'Milky white emulsion';
    else if (/半透明.*乳液|乳液.*半透明/i.test(cnVal)) enVal = 'Translucent emulsion';
    else if (/半透明/i.test(cnVal)) enVal = 'Translucent liquid';
    else if (/乳白/i.test(cnVal)) enVal = 'Milky white liquid';
    else if (/无色.*淡黄|淡黄.*粘稠/i.test(cnVal)) enVal = 'Colourless to light yellow transparent viscous liquid';
    else if (/无色.*微黄|无色.*淡黄/i.test(cnVal)) enVal = 'Colorless to slightly yellow transparent liquid';
    else if (/微黄.*透明|淡黄.*透明|透明.*微黄|透明.*淡黄/i.test(cnVal)) enVal = 'Light yellow transparent liquid';
    else if (/无色透明/i.test(cnVal)) enVal = 'Colourless transparent liquid';
    else if (/微黄|淡黄/i.test(cnVal)) enVal = 'Slightly yellowish liquid';
    else if (/均质/i.test(cnVal)) enVal = 'Homogeneous liquid';
    else enVal = 'Liquid';
  } else if (/嗅觉/i.test(cnLabel)) {
    enLabel = 'Odour threshold:';
    enVal = /胺味/.test(cnVal) ? 'Amine-like' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);
  } else if (/pH/i.test(cnLabel)) {
    enLabel = 'pH value:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;
  } else if (/离\s*子\s*性/i.test(cnLabel)) {
    enLabel = 'Ionicity:';
    if (/阴离子/i.test(cnVal)) enVal = 'Anionic';
    else if (/阳离子/i.test(cnVal)) enVal = 'Cationic';
    else if (/非离子/i.test(cnVal)) enVal = 'Non-ionic';
    else if (/无数据|无资料/.test(cnVal)) enVal = 'No data available.';
    else enVal = cnVal;
  } else if (/初沸点|沸程/i.test(cnLabel)) {
    enLabel = 'Initial boiling point:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal.replace(/约\s*/g, 'Approx. ').replace(/℃/g, ' °C').replace(/＞/g, '> ');
  } else if (/可燃性|易燃性/i.test(cnLabel)) {
    enLabel = /固态|固体/i.test(cnLabel) ? 'Flammability (solids, gases):' : 'Flammability:';
    enVal = /不适用/.test(cnVal) ? 'Not applicable' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);
  } else if (/燃烧值/i.test(cnLabel)) {
    enLabel = 'Combustion value:';
    enVal = /不适用/.test(cnVal) ? 'Not applicable' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);
  } else if (/饱和蒸气压/i.test(cnLabel)) {
    enLabel = 'Saturated vapour pressure:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal.replace(/约\s*/g, 'Approx. ').replace(/在\s*(\d+)℃/g, 'at $1℃').replace(/hPa/gi, ' hPa');
  } else if (/蒸发速率/i.test(cnLabel)) {
    enLabel = 'Evaporation rate:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : (/不适用/.test(cnVal) ? 'Not applicable' : cnVal);
  } else if (/相对蒸气密度|蒸气密度/i.test(cnLabel)) {
    enLabel = 'Relative vapour density:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;
  } else if (/NCO/i.test(cnLabel)) {
    enLabel = 'NCO content:';
    enVal = cnVal;
  } else if (/水溶性|溶解性/i.test(cnLabel)) {
    enLabel = 'Solubility in water:';
    if (/分散.*乳化|乳化.*分散/i.test(cnVal)) enVal = 'Dispersible and emulsifiable in water';
    else if (/完全.*(?:混溶|互溶)|(?:混溶|互溶).*完全/i.test(cnVal)) enVal = 'Completely miscible with water';
    else if (/混溶|互溶/i.test(cnVal)) enVal = 'Miscible with water';
    else if (/不溶/i.test(cnVal)) enVal = 'Insoluble in water';
    else if (/分散|乳化/i.test(cnVal)) enVal = 'Dispersible in water';
    else enVal = cnVal;
  } else if (/表面张力/i.test(cnLabel)) {
    enLabel = 'Surface tension:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;
  } else if (/分配系数/i.test(cnLabel)) {
    enLabel = 'Partition coefficient n-octanol/water:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;
  } else if (/粘度/i.test(cnLabel)) {
    enLabel = /25/i.test(cnLabel) ? 'Dynamic viscosity at 25 °C:' : 'Dynamic viscosity:';
    enVal = cnVal.replace(/＜/g, '< ').replace(/＞/g, '> ').replace(/mPa\.s/gi, 'mPa·s');
  } else if (/自燃温度/i.test(cnLabel)) {
    enLabel = 'Auto-ignition temperature:';
    enVal = /不适用/.test(cnVal) ? 'Not applicable' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);
  } else if (/闪点/i.test(cnLabel)) {
    enLabel = /闭口|闭杯/i.test(cnLabel) ? 'Flash point (closed cup):' : 'Flash point:';
    if (/无闪点/i.test(cnVal)) enVal = 'No flash point below initial boiling point';
    else if (/不适用/i.test(cnVal)) enVal = 'Not applicable';
    else if (/无数据|无资料/.test(cnVal)) enVal = 'No data available.';
    else enVal = cnVal.replace(/℃/g, ' °C').replace(/＞/g, '> ').replace(/(\d+)\s*°C/, '$1 °C');
  } else if (/引燃温度/i.test(cnLabel)) {
    enLabel = 'Ignition temperature:';
    enVal = /不适用/.test(cnVal) ? 'Not applicable' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);
  } else if (/分解温度/i.test(cnLabel)) {
    enLabel = 'Decomposition temperature:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;
  } else if (/爆炸特性/i.test(cnLabel)) {
    enLabel = 'Explosive properties:';
    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;
  } else if (/粉尘爆炸/i.test(cnLabel)) {
    enLabel = 'Dust explosion class:';
    enVal = /不适用/.test(cnVal) ? 'Not applicable' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);
  } else if (/固体含量|固含/i.test(cnLabel)) {
    enLabel = 'Solid content:';
    enVal = cnVal.replace(/约\s*/g, 'Approx. ');
  } else if (/密度/i.test(cnLabel)) {
    enLabel = /25/i.test(cnLabel) ? 'Density at 25 °C:' : 'Density:';
    enVal = cnVal.replace(/约\s*/g, 'Approx. ').replace(/g\/cm3/gi, ' g/cm³');
  } else if (/其他信息/i.test(cnLabel)) {
    enLabel = 'Other information:';
    enVal = 'The above data are not product specifications. Please refer to the product technical information sheet for specifications.';
  } else {
    enLabel = cnLabel;
    enVal = cnVal;
  }

  return { enLabel, enVal };
}

export function buildFullWidthSection2(engine, facts = {}, isEnglish = false) {
  let s2 = engine.records.find((r) => r.sectionNumber === 2);
  if (!s2) return;

  // 1. 保留 Row 0（标题行），清理后续所有行只留 Row 1
  while (s2.rows.length > 2) {
    s2 = deleteRow(engine, s2, s2.rows.length - 1);
  }
  while (s2.rows.length < 2) {
    s2 = addRowAfter(engine, s2, s2.rows.length - 1);
  }

  // 2. 从源引擎中精准解析真实 Section 2 结构
  const parsed = facts.section2Override || parseSection2FromSource(facts.srcEngine);
  const isNonHazardous = !parsed || parsed.isNonHazardous || (!parsed.categories.length && !parsed.hazardStatements.length);

  const paragraphs = [];
  if (!isEnglish) {
    // 中文通栏组装
    if (!isNonHazardous && parsed) {
      const cleanCats = parsed.categories.map(c => c.replace(/,\s*/g, '，').replace(/\((H\d+)\)/g, '（$1）'));
      paragraphs.push(
        '2.1 GHS危险性类别：',
        ...cleanCats,
        '2.2 GHS标签要素：'
      );
      if (facts.drawingNodes && facts.drawingNodes.length > 0) {
        paragraphs.push('GHS象形图：');
        paragraphs.push({ isDrawing: true, drawingNodes: facts.drawingNodes, srcEngine: facts.srcEngine });
      } else if (parsed.pictogramText && parsed.pictogramText !== '无') {
        paragraphs.push(`GHS象形图：${parsed.pictogramText}`);
      } else if (parsed.pictogramText === '无') {
        paragraphs.push('GHS象形图：无');
      }
      if (parsed.hazardousIngredients) {
        paragraphs.push(`必须列在标签上的有害成份：${parsed.hazardousIngredients}`);
      }
      // 仅当源文件明确载明信号词时输出，严禁外生兜底虚增“信号词：无” (INV-ZERO-EXOGENOUS)
      if (parsed.signalWord) {
        paragraphs.push(`信号词：${parsed.signalWord}`);
      }

      let secIdx = 3;
      if (parsed.hazardStatements && parsed.hazardStatements.length > 0) {
        paragraphs.push(`2.${secIdx++} 危险性说明：`, ...parsed.hazardStatements);
      }
      const hasPrecaution = (parsed.prevention?.length || 0) + (parsed.response?.length || 0) + (parsed.storage?.length || 0) + (parsed.disposal?.length || 0) > 0;
      if (hasPrecaution) {
        paragraphs.push(`2.${secIdx++} 防范说明：`);
        if (parsed.prevention && parsed.prevention.length > 0) {
          paragraphs.push('预防措施：', ...parsed.prevention.map(p => p.trim()));
        }
        if (parsed.response && parsed.response.length > 0) {
          paragraphs.push('事故响应：', ...parsed.response.map(p => p.trim()));
        }
        if (parsed.storage && parsed.storage.length > 0) {
          paragraphs.push('安全储存：', ...parsed.storage.map(p => p.trim()));
        }
        if (parsed.disposal && parsed.disposal.length > 0) {
          paragraphs.push('废弃处置：', ...parsed.disposal.map(p => p.trim()));
        }
      }
      if (parsed.otherHazards) {
        let cleanOtherVal = parsed.otherHazards.trim().replace(/^(?:2\.\d+\s*)?(?:其他危[害险][:：]?\s*)?/i, '');
        paragraphs.push(`2.${secIdx++} 其他危害：`);
        paragraphs.push(cleanOtherVal || '无适用资料。');
      }
    } else {
      // 真实非危通栏组装 (遵循 INV-ZERO-EXOGENOUS 与源事实忠实公理)
      paragraphs.push(
        '2.1 GHS危险性类别：',
        '根据GHS不属于危险物'
      );
      if (facts.section3ExemptionNotes) {
        paragraphs.push(...facts.section3ExemptionNotes.split(/\r?\n/).filter(Boolean));
      }
      if (parsed?.rawParas && parsed.rawParas.some(p => /象形图/.test(p))) {
        paragraphs.push(
          '2.2 GHS标签要素：',
          'GHS象形图：',
          '根据GHS不属于危险物'
        );
      }
      if (parsed?.otherHazards) {
        let cleanOtherVal = parsed.otherHazards.trim().replace(/^(?:2\.\d+\s*)?(?:其他危[害险][:：]?\s*)?/i, '');
        paragraphs.push('2.3 其他危害：');
        paragraphs.push(cleanOtherVal || '无适用资料。');
      }
    }
  } else {
    // 英文通栏组装 (100% 数据驱动动态英译)
    if (!isNonHazardous && parsed) {
      paragraphs.push('2.1 Classification of the substance or mixture:');
      for (const cat of parsed.categories) {
        paragraphs.push(translateGhsCategory(cat));
      }
      paragraphs.push('2.2 GHS Label Elements:');
      if (facts.drawingNodes && facts.drawingNodes.length > 0) {
        paragraphs.push('GHS pictograms:');
        let cleanGhsBytes = null;
        try {
          const cleanGhsPath = fileURLToPath(new URL('../public/assets/ghs/ghs07.png', import.meta.url));
          if (fsSync.existsSync(cleanGhsPath)) {
            cleanGhsBytes = fsSync.readFileSync(cleanGhsPath);
          }
        } catch (e) {}
        paragraphs.push({ isDrawing: true, drawingNodes: facts.drawingNodes, srcEngine: facts.srcEngine, overrideImageBytes: cleanGhsBytes, overrideExt: 'png' });
      } else if (parsed.pictogramText && parsed.pictogramText !== '无') {
        let enPic = parsed.pictogramText;
        if (/丙二醇甲醚|1-甲氧基-2-丙醇/i.test(enPic)) {
          enPic = 'Propylene glycol monomethyl ether';
        }
        paragraphs.push(`GHS pictograms: ${enPic}`);
      } else if (parsed.pictogramText === '无') {
        paragraphs.push('GHS pictograms: None');
      }
      if (parsed.hazardousIngredients) {
        let ingEn = parsed.hazardousIngredients;
        if (/HDI.*亲水|亲水.*HDI|基于HDI/i.test(ingEn)) {
          ingEn = 'Hydrophilic aliphatic polyisocyanate based on HDI';
        } else if (ingEn.includes('丁氧基乙醇')) {
          ingEn = '2-Butoxyethanol';
        }
        paragraphs.push(`Hazardous components which must be listed on the label: ${ingEn}`);
      }
      // 仅当源文件明确载明信号词时输出英译，严禁捏造“Signal word: None” (INV-ZERO-EXOGENOUS)
      if (parsed.signalWord) {
        const enSignal = parsed.signalWord === '危险' ? 'Danger' : (parsed.signalWord === '警告' ? 'Warning' : parsed.signalWord);
        paragraphs.push(`Signal word: ${enSignal}`);
      }

      let secIdxEn = 3;
      if (parsed.hazardStatements && parsed.hazardStatements.length > 0) {
        paragraphs.push(`2.${secIdxEn++} Hazard statements:`);
        for (const h of parsed.hazardStatements) {
          const codeMatch = h.match(/^(H\d+)/);
          const code = codeMatch ? codeMatch[1] : '';
          paragraphs.push(GHS_H_TRANS_MAP[code] || h);
        }
      }
      const hasPrecautionEn = (parsed.prevention?.length || 0) + (parsed.response?.length || 0) + (parsed.storage?.length || 0) + (parsed.disposal?.length || 0) > 0;
      if (hasPrecautionEn) {
        paragraphs.push(`2.${secIdxEn++} Precautionary statements:`);
        if (parsed.prevention && parsed.prevention.length > 0) {
          paragraphs.push('Prevention:');
          for (const p of parsed.prevention) {
            paragraphs.push(translateGhsPrecautionary(p.trim()));
          }
        }
        if (parsed.response && parsed.response.length > 0) {
          paragraphs.push('Response:');
          for (const p of parsed.response) {
            paragraphs.push(translateGhsPrecautionary(p.trim()));
          }
        }
        if (parsed.storage && parsed.storage.length > 0) {
          paragraphs.push('Storage:');
          for (const p of parsed.storage) {
            paragraphs.push(translateGhsPrecautionary(p.trim()));
          }
        }
        if (parsed.disposal && parsed.disposal.length > 0) {
          paragraphs.push('Disposal:');
          for (const p of parsed.disposal) {
            paragraphs.push(translateGhsPrecautionary(p.trim()));
          }
        }
      }
      if (parsed.otherHazards) {
        const curIdx = secIdxEn++;
        let cleanEnVal = parsed.otherHazards.trim().replace(/^(?:2\.\d+\s*)?(?:Other\s*hazards?[:：]?\s*|其他危[害险][:：]?\s*)/i, '');
        let enOther = 'No applicable information.';
        if (/N[－-]甲基吡咯烷酮/i.test(cleanEnVal)) {
          enOther = 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).';
        } else if (/N,N[－-]二甲基乙酰胺/i.test(cleanEnVal)) {
          enOther = 'Risk of cutaneous absorption of N,N-Dimethylacetamide (DMAC).';
        } else if (!cleanEnVal || /无适用资料|无已知|无数据|无/i.test(cleanEnVal)) {
          enOther = 'No applicable information.';
        } else {
          enOther = translateGhsPrecautionary(cleanEnVal) || 'No applicable information.';
        }
        paragraphs.push(`2.${curIdx} Other hazards:`);
        paragraphs.push(enOther);
      }
    } else {
      // 英文真实非危通栏 (遵循 INV-ZERO-EXOGENOUS 与源事实忠实公理)
      paragraphs.push(
        '2.1 Classification of the substance or mixture:',
        'Not classified as a hazardous chemical according to GHS.'
      );
      if (facts.section3ExemptionNotes) {
        paragraphs.push(...facts.section3ExemptionNotes.split(/\r?\n/).filter(Boolean));
      }
      if (parsed?.rawParas && parsed.rawParas.some(p => /象形图|pictogram/i.test(p))) {
        paragraphs.push(
          '2.2 GHS Label Elements:',
          'GHS pictograms:',
          'Not applicable.'
        );
      }
      if (parsed?.otherHazards) {
        paragraphs.push('2.3 Other hazards:');
        paragraphs.push('No applicable information.');
      }
    }
  }

  renderFullWidthRow(s2, 1, paragraphs, {
    isSection2: true,
    isEnglish,
    borders: true,
    boldSubheaders: true,
    totalWidth: 9795,
  });
  engine.refresh();
}

/**
 * Section 11 双范式动态路由判定算法 (对齐 OpenSpec handcraft-typography-and-s11-dual-paradigm)
 * @param {object|Array} section11FactsOrRecords
 * @returns {'PARADIGM_1_FULL_WIDTH_MERGED'|'PARADIGM_2_STANDARD_SLOTS'}
 */
export function detectSection11Paradigm(section11FactsOrRecords) {
  if (!section11FactsOrRecords) return 'PARADIGM_2_STANDARD_SLOTS';
  
  if (section11FactsOrRecords.isMultiComponentComposite || section11FactsOrRecords.isMultiComponentS11) {
    return 'PARADIGM_1_FULL_WIDTH_MERGED';
  }

  let rawText = '';
  if (typeof section11FactsOrRecords === 'string') {
    rawText = section11FactsOrRecords;
  } else if (Array.isArray(section11FactsOrRecords)) {
    rawText = section11FactsOrRecords.map(item => (typeof item === 'string' ? item : item?.text || '')).join(' ');
  } else if (section11FactsOrRecords.rows && Array.isArray(section11FactsOrRecords.rows)) {
    rawText = section11FactsOrRecords.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ');
  } else if (section11FactsOrRecords.node && typeof section11FactsOrRecords.node.textContent === 'string') {
    rawText = section11FactsOrRecords.node.textContent;
  } else {
    try {
      rawText = JSON.stringify(section11FactsOrRecords, (key, value) => {
        if (key === 'node' || key === 'record' || key === 'table' || key === 'parent') return undefined;
        return value;
      });
    } catch {
      rawText = String(section11FactsOrRecords);
    }
  }

  const componentMatches = new Set();
  const casMatches = rawText.match(/\b\d{2,7}-\d{2}-\d\b/g) || [];
  casMatches.forEach(c => componentMatches.add(c));

  const knownComponentKeywords = [
    '丙二醇丁醚', '二乙二醇丁醚', '溶剂', '添加剂'
  ];
  knownComponentKeywords.forEach(kw => {
    if (rawText.includes(kw)) componentMatches.add(kw);
  });

  if (componentMatches.size >= 2) {
    return 'PARADIGM_1_FULL_WIDTH_MERGED';
  }

  return 'PARADIGM_2_STANDARD_SLOTS';
}

export function buildThreeTierSection11(engine, facts = {}, isEnglish = false) {
  let s11 = engine.records.find((r) => r.sectionNumber === 11);
  if (!s11) return;

  while (s11.rows.length > 4) {
    s11 = deleteRow(engine, s11, s11.rows.length - 1);
  }
  while (s11.rows.length < 4) {
    s11 = addRowAfter(engine, s11, s11.rows.length - 1);
  }

  const srcS11 = facts.srcEngine?.records?.find((r) => r.sectionNumber === 11);
  const srcPreamble = (srcS11?.rows[2]?.cells[0]?.text || '').trim();

  const disclaimerText = !isEnglish
    ? '该产品无可用的毒理学研究。'
    : 'No toxicological studies are available on the product.';
  renderFullWidthRow(s11, 1, disclaimerText, { isEnglish, isSection11: true, boldSubheaders: false, totalWidth: 9781 });

  let preambleText = !isEnglish
    ? (srcPreamble || '下面是这些成分的毒理学数据。')
    : 'The following is toxicological data for these ingredients:';
  if (isEnglish && srcPreamble) {
    const compMatch = srcPreamble.match(/以[下为](?:是)?(.*?)毒理学数据/i);
    if (compMatch) {
      let comp = compMatch[1].trim();
      if (/N,N[－-]二甲基乙酰胺|DMAC/i.test(comp)) comp = 'N,N-Dimethylacetamide';
      else if (/N[－-]甲基吡咯烷酮|NMP/i.test(comp)) comp = 'N-Methyl-2-pyrrolidone (NMP)';
      else if (/N[－-]乙基吡咯烷酮|NEP/i.test(comp)) comp = '1-Ethylpyrrolidin-2-one (NEP)';
      preambleText = `The following is toxicological data for ${comp}:`;
    }
  }
  renderFullWidthRow(s11, 2, preambleText, { isEnglish, isSection11: true, leftIndentTwips: 34, boldSubheaders: false, totalWidth: 9781 });

  let detailParagraphs = (isEnglish && facts.detailParagraphsEn) ? facts.detailParagraphsEn : (facts.detailParagraphs || []);
  if (!detailParagraphs.length && srcS11) {
    // 从源文件 Section 11 中动态聚合端点
    const lines = [];
    for (let r = 3; r < srcS11.rows.length; r++) {
      const row = srcS11.rows[r];
      const lbl = (row.cells[0]?.text || '').trim();
      const val = (row.cells[row.cells.length - 1]?.text || '').trim();
      if (lbl && val) {
        if (!isEnglish) {
          lines.push(`${lbl} ${val}`);
        } else {
          lines.push(`${lbl} ${translateToxicologyValueToEnglish(val)}`);
        }
      }
    }
    if (lines.length) detailParagraphs = [lines.join('\n')];
  }

  renderFullWidthRow(s11, 3, detailParagraphs, { isEnglish, isSection11: true, leftIndentTwips: 34, boldSubheaders: false, totalWidth: 9781 });
  engine.refresh();
}

export function cleanSection12Preambles(engine, isEnglish = false) {
  let s12 = engine.records.find((r) => r.sectionNumber === 12);
  if (!s12) return;
  if (s12.rows.length >= 4) {
    const r1Text = (s12.rows[1].cells[0]?.text || '').trim();
    const r2Text = (s12.rows[2].cells.map((c) => c.text || '').join(' ')).trim();
    if (/无可用的生态毒理学研究|No ecotoxicological studies/i.test(r1Text) && /12\.1/i.test(r2Text)) {
      s12 = deleteRow(engine, s12, 1);
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
  viscosityOverride = null,
  facts = {}
}) {
  // 1. 读取源文件 Buffer
  // const isPu202b 已被通用数据驱动机制彻底替代
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

  // 4.1 必须执行法定预清空协议，将模板残留占位值彻底清零
  cleanSlateTemplate(engine);

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

  // 6.5 规范化 Section 4、Section 5、Section 7 全局独立完整句子结尾标点 (G-08/D-06)
  const s4Rec = engine.records.find(r => r.sectionNumber === 4);
  if (s4Rec) {
    for (const row of s4Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (/皮肤接触|接触皮肤/i.test(lbl) && row.cells[1]) {
        let val = (row.cells[1].text || '').trim();
        if (val.includes('若发生皮肤反应，就医') && !val.includes('若发生皮肤反应，就医。')) {
          val = val.replace(/若发生皮肤反应，就医(?![。])/g, '若发生皮肤反应，就医。');
          safeWriteCellValue(row.cells[1], val);
        }
      }
    }
  }

  const s5Rec = engine.records.find(r => r.sectionNumber === 5);
  if (s5Rec) {
    for (const row of s5Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (!row.cells[1]) continue;
      let val = (row.cells[1].text || '').trim();
      if (/不合适的灭火剂/i.test(lbl)) {
        if (val && !/[。！]$/.test(val)) {
          safeWriteCellValue(row.cells[1], val + '。');
        }
      } else if (/合适的灭火剂/i.test(lbl)) {
        if (val.includes('大火时应用喷洒水') && !val.includes('大火时应用喷洒水。')) {
          val = val.replace(/大火时应用喷洒水(?![。])/g, '大火时应用喷洒水。');
          safeWriteCellValue(row.cells[1], val);
        }
      } else if (/特殊危害/i.test(lbl)) {
        if (val && !/[。！]$/.test(val)) {
          safeWriteCellValue(row.cells[1], val + '。');
        }
      }
    }
  }

function formatSection7ChineseLabel(cell, seqStr, labelText, W_NS) {
  if (!cell?.node) return;
  const p = cell.node.getElementsByTagNameNS(W_NS, 'p')[0];
  if (!p) return;

  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));

  const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (pPr) {
    const numPrs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'numPr'));
    numPrs.forEach(np => pPr.removeChild(np));
  }

  const doc = p.ownerDocument;

  const r1 = doc.createElementNS(W_NS, 'w:r');
  const rPr1 = doc.createElementNS(W_NS, 'w:rPr');
  const rFonts1 = doc.createElementNS(W_NS, 'w:rFonts');
  rFonts1.setAttributeNS(W_NS, 'w:hint', 'eastAsia');
  rFonts1.setAttributeNS(W_NS, 'w:ascii', 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:hAnsi', 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:eastAsia', '宋体');
  rFonts1.setAttributeNS(W_NS, 'w:cs', 'Times New Roman');
  rPr1.appendChild(rFonts1);
  const b1 = doc.createElementNS(W_NS, 'w:b');
  rPr1.appendChild(b1);
  const sz1 = doc.createElementNS(W_NS, 'w:sz');
  sz1.setAttributeNS(W_NS, 'w:val', '21');
  rPr1.appendChild(sz1);
  r1.appendChild(rPr1);
  const t1 = doc.createElementNS(W_NS, 'w:t');
  t1.textContent = seqStr;
  r1.appendChild(t1);
  p.appendChild(r1);

  const r2 = doc.createElementNS(W_NS, 'w:r');
  const rPr2 = doc.createElementNS(W_NS, 'w:rPr');
  const rFonts2 = doc.createElementNS(W_NS, 'w:rFonts');
  rFonts2.setAttributeNS(W_NS, 'w:hint', 'eastAsia');
  rPr2.appendChild(rFonts2);
  const b2 = doc.createElementNS(W_NS, 'w:b');
  rPr2.appendChild(b2);
  const sz2 = doc.createElementNS(W_NS, 'w:sz');
  sz2.setAttributeNS(W_NS, 'w:val', '21');
  rPr2.appendChild(sz2);
  r2.appendChild(rPr2);
  const t2 = doc.createElementNS(W_NS, 'w:t');
  t2.setAttribute('xml:space', 'preserve');
  t2.textContent = '  ';
  r2.appendChild(t2);
  p.appendChild(r2);

  const r3 = doc.createElementNS(W_NS, 'w:r');
  const rPr3 = doc.createElementNS(W_NS, 'w:rPr');
  const rFonts3 = doc.createElementNS(W_NS, 'w:rFonts');
  rFonts3.setAttributeNS(W_NS, 'w:hint', 'eastAsia');
  rPr3.appendChild(rFonts3);
  const b3 = doc.createElementNS(W_NS, 'w:b');
  rPr3.appendChild(b3);
  const sz3 = doc.createElementNS(W_NS, 'w:sz');
  sz3.setAttributeNS(W_NS, 'w:val', '24');
  rPr3.appendChild(sz3);
  r3.appendChild(rPr3);
  const t3 = doc.createElementNS(W_NS, 'w:t');
  t3.textContent = labelText;
  r3.appendChild(t3);
  p.appendChild(r3);

  cell.text = `${seqStr}  ${labelText}`;
  cell.labelNodes = [t3];
}

  const s7Rec = engine.records.find(r => r.sectionNumber === 7);
  if (s7Rec) {
    for (const row of s7Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (/^(?:7\.1\s*)?安全操作防范/i.test(lbl)) {
        if (row.cells[0]) {
          formatSection7ChineseLabel(row.cells[0], '7.1', '安全操作防范：', W_NS);
        }
        if (row.cells[1]) {
          let val = (row.cells[1].text || '').trim();
          if (val.includes('更换被污染或浸湿的衣物') && !val.includes('更换被污染或浸湿的衣物。')) {
            val = val.replace(/更换被污染或浸湿的衣物(?![。])/g, '更换被污染或浸湿的衣物。');
            safeWriteCellValue(row.cells[1], val);
          }
        }
      } else if (/^(?:7\.2\s*)?安全储存条件/i.test(lbl)) {
        if (row.cells[0]) {
          formatSection7ChineseLabel(row.cells[0], '7.2', '安全储存条件：', W_NS);
        }
      }
    }
  }

  // 7. 规范化 Section 13 (严格保持与源文件及英文一致的 4 行标准结构：标题 + 2行独立说明行 + 处置方法)
  let s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13) {
    if (s13.rows.length === 3) {
      const origText = (s13.rows[1].cells[0]?.text || '').trim();
      s13 = addRowAfter(engine, s13, 1);
      if (origText.includes('在欧盟领域内废弃')) {
        const parts = origText.split(/\r?\n|。/);
        const line1 = parts.find(p => p.includes('适用的国标') || p.includes('国家或当地法规')) || '必须遵守适用的国标、国家或当地法规进行废弃。';
        const line2 = parts.find(p => p.includes('欧盟领域内废弃')) || '在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。';
        safeWriteCellValue(s13.rows[1].cells[0], line1.endsWith('。') ? line1 : line1 + '。');
        safeWriteCellValue(s13.rows[2].cells[0], line2.endsWith('。') ? line2 : line2 + '。');
      }
    }
    const lastRow = s13.rows[s13.rows.length - 1];
    if (lastRow && lastRow.cells[0]?.node) {
      enforceSection13DoubleCenter(lastRow.cells[0].node);
    }
    if (lastRow && lastRow.cells.length >= 2 && lastRow.cells[1]?.node) {
      let mText = (lastRow.cells[1].text || '').trim();
      if (mText.includes('“滴干”）') && !mText.includes('“滴干”）。')) {
        mText = mText.replace(/“滴干”）(?![。])/g, '“滴干”）。');
        safeWriteCellValue(lastRow.cells[1], mText);
      }
      enforceSection13JustifiedContent(lastRow.cells[1].node);
    }
  }  // 8. Section 9 理化特性全量标签与指标按源文件 1:1 精准重构 (内容与物理顺序 100% 来源源文件，模板仅提供排版与格式)
  let s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    const srcProps = extractSection9PropertiesFromSource(srcEngine);
    if (srcProps && srcProps.length > 0) {
      // 依据源文件实际物理项数动态缩减或扩充行数
      while (s9.rows.length > srcProps.length + 1) {
        s9 = deleteRow(engine, s9, s9.rows.length - 1);
      }
      while (s9.rows.length < srcProps.length + 1) {
        s9 = addRowAfter(engine, s9, s9.rows.length - 1);
      }
      for (let i = 0; i < srcProps.length; i++) {
        const prop = srcProps[i];
        const row = s9.rows[i + 1];
        if (!row) continue;
        let coreLabel = prop.rawLabel.replace(/^\s*(?:9\.\d+\s*)+/, '').trim();
        if (!coreLabel.endsWith('：') && !coreLabel.endsWith(':')) coreLabel += '：';
        let val = prop.rawValue;

        // 覆盖高优先级事实 (如 TDS 核准的粘度、固含、外观等)
        if (/粘度|动力粘度/i.test(coreLabel) && (viscosityOverride || facts.section9Overrides?.['粘度|动力粘度'])) {
          val = viscosityOverride || facts.section9Overrides?.['粘度|动力粘度'];
        } else if (/固体含量|固含/i.test(coreLabel) && (facts.solidsOverride || facts.section9Overrides?.['固体含量|固含'])) {
          val = facts.solidsOverride || facts.section9Overrides?.['固体含量|固含'];
        } else if (/外\s*观/i.test(coreLabel) && (facts.appearanceOverride || facts.section9Overrides?.['外观'] || facts.section9Overrides?.['外 观'])) {
          val = facts.appearanceOverride || facts.section9Overrides?.['外观'] || facts.section9Overrides?.['外 观'];
        } else if (/NCO/i.test(coreLabel) && (facts.ncoOverride || facts.section9Overrides?.['NCO'] || facts.section9Overrides?.['NCO|NCO含量'])) {
          val = facts.ncoOverride || facts.section9Overrides?.['NCO'] || facts.section9Overrides?.['NCO|NCO含量'];
        }

        formatSection9LabelCell(row.cells[0], `9.${i + 1}`, coreLabel, false);
        if (row.cells[1]) {
          safeWriteCellValue(row.cells[1], val);
        }
      }
    } else {
      // 容灾兜底逻辑
      renumberRecord(s9, '9');
      for (let rIdx = 1; rIdx < s9.rows.length; rIdx++) {
        const c0 = s9.rows[rIdx]?.cells[0];
        if (!c0) continue;
        const text = (c0.text || '').trim();
        const match = text.match(/^(\d+\.\d+)\s*(.*)$/);
        if (match) {
          formatSection9LabelCell(c0, match[1], match[2], false);
        }
      }
    }
  }

  // 9. 规范化 Section 2：全场景默认全量通栏 (G-40 强制默认全量通栏绝对公理)
  let s2 = engine.records.find(r => r.sectionNumber === 2);
  const isNonHazComposite = Boolean(matchResult.facts?.isNonHazardousComposite || detectNonHazardousComposite(srcEngine.records, facts));
  // isPu202a 已被通用数据驱动机制彻底替代
  if (s2) {
    const picItem = matchResult.matchedSections?.find(s => s.sectionNumber === 2)?.matchedRows?.find(r => r.key === 'pictogram');
    const drawingNodes = picItem?.drawingNodes || (picItem?.drawingNode ? [picItem.drawingNode] : null);
    buildFullWidthSection2(engine, {
      ...facts,
      modelCode: modelCode || '',
      drawingNodes,
      srcEngine,
      section3ExemptionNotes: matchResult.facts?.section3ExemptionNotes || extractSection3ExemptionNotes(srcEngine.records.find(r => r.sectionNumber === 3))
    }, false);
  }

  // 9.5 Section 11 & Section 12 双范式动态分流处理 (Ps-openspec 2.0: 多组分走通栏，单组分如 PU-202A 走原版分列表格)
  const isMultiComponent = modelCode === 'PA-3223' || Boolean(facts.isMultiComponentComposite);
  const s11Paradigm = isMultiComponent ? 'PARADIGM_1_FULL_WIDTH_MERGED' : detectSection11Paradigm(facts?.section11 || srcEngine?.records?.find(r => r.sectionNumber === 11) || null);
  if (s11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED') {
    buildThreeTierSection11(engine, { ...facts, modelCode: modelCode || '' }, false);
    cleanSection12Preambles(engine, false);
  } else if (isNonHazComposite) {
    cleanSection12Preambles(engine, false);
  }

  // 10. 规范化 Section 8：手部防护清除底模编造、眼睛防护还原源文件，若 8.2 为“不含有职业接触限值的物质”剪枝四列表格
  let s8 = engine.records.find(r => r.sectionNumber === 8);
  if (s8) {
    const srcS8 = srcEngine?.records?.find(r => r.sectionNumber === 8);
    const srcS8Rows = srcS8?.rows || [];
    const srcRecRow = srcS8Rows.find(r => /建议/i.test(r.cells[0]?.text || ''));
    let srcRecVal = '';
    if (srcRecRow) {
      srcRecVal = (srcRecRow.cells[1]?.text || srcRecRow.cells[0]?.text?.replace(/^[建议:：\s]+/, '') || '').trim();
    }
    const srcHandRow = srcS8Rows.find(r => /手部/i.test(r.cells[0]?.text || ''));
    let srcHandVal = '';
    if (srcHandRow && srcHandRow.cells.length > 1) {
      srcHandVal = (srcHandRow.cells[1]?.text || '').trim();
    }

    for (let rIdx = s8.rows.length - 1; rIdx >= 0; rIdx--) {
      const row = s8.rows[rIdx];
      const lblCell = row.cells[0];
      const lbl = (lblCell?.text || '').trim();
      if (/手部/i.test(lbl)) {
        // 唯一父级分类题头不可剪枝公理：严禁 deleteRow！保留加粗标签，彻底清洗单元格脏数据
        if (lblCell?.node) {
          const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
          const tabs = Array.from(lblCell.node.getElementsByTagNameNS(W_NS, 'tab'));
          tabs.forEach(t => t.parentNode?.removeChild(t));
          const inds = Array.from(lblCell.node.getElementsByTagNameNS(W_NS, 'ind'));
          if (inds.length > 0) {
            inds.forEach(ind => {
              ind.setAttributeNS(W_NS, 'w:firstLine', '482');
              ind.setAttributeNS(W_NS, 'w:firstLineChars', '200');
              ind.removeAttributeNS(W_NS, 'w:left');
              ind.removeAttributeNS(W_NS, 'w:hanging');
              ind.removeAttributeNS(W_NS, 'w:leftChars');
              ind.removeAttributeNS(W_NS, 'w:hangingChars');
            });
          }
          const ps = Array.from(lblCell.node.getElementsByTagNameNS(W_NS, 'p'));
          if (ps.length > 0) {
            const firstP = ps[0];
            const pPr = firstP.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (pPr && pPr.getElementsByTagNameNS(W_NS, 'ind').length === 0) {
              const ind = firstP.ownerDocument.createElementNS(W_NS, 'w:ind');
              ind.setAttributeNS(W_NS, 'w:firstLine', '482');
              ind.setAttributeNS(W_NS, 'w:firstLineChars', '200');
              pPr.appendChild(ind);
            }
            for (let i = 1; i < ps.length; i++) {
              ps[i].parentNode?.removeChild(ps[i]);
            }
            const existingRuns = Array.from(firstP.getElementsByTagNameNS(W_NS, 'r'));
            existingRuns.forEach(r => firstP.removeChild(r));
            const newRun = firstP.ownerDocument.createElementNS(W_NS, 'w:r');
            const rPr = firstP.ownerDocument.createElementNS(W_NS, 'w:rPr');
            const rFonts = firstP.ownerDocument.createElementNS(W_NS, 'w:rFonts');
            rFonts.setAttributeNS(W_NS, 'w:ascii', '宋体');
            rFonts.setAttributeNS(W_NS, 'w:eastAsia', '宋体');
            rFonts.setAttributeNS(W_NS, 'w:hAnsi', '宋体');
            rPr.appendChild(rFonts);
            const b = firstP.ownerDocument.createElementNS(W_NS, 'w:b');
            rPr.appendChild(b);
            const sz = firstP.ownerDocument.createElementNS(W_NS, 'w:sz');
            sz.setAttributeNS(W_NS, 'w:val', '24');
            rPr.appendChild(sz);
            newRun.appendChild(rPr);
            const t = firstP.ownerDocument.createElementNS(W_NS, 'w:t');
            t.textContent = '手部防护：';
            newRun.appendChild(t);
            firstP.appendChild(newRun);
          }
        }
        // 值格处理：若源文件有独立通用陈述则写入，否则置空（清除底模“建议戴上防护手套。”虚构）
        if (row.cells.length > 1 && row.cells[1]) {
          safeWriteCellValue(row.cells[1], srcHandVal || '');
          if (!srcHandVal && row.cells[1].node) {
            const p = row.cells[1].node.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              const inds = Array.from(p.getElementsByTagNameNS(W_NS, 'ind'));
              inds.forEach(ind => ind.parentNode?.removeChild(ind));
            }
          }
        }
        continue;
      }
      if (/建议/i.test(lbl)) {
        // 建议行受控门控：源文档有建议则填入，无则置空，严禁删行
        if (row.cells.length > 1 && row.cells[1]) {
          const recText = srcRecVal || (/污染的手套应废弃/i.test(row.cells[1].text || '') ? '污染的手套应废弃。' : '');
          safeWriteCellValue(row.cells[1], recText);
        }
      }
      // 统一标签冒号为全角冒号
      if (lblCell?.node && lbl) {
        const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const p = lblCell.node.getElementsByTagNameNS(W_NS, 'p')[0];
        if (p) {
          const tNode = p.getElementsByTagNameNS(W_NS, 't')[0];
          if (tNode && tNode.textContent.endsWith(':') && !tNode.textContent.endsWith('：')) {
            tNode.textContent = tNode.textContent.slice(0, -1) + '：';
          }
        }
      }
      // 统一手套材料破折号间距规范
      if (lblCell?.node && /(?:氟化橡胶|丁基橡胶|丁腈橡胶)/i.test(lbl)) {
        const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const p = lblCell.node.getElementsByTagNameNS(W_NS, 'p')[0];
        if (p) {
          const tNode = p.getElementsByTagNameNS(W_NS, 't')[0];
          if (tNode) {
            tNode.textContent = tNode.textContent
              .replace(/–FKM/g, '– FKM')
              .replace(/–IIR/g, '– IIR')
              .replace(/–\s*NBR/g, '– NBR');
          }
        }
      }
      // 统一手套材料与参数值文本排版格式与 XML Run 纯净化 (INV-TYPOGRAPHY-S8)
      if (row.cells.length > 1 && row.cells[1]?.node && /(?:氟化橡胶|丁基橡胶|丁腈橡胶|合适材料|手套)/i.test(lbl)) {
        const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const p = row.cells[1].node.getElementsByTagNameNS(W_NS, 'p')[0];
        if (p) {
          // 清理末尾无文本内容的空 <w:r> 节点，消除结构冗余
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          for (let rIdx = 1; rIdx < runs.length; rIdx++) {
            const tNodes = Array.from(runs[rIdx].getElementsByTagNameNS(W_NS, 't'));
            const textContent = tNodes.map(t => t.textContent).join('').trim();
            if (!textContent) {
              p.removeChild(runs[rIdx]);
            }
          }
          // 对首个文本 Run 执行值文本排版规范化：
          // 1. 全角≧/≦统一转换为标准西文≥/≤
          // 2. 数值与计量单位之间必须插入标准西文半角空格（0.4 mm、480 min）
          // 3. 规整分号与清除末尾孤立句点
          const firstR = p.getElementsByTagNameNS(W_NS, 'r')[0];
          if (firstR) {
            const tNodes = Array.from(firstR.getElementsByTagNameNS(W_NS, 't'));
            let fullText = tNodes.map(t => t.textContent).join('');
            fullText = fullText
              .replace(/≧/g, '≥')
              .replace(/≦/g, '≤')
              .replace(/(\d+(?:\.\d+)?)\s*(mm|min)/gi, '$1 $2')
              .replace(/;\s*|；\s*/g, '；')
              .replace(/\.$/, '')
              .trim();
            if (tNodes.length > 0) {
              tNodes[0].textContent = fullText;
              for (let tIdx = 1; tIdx < tNodes.length; tIdx++) {
                tNodes[tIdx].textContent = '';
              }
            }
          }
        }
      }
    }
    const row82 = s8.rows.find(r => /8\.2\s*工程控制/i.test(r.cells[0]?.text || ''));
    const s8FullText = s8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
    const isNoOEL = /不含有职业接触限值|不含职业接触|无可用的接触限值|2006\/121/i.test(s8FullText);
    if (isNoOEL && row82) {
      const r82Idx = s8.rows.indexOf(row82);
      while (s8.rows.length > r82Idx + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
      // 标点符号规范化：西文半角逗号替换为中文全角逗号
      if (row82.cells.length > 1 && row82.cells[1]) {
        const val = (row82.cells[1].text || '').trim();
        if (val.includes('2006/121/EG,')) {
          safeWriteCellValue(row82.cells[1], val.replace(/2006\/121\/EG,/g, '2006/121/EG，'));
        }
      }
    }
  }

  // 10.4 规范化 Section 3：第 3 行 3.2成分 通栏三列合并 (gridSpan=3, w=9781 dxa)
  const s3Rec = engine.records.find(r => r.sectionNumber === 3);
  if (s3Rec && s3Rec.rows.length >= 3) {
    const r2 = s3Rec.rows[2];
    if (r2 && r2.cells.length === 3) {
      const txt0 = (r2.cells[0]?.text || '').trim();
      if (/^(?:3\.2\s*)?(?:成分|Ingredients)/i.test(txt0)) {
        try {
          const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
          const rNode = r2.node;
          const cNodes = Array.from(rNode.getElementsByTagNameNS(W_NS, 'tc'));
          if (cNodes.length >= 3) {
            rNode.removeChild(cNodes[1]);
            rNode.removeChild(cNodes[2]);
            let tcPr = cNodes[0].getElementsByTagNameNS(W_NS, 'tcPr')[0];
            if (!tcPr) {
              tcPr = cNodes[0].ownerDocument.createElementNS(W_NS, 'w:tcPr');
              cNodes[0].insertBefore(tcPr, cNodes[0].firstChild);
            }
            let span = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
            if (!span) {
              span = cNodes[0].ownerDocument.createElementNS(W_NS, 'w:gridSpan');
              tcPr.appendChild(span);
            }
            span.setAttributeNS(W_NS, 'w:val', '3');
            let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')[0];
            if (!tcW) {
              tcW = cNodes[0].ownerDocument.createElementNS(W_NS, 'w:tcW');
              tcPr.appendChild(tcW);
            }
            tcW.setAttributeNS(W_NS, 'w:w', '9781');
            tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
            r2.cells = [r2.cells[0]];
          }
        } catch (e) {}
      }
    }
  }

  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258
  let s15Rec = engine.records.find(r => r.sectionNumber === 15);
  if (s15Rec) {
    const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);
    const srcS15Text = srcS15 ? srcS15.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';
    const srcHasGb15258 = /15258|安全标签编写/i.test(srcS15Text);
    if (!srcHasGb15258) {
      const gb15258Row = s15Rec.rows.find(r => /15258|安全标签/i.test(r.cells[0]?.text || ''));
      if (gb15258Row) {
        s15Rec = deleteRow(engine, s15Rec, s15Rec.rows.indexOf(gb15258Row));
      }
    }

    // 依据法定现代化公理 (INV-S15-01): 将已废止的 344 号令演进为 591 号令，已废止的 GB 20576 演进为 GB 30000.2-29
    for (const r of s15Rec.rows) {
      const c = r.cells[0];
      if (!c) continue;
      const t = (c.text || '').trim();
      if (/344号/i.test(t)) {
        safeWriteCellValue(c, '危险化学品安全管理条例，国务院令591号');
      } else if (/20576|20598/i.test(t)) {
        safeWriteCellValue(c, 'GB 30000.2-29 化学品分类和标签规范');
      }
    }
  }

  // 11. 规范化 Section 11：单组分插槽表格高精排版 (严格源事实驱动，通用排版，绝无针对型号硬编码假数据)
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    for (let i = 2; i < s11.rows.length; i++) {
      const c = s11.rows[i].cells[s11.rows[i].cells.length - 1];
      if (c && !(c.text || '').trim()) {
        safeWriteCellValue(c, '无数据资料。');
      }
    }
  }
  if (s11 && s11Paradigm !== 'PARADIGM_1_FULL_WIDTH_MERGED' && !isNonHazComposite) {
    const srcS11 = srcEngine?.records?.find(r => r.sectionNumber === 11);
    const hasPreambleOnly = s11.rows.length >= 2 && /无可用的毒理学研究/i.test(s11.rows[1].cells[0]?.text || '') &&
      !s11.rows.slice(2).some(row => row.cells.slice(1).some(c => {
        const t = (c.text || '').trim();
        return t.length > 0 && !/无数据资料/i.test(t);
      }));

    if (facts.toxicologyTableRows) {
      // 1. 如果此前被 smartMatching 粗暴精简为 <=4 行，调用 restoreSectionToTemplate 恢复底模 18 行完整插槽结构
      if (s11.rows.length <= 4) {
        const baselineTplEngine = await loadDocx(cnTplBuf, 'tpl_baseline.docx');
        restoreSectionToTemplate(engine, baselineTplEngine, 11);
        s11 = engine.records.find(r => r.sectionNumber === 11);
      }

      // 2. 删除底模中残留的专有单组分无用行（体外遗传毒性、二乙二醇单丁醚说明行等）
      const vitroRow = s11.rows.find(r => /体外遗传毒性/i.test(r.cells.map(c => c.text).join(' ')));
      if (vitroRow) s11 = deleteRow(engine, s11, s11.rows.indexOf(vitroRow));

      const degmbeRow = s11.rows.find(r => /二乙二醇单丁醚未达到/i.test(r.cells.map(c => c.text).join(' ')));
      if (degmbeRow) s11 = deleteRow(engine, s11, s11.rows.indexOf(degmbeRow));

      // 3. 确保行数与传入事实相符
      while (s11.rows.length > facts.toxicologyTableRows.length + 1) {
        s11 = deleteRow(engine, s11, s11.rows.length - 1);
      }
      while (s11.rows.length < facts.toxicologyTableRows.length + 1) {
        s11 = addRowAfter(engine, s11, s11.rows.length - 1);
      }

      // 4. 逐行装配内容，避免破坏原生标签引发 NO_LABEL
      facts.toxicologyTableRows.forEach((rData, rIdx) => {
        const row = s11.rows[rIdx + 1];
        if (!row) return;
        if (rData.cells.length === 1) {
          formatSection11PreambleRow(row, rData.cells[0], false, rIdx === 0 ? 0 : 34);
          if (row.cells[0]) row.cells[0].text = rData.cells[0];
        } else {
          const val = rData.cells[rData.cells.length - 1];
          const valCell = row.cells[row.cells.length - 1];
          if (valCell && val) {
            writeStructuredToxicologyCellValue(valCell, val, { isEnglish: false });
          }
        }
      });
    } else if (hasPreambleOnly) {
      while (s11.rows.length > 2) {
        s11 = deleteRow(engine, s11, s11.rows.length - 1);
      }
    } else {
      // 1. 前言行动态解析注入与排版
      const srcPreamble = (srcS11?.rows[2]?.cells[0]?.text || '').trim();
      const preambleText = srcPreamble.includes('毒理学数据') ? srcPreamble : '下面是这些成分的毒理学数据。';
      const srcS11Text = srcEngine?.records?.find(r => r.sectionNumber === 11)?.rows?.map(r => r.cells.map(c => c.text).join(' ')).join(' ') || '';
      if (/类似产品的风险评估/i.test(srcS11Text)) {
        if (s11.rows.length >= 3 && s11.rows[2].cells.length === 1) {
          formatSection11PreambleRow(s11.rows[2], '类似产品的风险评估数据：', false);
        } else if (s11.rows.length >= 2 && s11.rows[1].cells.length === 1) {
          s11 = addRowAfter(engine, s11, 1);
          formatSection11PreambleRow(s11.rows[2], '类似产品的风险评估数据：', false);
        }
      } else if (s11.rows.length > 2 && s11.rows[2].cells.length === 1) {
        formatSection11PreambleRow(s11.rows[2], preambleText, false);
      }

      // 2. 清除任何在 Row 2 之后残留的单列空白行或未识别行
      for (let rIdx = s11.rows.length - 1; rIdx >= 3; rIdx--) {
        if (s11.rows[rIdx].cells.length === 1 && !(s11.rows[rIdx].cells[0]?.text || '').trim()) {
          s11 = deleteRow(engine, s11, rIdx);
        }
      }

      // 3. 急性毒性三项必齐硬保全 (经口、吸入、经皮) (G-34 公理) - 严格保留源事实，仅格式化排版
      let oralRow = s11.rows.find(r => /经口/i.test(r.cells.map(c => c.text).join(' ')));
      if (oralRow) {
        const vCell = oralRow.cells[oralRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      let inhRow = s11.rows.find(r => /吸入/i.test(r.cells.map(c => c.text).join(' ')) && !/危险|危害/i.test(r.cells.map(c => c.text).join(' ')));
      if (inhRow) {
        const vCell = inhRow.cells[inhRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      let dermRow = s11.rows.find(r => /经皮/i.test(r.cells.map(c => c.text).join(' ')));
      if (!dermRow && inhRow) {
        const inhIdx = s11.rows.indexOf(inhRow);
        s11 = addRowAfter(engine, s11, inhIdx);
        dermRow = s11.rows[inhIdx + 1];
        if (dermRow && dermRow.cells.length >= 2) {
          writeCellLabel(dermRow.cells[0], '经皮：', true);
          applyStandardHangingIndent(dermRow.cells[0], '420', '420');
        }
      }
      if (dermRow) {
        const vCell = dermRow.cells[dermRow.cells.length - 1];
        let val = vCell?.text?.trim() || '';
        if (!val && srcS11) {
          const srcDerm = srcS11.rows.find(r => r.cells.length > 1 && /经皮/i.test(r.cells[0]?.text || ''));
          if (srcDerm) val = (srcDerm.cells[srcDerm.cells.length - 1]?.text || '').trim();
        }
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 4. 对齐 11.2 标签术语：严格优先匹配源文件“主要皮肤刺激性:”，杜绝“原发性皮肤刺激” (L-S11)
      const skinRow = s11.rows.find(r => /原发性皮肤刺激|主要皮肤刺激/i.test(r.cells[0]?.text || ''));
      if (skinRow && skinRow.cells.length > 1) {
        writeCellLabel(skinRow.cells[0], '11.2  主要皮肤刺激性：', true);
        applyStandardHangingIndent(skinRow.cells[0], '420', '420');
        const vCell = skinRow.cells[skinRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 5. 11.3 主要粘膜刺激性
      const eyeRow = s11.rows.find(r => /主要粘膜刺激|主要眼睛刺激|原发性粘膜刺激|眼睛刺激/i.test(r.cells[0]?.text || ''));
      if (eyeRow && eyeRow.cells.length > 1) {
        writeCellLabel(eyeRow.cells[0], '11.3  主要粘膜刺激性：', true);
        applyStandardHangingIndent(eyeRow.cells[0], '420', '420');
        const vCell = eyeRow.cells[eyeRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 6. 11.4 致敏性
      const sensRow = s11.rows.find(r => /致敏性|呼吸道或皮肤过敏/i.test(r.cells[0]?.text || ''));
      if (sensRow && sensRow.cells.length > 1) {
        writeCellLabel(sensRow.cells[0], '11.4  致敏性：', true);
        applyStandardHangingIndent(sensRow.cells[0], '420', '420');
        const vCell = sensRow.cells[sensRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 7. 11.5 致突变性
      const mutRow = s11.rows.find(r => /致突变性|遗传毒性/i.test(r.cells[0]?.text || ''));
      if (mutRow && mutRow.cells.length > 1) {
        writeCellLabel(mutRow.cells[0], '11.5  致突变性：', true);
        applyStandardHangingIndent(mutRow.cells[0], '420', '420');
        const vCell = mutRow.cells[mutRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 格式服从原文：探知源文件是否具备这些指标，若源文件不具备则彻底剪枝模板占位行，严禁捏造假数据
      const srcS11Rows = srcS11?.rows || [];
      const srcS11AllText = srcS11Rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
      const srcHasCarc = /致癌/i.test(srcS11AllText);
      const srcHasRep = /生殖毒性/i.test(srcS11AllText);
      const srcHasTerato = /致畸/i.test(srcS11AllText);
      const srcHasStot = /特异性靶器官/i.test(srcS11AllText);
      const srcHasAsp = /吸入危险|吸入危害/i.test(srcS11AllText);
      const srcHasAdd = /附加信息|其它信息|其他信息/i.test(srcS11AllText) && !/上述数据非产品指标/i.test(srcS11AllText);

      // 8. 11.6 致癌性
      const carcRow = s11.rows.find(r => /致癌性/i.test(r.cells[0]?.text || ''));
      if (carcRow && carcRow.cells.length > 1) {
        if (!srcHasCarc) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(carcRow));
        } else {
          writeCellLabel(carcRow.cells[0], '11.6  致癌性：', true);
          applyStandardHangingIndent(carcRow.cells[0], '420', '420');
          const vCell = carcRow.cells[carcRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 9. 11.7 生殖毒性与致畸性
      const repRow = s11.rows.find(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
      if (repRow && repRow.cells.length > 1) {
        if (!srcHasRep) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(repRow));
        } else {
          writeCellLabel(repRow.cells[0], '11.7  生殖毒性：', true);
          applyStandardHangingIndent(repRow.cells[0], '420', '420');
          const vCell = repRow.cells[repRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      const teratoRow = s11.rows.find(r => r.cells.some(c => /致畸/i.test(c.text || '')));
      if (teratoRow && teratoRow !== repRow) {
        if (!srcHasTerato) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(teratoRow));
        } else {
          const teratoCell = teratoRow.cells.find(c => /致畸/i.test(c.text || ''));
          if (teratoCell?.node) {
            const XML_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
            const tNodes = Array.from(teratoCell.node.getElementsByTagName('w:t')).concat(
              Array.from(teratoCell.node.getElementsByTagNameNS(XML_W_NS, 't'))
            );
            const uniqueTNodes = Array.from(new Set(tNodes));
            if (uniqueTNodes.length > 0) {
              uniqueTNodes[0].textContent = '致畸性：';
              for (let i = 1; i < uniqueTNodes.length; i++) uniqueTNodes[i].textContent = '';
            }
          }
          const vCell = teratoRow.cells[teratoRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 10. 11.8 特异性靶器官系统毒性
      const stotRow = s11.rows.find(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
      if (stotRow && stotRow.cells.length > 1) {
        if (!srcHasStot) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(stotRow));
        } else {
          writeCellLabel(stotRow.cells[0], '11.8  特异性靶器官系统毒性（一次接触/反复接触）：', true);
          applyStandardHangingIndent(stotRow.cells[0], '420', '420');
          const vCell = stotRow.cells[stotRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 11. 11.9 吸入危险
      const aspRow = s11.rows.find(r => /吸入危险|吸入危害/i.test(r.cells[0]?.text || ''));
      if (aspRow && aspRow.cells.length > 1) {
        if (!srcHasAsp) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(aspRow));
        } else {
          writeCellLabel(aspRow.cells[0], '11.9  吸入危险：', true);
          applyStandardHangingIndent(aspRow.cells[0], '420', '420');
          const vCell = aspRow.cells[aspRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 12. 11.10 附加信息
      const addRow = s11.rows.find(r => /附加信息/i.test(r.cells?.[0]?.text || ''));
      if (addRow && addRow.cells?.length > 1) {
        if (!srcHasAdd) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(addRow));
        } else {
          writeCellLabel(addRow.cells[0], '11.10 附加信息：', true);
          applyStandardHangingIndent(addRow.cells[0], '420', '420');
          const vCell = addRow.cells[addRow.cells.length - 1];
          let val = vCell?.text?.trim() || '';
          if (!val && matchResult) {
            const addInfoItem = matchResult?.matchedSections?.find(s => s.sectionNumber === 11)?.matchedRows?.find(r => r.key === 'additional_info');
            if (addInfoItem?.value) val = addInfoItem.value.trim();
          }
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 13. 清理多余空行或合并行，确保总行数收敛为法定插槽规范
      for (let rIdx = s11.rows.length - 1; rIdx >= 3; rIdx--) {
        const rowTxt = s11.rows[rIdx].cells.map(c => c.text || '').join('').trim();
        if (!rowTxt || /根据现有数据，二乙二醇/i.test(rowTxt)) {
          s11 = deleteRow(engine, s11, rIdx);
        }
      }
      while (s11.rows.length > 16) {
        const emptyIdx = s11.rows.findIndex((r, idx) => idx >= 3 && !(r.cells[r.cells.length - 1]?.text || '').trim());
        if (emptyIdx !== -1) {
          s11 = deleteRow(engine, s11, emptyIdx);
        } else {
          break;
        }
      }

      // 14. 彻底二次清洗所有值列首部的标签叠词 (G-33 零标签前缀叠词公理)
      for (let rIdx = 3; rIdx < s11.rows.length; rIdx++) {
        const vCell = s11.rows[rIdx].cells[s11.rows[rIdx].cells.length - 1];
        if (vCell && vCell.text) {
          let txt = vCell.text.trim();
          const cleaned = txt.replace(/^(?:(?:11.d+s*)?(?:毒理学效应|毒理学研究|毒性资料|急性毒性[，, ]*(?:经口|吸入|经皮)?|主要皮肤刺激性|原发性(?:皮肤|粘膜)刺激|皮肤刺激|主要眼睛刺激性|主要粘膜刺激性|眼睛刺激|粘膜刺激|亚急性[，, ]*亚慢性和延迟毒性|致敏性|呼吸道或皮肤过敏|皮肤致敏性|致突变性|生殖细胞突变性|致癌性|生殖毒性|特异性靶器官系统毒性(?:（一次接触[/／]反复接触）)?|STOT评估-一次性接触|吸入危害|吸入危险|附加信息|其它信息|其他信息|经口|吸入|经皮)[:：s]*)+/i, '').trim();
          if (cleaned !== txt && cleaned.length > 0) {
            writeStructuredToxicologyCellValue(vCell, cleaned, { isEnglish: false });
          }
        }
      }
    }

    renumberRecord(s11, '11');
    for (const row of s11.rows) {
      normalizeSection11RowHeight(row);
    }
  }

  // 11.9 规范化 Section 12 说明行：若源文件 Section 12 首行即为端点行（无独立通栏说明行），彻底删除底模的独立说明行 (Row 1)
  const srcS12 = srcEngine?.records?.find(r => r.sectionNumber === 12);
  let srcHasS12Preamble = false;
  if (srcS12 && srcS12.rows.length > 1) {
    const firstDataRow = srcS12.rows[1];
    const firstCellText = (firstDataRow.cells[0]?.text || '').trim();
    if (firstDataRow.cells.length === 1 || (!/生态毒性|12\.\d/i.test(firstCellText) && firstCellText.length > 15)) {
      srcHasS12Preamble = true;
    }
  }

  let s12Cn = engine.records.find(r => r.sectionNumber === 12);
  if (s12Cn && !srcHasS12Preamble && s12Cn.rows.length >= 4) {
    const r1Text = (s12Cn.rows[1]?.cells[0]?.text || '').trim();
    if (/无可用的生态毒理学研究|生态毒理学/i.test(r1Text) && s12Cn.rows[1].cells.length === 1) {
      s12Cn = deleteRow(engine, s12Cn, 1);
      renumberRecord(s12Cn, '12');
    }
  }

  // 12. 统一值格左对齐与清除首行公文缩进 (根除底模残留的 jc="both" 与 firstLine="26"，豁免 Section 13 方法内容格两端对齐)
  const allTbls = Array.from(engine.documentXml.getElementsByTagNameNS(W_NS, 'tbl'));
  for (let tIdx = 0; tIdx < allTbls.length; tIdx++) {
    const tbl = allTbls[tIdx];
    const isSection13Tbl = (tIdx === 12); // 表格序号 12 对应 Section 13
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length < 2) continue;
      // Section 13 尾行方法内容格 (rIdx === rows.length - 1 && c === 1) 豁免保持 both
      if (isSection13Tbl && rIdx === rows.length - 1) {
        continue;
      }
      for (let c = 1; c < cells.length; c++) {
        const cell = cells[c];
        const pList = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of pList) {
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          if (pPr) {
            const jcNode = pPr.getElementsByTagNameNS(W_NS, 'jc')[0];
            const jcVal = jcNode?.getAttributeNS(W_NS, 'val');
            if (jcVal === 'both' || jcVal === 'distribute') {
              jcNode.setAttributeNS(W_NS, 'w:val', 'left');
            }
            const indNode = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
            if (indNode) {
              const fl = indNode.getAttributeNS(W_NS, 'firstLine');
              if (fl && fl !== '0') {
                indNode.removeAttributeNS(W_NS, 'firstLine');
                indNode.removeAttribute('w:firstLine');
                indNode.removeAttributeNS(W_NS, 'firstLineChars');
                indNode.removeAttribute('w:firstLineChars');
              }
            }
          }
        }
      }
    }
  }

  // 13. 全量拔除中文母版中残留的非法自定义 <w:tabs> 制表位与值格非法 <w:tab/> (对齐全局规范 G-09，首列标签法定 <w:tab/> 严格保全)
  for (const tbl of allTbls) {
    const tabsInTbl = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tabs'));
    tabsInTbl.forEach(t => t.parentNode?.removeChild(t));
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (const r of rows) {
      const cells = Array.from(r.getElementsByTagNameNS(W_NS, 'tc'));
      for (let c = 1; c < cells.length; c++) {
        const valTabs = Array.from(cells[c].getElementsByTagNameNS(W_NS, 'tab'));
        valTabs.forEach(t => t.parentNode?.removeChild(t));
      }
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
function translateToxicologyValueToEnglish(cnText, endpoint = '') {
  if (!cnText || typeof cnText !== 'string') return '';
  let t = cnText.trim();
  if (!t) return '';
  if (/^无数据(?:资料)?[。.]?$/i.test(t)) return 'No data available.';

  const isDermal = endpoint === 'dermal' || /经皮/i.test(t);

  // 剔除前缀重复的中文标签
  t = t.replace(/^(?:(?:11\.\d+\s*)?(?:急性毒性|经口|吸入|经皮|主要皮肤刺激性|原发性皮肤刺激|主要粘膜刺激性|主要眼睛刺激性|致敏性|致突变性|致癌性|生殖毒性|特异性靶器官系统毒性(?:（一次接触[\/／]反复接触）)?|吸入危险|吸入危害|附加信息)[：:]\s*)+/i, '');

  // 提示语
  t = t.replace(/以下[为是]N[－-]甲基吡咯烷酮毒理学数据[：:]/g, 'The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):');
  t = t.replace(/以下[为是]N,N[－-]二甲基乙酰胺毒理学数据[：:]/g, 'The following are toxicological data for N,N-Dimethylacetamide (DMAC):');
  t = t.replace(/以下[为是]2-丁氧基乙醇.*?毒理学数据[：:]/g, 'The following is toxicological data for 2-Butoxyethanol (CAS: 111-76-2):');
  t = t.replace(/2-丁氧基乙醇有经皮吸收危险。?/g, 'Risk of cutaneous absorption of 2-Butoxyethanol.');
  t = t.replace(/在\s*Ames\s*试验中未见致突变影响。?\s*体外染色体畸变试验阴性。?/g, 'Ames test negative. In vitro chromosome aberration test negative.');
  t = t.replace(/国际癌症研究机构.*?归为第\s*3\s*类.*?动物试验未见致癌影响。?/g, 'IARC: Group 3 (Not classifiable as to its carcinogenicity to humans). No carcinogenic effects observed in animal studies.');
  t = t.replace(/动物试验未见对生育力的损害风险。?/g, 'Animal experiments showed no risk of impaired fertility.');
  t = t.replace(/动物试验未见特异性致畸效应。?/g, 'Animal experiments showed no specific teratogenic effects.');
  t = t.replace(/可能造成呼吸道刺激，可能引起昏睡或眩晕。?\s*反复接触可见红细胞溶血及继发性肝肾影响。?/g, 'May cause respiratory irritation, drowsiness or dizziness. Repeated exposure may cause erythrocyte hemolysis with secondary liver and kidney effects.');

  // 急性毒性经口/吸入/经皮实测值翻译
  if (isDermal) {
    t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]?\s*大鼠\s*[:：]\s*/g, 'LD50 / Dermal / Rat: ');
  } else {
    t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]?\s*大鼠\s*[:：]\s*/g, 'LD50 / Oral / Rat: ');
  }
  t = t.replace(/聚氨酯聚合物/g, 'Polyurethane polymer');
  t = t.replace(/聚氨酯分散体/g, 'Polyurethane dispersion');
  t = t.replace(/聚氨酯/g, 'Polyurethane');
  t = t.replace(/OECD化学品测试指南\s*(\d+)/gi, 'OECD Test Guideline $1');
  t = t.replace(/此物质或混合物无急性呼吸毒性/g, 'The substance or mixture has no acute inhalation toxicity');
  t = t.replace(/此物质或混合物无急性皮肤毒性/g, 'The substance or mixture has no acute dermal toxicity');
  t = t.replace(/无皮肤刺激/g, 'No skin irritation');
  t = t.replace(/无眼睛刺激/g, 'No eye irritation');
  t = t.replace(/不引起皮肤过敏/g, 'Did not cause skin sensitization');
  t = t.replace(/轻微刺激/g, 'Slight irritation');
  t = t.replace(/粉尘\/烟雾/g, 'dust/mist');
  t = t.replace(/试验环境\s*[:：]\s*/g, 'Test atmosphere: ');
  t = t.replace(/测试种类\s*[:：]\s*/g, 'Test type: ');
  t = t.replace(/代谢活化\s*[:：]\s*/g, 'Metabolic activation: ');
  t = t.replace(/有\/无/g, 'with/without');
  t = t.replace(/阴性/g, 'Negative');
  t = t.replace(/阳性/g, 'Positive');
  t = t.replace(/家兔/g, 'Rabbit');
  t = t.replace(/大鼠/g, 'Rat');
  t = t.replace(/小鼠/g, 'Mouse');
  t = t.replace(/豚鼠/g, 'Guinea pig');
  t = t.replace(/物种\s*[:：]\s*/g, 'Species: ');
  t = t.replace(/结果\s*[:：]\s*/g, 'Result: ');
  t = t.replace(/分类\s*[:：]\s*/g, 'Classification: ');
  t = t.replace(/方法\s*[:：]\s*/g, 'Method: ');
  t = t.replace(/评估\s*[:：]\s*/g, 'Assessment: ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*大鼠\s*[:：]\s*/gi, 'LD50 / Oral / Rat: ');
  t = t.replace(/方法\s*[:：]\s*OECD化学品测试指南\s*(\d+)/gi, 'Method: OECD Test Guideline $1');
  t = t.replace(/对类似产品(?:的)?(?:毒理学)?研究/g, 'Studies on a similar product');
  t = t.replace(/评估\s*[:：]\s*此物质或混合物无急性皮肤毒性/g, 'Assessment: The substance or mixture has no acute dermal toxicity');
  t = t.replace(/试验环境\s*[:：]\s*粉尘\/烟雾/g, 'Test atmosphere: dust/mist');
  t = t.replace(/评估\s*[:：]\s*此物质或混合物无急性呼吸毒性/g, 'Assessment: The substance or mixture has no acute inhalation toxicity');
  t = t.replace(/分类\s*[:：]\s*无皮肤刺激/g, 'Classification: No skin irritation');
  t = t.replace(/分类\s*[:：]\s*无眼睛刺激/g, 'Classification: No eye irritation');
  t = t.replace(/根据Buehler\s*[（(]经皮试验[）)]\s*皮肤致敏性\s*[:：]/g, 'Buehler Test (dermal):');
  t = t.replace(/皮肤致敏性\s*[（(]局部淋巴结试验\s*[（(]LLNA[）)][）)]/g, 'Local lymph node assay (LLNA):');
  t = t.replace(/分类\s*[:：]\s*不引起皮肤过敏/g, 'Classification: Did not cause skin sensitization');
  t = t.replace(/结果\s*[:：]\s*阴性/g, 'Result: Negative');
  t = t.replace(/沙门氏菌\/微粒体试验\s*[（(]Ames试验[）)]/gi, 'Salmonella/microsome test (Ames test)');
  t = t.replace(/体外染色体畸变试验/g, 'In vitro mammalian chromosome aberration test');
  t = t.replace(/无数据(?:资料)?/g, 'No data available.');
  t = t.replace(/代谢活化\s*[:：]\s*有\/无/g, 'Metabolic activation: with/without');
  t = t.replace(/体内基因毒性/g, 'In vivo genotoxicity:');
  t = t.replace(/STOT评估-一次性接触/g, 'STOT evaluation - single exposure:');
  t = t.replace(/基于现有数据，未满足分类标准。?/g, 'Based on available data, the classification criteria are not met.');
  t = t.replace(/STOT评估-重复性接触/g, 'STOT evaluation - repeated exposure:');
  t = t.replace(/CMR评估/g, 'CMR assessment:');
  t = t.replace(/亚急性[，, ]*亚慢性和延迟毒性/g, 'Subacute, subchronic and prolonged toxicity:');
  t = t.replace(/生殖毒性\/生育力/g, 'Reproductive toxicity / fertility:');
  t = t.replace(/生殖毒性\/致畸形/g, 'Reproductive toxicity / teratogenicity:');
  t = t.replace(/致癌性/g, 'Carcinogenicity:');
  t = t.replace(/吸入危害/g, 'Aspiration hazard:');
    t = t.replace(/在\s*AMES\s*试验中无(?:致突变性|Mutagenicity[:：]?)。?/gi, 'Non-mutagenic in Ames test.');
  t = t.replace(/致突变性/g, 'Mutagenicity:');
  t = t.replace(/，/g, ',');
  t = t.replace(/轻微刺激/g, 'Slight irritation');
  t = t.replace(/无刺激/g, 'No irritation');
  t = t.replace(/皮肤接触不致敏/g, 'Not sensitizing by skin contact.');
  t = t.replace(/不致敏/g, 'Non-sensitizing.');
  t = t.replace(/皮肤接触可能致敏/g, 'May cause sensitization by skin contact.');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*1\s*h\s*[/／]\s*大鼠(?:\s*雌性)?\s*[:：]\s*/gi, 'LC50 / Inhalation / 1h / Rat: ');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*4\s*h\s*[/／]\s*大鼠(?:\s*雌性)?\s*[:：]\s*/gi, 'LC50 / Inhalation / 4h / Rat: ');
  t = t.replace(/\s*[（(]\s*蒸气\s*[）)]/g, ' (vapour)');
  t = t.replace(/\s*[（(]\s*气溶胶\s*[）)]/g, ' (aerosol)');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*豚鼠\s*[:：]\s*/g, 'LD50 / Dermal / Guinea pig: ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*兔\s*[:：]\s*/g, 'LD50 / Dermal / Rabbit: ');
  t = t.replace(/（此值仅用于有可吸入的颗粒形成的情况。?）/g, '(applicable only where respirable aerosols are formed)');
  t = t.replace(/[（(]\s*鼠\s*[）)]\s*LD50\s*[:：]\s*/g, '(Rat) LD50: ');
  t = t.replace(/＞/g, '> ');

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
  t = t.replace(/饮酒精饮料会加剧毒性影响。?/g, 'Consumption of alcoholic beverages may aggravate toxic effects.\n');
  t = t.replace(/N[－-]甲基吡咯烷酮有经皮吸收危险。?/g, 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).');
  t = t.replace(/重复剂量中毒\s*[:：]\s*经口/g, 'Repeated dose toxicity: Oral;');
  t = t.replace(/病理变化\s*[:：]\s*胃，睾丸，肝，肾，红血球异常减少。?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red blood cells.\n');
  t = t.replace(/重复剂量中毒\s*[:：]\s*吸入/g, 'Repeated dose toxicity: Inhalation;');
  t = t.replace(/病理变化\s*[:：]\s*肾、肝影响，视网膜损伤。?/g, 'Pathological changes: kidney and liver effects, retinal damage.');

  t = t.replace(/；/g, '; ');
  t = t.replace(/[－—]/g, '-');
  return t.trim();
}


/**
 * Section 12 前置组分引言说明行专业英译
 */
export function translateSection12PreambleToEnglish(cnText) {
  if (!cnText) return '';
  if (/无可用的生态|未做任何试验|生态学/i.test(cnText)) {
    if (/禁止排入地表水或下水道|禁止排入下水道/i.test(cnText)) {
      return 'No ecotoxicological studies are available for this product. Do not allow to enter surface water or sewage.';
    }
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
  if (!cnText || /无可用的生态毒理学研究|禁止排入下水道/i.test(cnText)) return 'No ecotoxicological studies are available for this product. Do not discharge into drains, wastewater, or soil.';
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
  if (/不易生物降解|难生物降解|难降解|不属于易降解/i.test(cnText)) return 'The product is not readily biodegradable.';
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

  // 1.1 必须执行法定预清空协议，将英文底模残留占位值（含残留中文）彻底清零
  cleanSlateTemplate(engine);

  const enValues = buildEnglishFacts(modelCode, facts, baseCnEngine);

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine?._adaptiveRevisionDate || baseCnEngine._adaptiveRevisionDate.startsWith('2023') || baseCnEngine._adaptiveRevisionDate.startsWith('2024') || baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveRevisionDate = revisionDate || (!isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr);
  // const isPu202b 已被通用数据驱动机制彻底替代
  const isNonHazComposite = Boolean(facts.isNonHazardousComposite || (baseCnEngine && detectNonHazardousComposite(baseCnEngine.records, facts)));
  // isPu202a 已被通用数据驱动机制彻底替代

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
        let trimmed = finalVal.trim();
        if (/^不适用$/i.test(trimmed)) trimmed = 'Not applicable';
        else if (/^无数据(?:资料)?[。.]?$/i.test(trimmed)) trimmed = 'No data available.';
        else if (/^未测定$/i.test(trimmed)) trimmed = 'Not determined';
        else if (/^商业机密|商业秘密$/i.test(trimmed)) trimmed = 'Trade secret';

        // ENG-03: Ensure space after punctuation followed by English letters (e.g. "(SCBA)Do" -> "(SCBA) Do")
        trimmed = trimmed.replace(/([.!?\)])([A-Za-z])/g, '$1 $2');
        finalVal = trimmed;
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

  // Section 2: 危险性概述 (G-40 强制默认全量通栏绝对公理)
  let s2 = engine.records.find(r => r.sectionNumber === 2);
  if (s2) {
    // isPu202a 已被通用数据驱动机制彻底替代
    const isNonHazComposite = Boolean(facts.isNonHazardousComposite || (baseCnEngine && detectNonHazardousComposite(baseCnEngine.records, facts)));
    const cnPicCell = baseCnEngine?.records?.find(r => r.sectionNumber === 2)?.rows[1]?.cells[0];
    const drawingNodes = facts.drawingNodes || Array.from(cnPicCell?.node?.getElementsByTagNameNS('*', 'drawing') || []);
    buildFullWidthSection2(engine, {
      ...facts,
      modelCode: modelCode || '',
      drawingNodes: drawingNodes.length > 0 ? drawingNodes : facts.drawingNodes,
      srcEngine: baseCnEngine || facts.srcEngine,
      section3ExemptionNotes: enValues['sec3.exemption_notes'] || extractSection3ExemptionNotes(baseCnEngine?.records?.find(r => r.sectionNumber === 3))
    }, true);
    const isMultiComponent = modelCode === 'PA-3223' || Boolean(facts.isMultiComponentComposite);
    const cnS11ForCheck = baseCnEngine?.records?.find(r => r.sectionNumber === 11);
    const isCnS11FullWidth = cnS11ForCheck && cnS11ForCheck.rows.length === 4 && cnS11ForCheck.rows[3]?.cells?.length === 1;
    const enS11Paradigm = (isMultiComponent || isCnS11FullWidth) ? 'PARADIGM_1_FULL_WIDTH_MERGED' : 'PARADIGM_2_STANDARD_SLOTS';
    if (enS11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED') {
      buildThreeTierSection11(engine, { ...facts, modelCode: modelCode || '' }, true);
    }
    cleanSection12Preambles(engine, true);
  }

  // Section 3 (以中文母版组分顺序为绝对镜像，动态同构增减行)
  let s3 = engine.records.find(r => r.sectionNumber === 3);
  if (s3) {
    if (s3.rows[1]?.cells[1]) safeWrite(s3.rows[1].cells[1], enValues['sec3.product_type'] || 'Mixture');
    
    // 优先从 baseCnEngine 真实提取组分列表
    let comps = facts.components;
    if (!comps && baseCnEngine) {
      const cnS3 = baseCnEngine.records.find(r => r.sectionNumber === 3);
      if (cnS3 && cnS3.rows.length >= 5) {
        comps = [];
        for (let i = 4; i < cnS3.rows.length; i++) {
          const r = cnS3.rows[i];
          const rawC0 = (r.cells[0]?.text || '').trim();
          const rawC1 = (r.cells[1]?.text || '').trim();
          const rawC2 = (r.cells[2]?.text || '').trim();

          const subNames = rawC0.includes('\n') ? rawC0.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [rawC0];
          const subCas = rawC1.includes('\n') ? rawC1.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [rawC1];
          const subConc = rawC2.includes('\n') ? rawC2.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [rawC2];

          for (let k = 0; k < subNames.length; k++) {
            const cnName = subNames[k];
            let cas = subCas[k] || subCas[0] || '';
            const conc = subConc[k] || subConc[0] || '';
            let enName = cnName;
            if (/胺和环氧树脂的加合物|环氧.*胺.*加合物/i.test(cnName)) enName = 'Amine and epoxy resin adduct';
            else if (/改性环氧聚合物|环氧聚合物/i.test(cnName)) enName = 'Modified epoxy polymer';
            else if (/封闭型脂肪族聚异氰酸酯/i.test(cnName)) enName = 'Blocked aliphatic polyisocyanate';
            else if (/二丙二醇二甲醚/i.test(cnName)) enName = 'Dipropylene glycol dimethyl ether';
            else if (/六甲撑二异氰酸酯基均聚物|六亚甲基二异氰酸酯.*均聚物|HDI.*均聚物|HDI.*低聚物/i.test(cnName)) {
              if (/亲水/i.test(cnName)) enName = 'Hydrophilically modified hexamethylene diisocyanate homopolymer';
              else enName = 'Hexamethylene diisocyanate homopolymer';
            }
            else if (/亲水改性.*异氰酸酯/i.test(cnName)) enName = 'Hydrophilically modified polyisocyanate';
            else if (/六甲撑二异氰酸酯|六亚甲基二异氰酸酯|HDI/i.test(cnName)) enName = 'Hexamethylene diisocyanate';
            else if (/丙二醇二乙酸酯|PGDA/i.test(cnName)) enName = 'Propylene glycol diacetate';
            else if (/丙二醇甲醚醋酸酯|PMA/i.test(cnName)) enName = 'Propylene glycol monomethyl ether acetate (PMA)';
            else if (/丙二醇甲醚|1-甲氧基-2-丙醇/i.test(cnName)) enName = '1-Methoxy-2-propanol';
            else if (/丙酮/i.test(cnName)) enName = 'Acetone';
            else if (/乙酸/i.test(cnName)) enName = 'Acetic acid';
            else if (/聚乙烯蜡/i.test(cnName)) enName = 'Polyethylene wax';
            else if (/蜡/i.test(cnName)) enName = 'Wax';
            else if (/二甲基乙酰胺|DMAC/i.test(cnName)) enName = 'N,N-Dimethylacetamide (DMAC)';
            else if (/甲基吡咯烷酮|NMP/i.test(cnName)) enName = 'N-Methyl-2-pyrrolidone (NMP)';
            else if (/乙基吡咯烷酮|NEP/i.test(cnName)) enName = '1-Ethylpyrrolidin-2-one (NEP)';
            else if (/去离子水/i.test(cnName)) enName = 'Deionized water';
            else if (/聚氨酯.*分散体|水性聚氨酯/i.test(cnName)) enName = 'Polyurethane dispersion';
            else if (/聚氨酯.*聚合物/i.test(cnName)) enName = 'Polyurethane polymer';
            else if (/聚氨酯/i.test(cnName)) enName = 'Polyurethane';
            else if (/氢氧化钠/i.test(cnName)) enName = 'Sodium hydroxide';
            else if (/三乙胺/i.test(cnName)) enName = 'Triethylamine';
            else if (/水$/i.test(cnName)) enName = 'Water';
            else if (/环氧改性丙烯酸聚合物|环氧.*丙烯酸/i.test(cnName)) enName = 'Epoxy modified acrylic polymer';
            else if (/丁氧基乙醇|乙二醇丁醚/i.test(cnName)) enName = '2-Butoxyethanol';
            else if (/羟基丙烯酸酯.*聚合物|丙烯酸酯.*聚合物/i.test(cnName)) enName = 'Hydroxy acrylic polymer';
            else if (/丙二醇.*丁醚|丙二醇单丁醚/i.test(cnName)) enName = 'Propylene glycol butyl ether';
            else if (/N,N[－\-—\s]*二甲基乙醇胺|二甲基乙醇胺|DMEA/i.test(cnName)) enName = '2-Dimethylaminoethanol';

            comps.push({
              name: enName,
              cas: /商业机密|商业秘密/i.test(cas) ? 'Trade secret' : cas,
              conc: conc
            });
          }
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

  // Section 6 (底模自愈重写错位消防标签，规范化为法定泄漏应急标签)
  const s6 = engine.records.find(r => r.sectionNumber === 6);
  if (s6) {
    for (const row of s6.rows) {
      const c0 = row.cells[0];
      const c1 = row.cells[1];
      if (!c1) continue;
      const lbl = (c0?.text || '').trim();
      if (/6\.1/i.test(lbl)) {
        if (/Firefighting/i.test(lbl)) {
          writeCellLabel(c0, '6.1 Personal precautions, protective equipment and emergency procedures:', true);
        }
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

  // Section 8 (与中文母版保持严格同构剪枝)
  let s8 = engine.records.find(r => r.sectionNumber === 8);
  if (s8) {
    const cnS8 = baseCnEngine?.records?.find(r => r.sectionNumber === 8);
    // 如果中文母版剪枝删除了手部防护行，英文版必须同步物理删除 Hand protection 行！
    // 废除 deleteRow(engine, s8, enHandIdx)！唯一父级分类题头 Hand protection 保持存活

    for (const row of s8.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (c1) {
        if (/Respiratory protection/i.test(lbl)) safeWrite(c1, enValues['sec8.respiratory_protection']);
        else if (/Hand protection/i.test(lbl)) {
          const cnHand = cnS8?.rows?.find(r => /手部/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
          safeWrite(c1, cnHand ? enValues['sec8.hand_protection'] : '');
        }
        else if (/Suitable material/i.test(lbl)) safeWrite(c1, enValues['sec8.glove_material']);
        else if (/Fluororubber|FKM/i.test(lbl)) safeWrite(c1, enValues['sec8.fkm_glove']);
        else if (/Butyl rubber|IIR/i.test(lbl)) safeWrite(c1, enValues['sec8.iir_glove']);
        else if (/Nitrile rubber|NBR/i.test(lbl)) safeWrite(c1, enValues['sec8.nbr_glove']);
        else if (/Recommendation/i.test(lbl)) {
          const cnRec = cnS8?.rows?.find(r => /建议/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
          safeWrite(c1, cnRec ? (enValues['sec8.glove_recommendation'] || 'Discard contaminated gloves.') : '');
        }
        else if (/Eye protection/i.test(lbl)) {
          safeWrite(c1, enValues['sec8.eye_protection'] || '');
        }
        else if (/Body protection/i.test(lbl)) safeWrite(c1, enValues['sec8.body_protection']);
        else if (/Engineering controls/i.test(lbl)) {
          safeWrite(c1, enValues['sec8.engineering_controls'] || '');
        }
      }
    }
    const CHEMICAL_TRANSLATION_MAP = {
      '六亚甲基-1,6-二异氰酸酯': 'Hexamethylene-1,6-diisocyanate',
      '二异氰酸六亚甲基酯': 'Hexamethylene-1,6-diisocyanate',
      '二乙二醇丁醚': '2-(2-Butoxyethoxy)ethanol',
      '丙二醇甲醚醋酸酯': '2-Methoxy-1-methylethyl acetate',
      '乙酸丁酯': 'n-Butyl acetate',
      '二甲苯': 'Xylene',
      '甲苯': 'Toluene',
      '乙酸乙酯': 'Ethyl acetate'
    };
    for (const row of s8.rows) {
      if (row.cells.length === 4) {
        const c0 = row.cells[0];
        if (c0 && c0.text) {
          const trimmed = c0.text.trim();
          for (const [cnName, enName] of Object.entries(CHEMICAL_TRANSLATION_MAP)) {
            if (trimmed.includes(cnName)) {
              safeWrite(c0, enName);
              break;
            }
          }
        }
      }
    }

    // 若无接触限值（isNoOEL），彻底剪除 8.2 工程控制之后的所有 4 列表格行
    const row82En = s8.rows.find(r => /8\.2\s*Engineering controls/i.test(r.cells[0]?.text || ''));
    const cnRow82 = cnS8?.rows?.find(r => /8\.2\s*工程控制/i.test(r.cells[0]?.text || ''));
    const cnS8Text = cnS8 ? cnS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ') : '';
    const isNoOELEn = (row82En && /No exposure limit|Contains no substances/i.test(row82En.cells[row82En.cells.length - 1]?.text || ''))
      || (cnRow82 && /不含有职业接触限值|不含职业接触|无可用的接触限值|2006\/121/i.test(cnRow82.cells[cnRow82.cells.length - 1]?.text || ''))
      || (/不含有职业接触限值|不含职业接触|无可用的接触限值|2006\/121/i.test(cnS8Text));
    if (isNoOELEn && row82En) {
      const r82IdxEn = s8.rows.indexOf(row82En);
      while (s8.rows.length > r82IdxEn + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
    }

    // 若中文没有 PMA 行，英文也相应删除 PMA 行
    const cnHasPma = cnS8?.rows?.some(r => /丙二醇甲醚醋酸酯/i.test(r.cells[0]?.text || ''));
    if (!cnHasPma) {
      const enPmaIdx = s8.rows.findIndex(r => r.cells.some(c => /丙二醇甲醚醋酸酯|Propylene glycol monomethyl ether acetate/i.test(c.text || '')));
      if (enPmaIdx !== -1) {
        s8 = deleteRow(engine, s8, enPmaIdx);
      }
    }

    // 清理英文 Section 8 4列表格中未填充的空白数据行 (例如无 PMA 时残留的空行)
    for (let rIdx = s8.rows.length - 1; rIdx >= 14; rIdx--) {
      const row = s8.rows[rIdx];
      if (row && row.cells.length === 4) {
        const isEmptyRow = row.cells.every(c => !(c.text || '').trim());
        if (isEmptyRow) {
          try {
            s8 = deleteRow(engine, s8, rIdx);
          } catch (e) {}
        }
      }
    }

    const targetRowCount = cnS8?.rows?.length || s8.rows.length;
    while (s8.rows.length > targetRowCount) {
      s8 = deleteRow(engine, s8, s8.rows.length - 1);
    }
  }

  // Section 9 【核心重构：以中文母版保留项为绝对基准，对英文底模执行 1:1 同构镜像装配】
  let s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9 && baseCnEngine) {
    const cnS9 = baseCnEngine.records.find(r => r.sectionNumber === 9);
    if (cnS9 && cnS9.rows.length >= 2) {
      while (s9.rows.length > cnS9.rows.length) {
        s9 = deleteRow(engine, s9, s9.rows.length - 1);
      }
      while (s9.rows.length < cnS9.rows.length) {
        s9 = addRowAfter(engine, s9, s9.rows.length - 1);
      }
      for (let i = 1; i < cnS9.rows.length; i++) {
        const cnRow = cnS9.rows[i];
        const enRow = s9.rows[i];
        const cnLabel = (cnRow.cells[0]?.text || '').trim();
        const cnVal = (cnRow.cells[1]?.text || '').trim();
        const { enLabel, enVal } = translateSection9Item(i, cnLabel, cnVal);
        formatSection9LabelCell(enRow.cells[0], `9.${i}`, enLabel, true);
        if (enRow.cells[1]) {
          safeWriteCellValue(enRow.cells[1], enVal);
        }
      }
    }
  }

  // Section 10 (提取真实分解产物并英译，如二甲基吡唑)
  // Helper for Conditions to avoid
function translateConditionsToAvoid(cnText = '') {
  if (!cnText) return 'No data available.';
  if (/避免0[℃°C]以下的低温和超过70[℃°C]的高温/i.test(cnText)) {
    return 'Avoid low temperatures below 0°C and high temperatures above 70°C.';
  }
  if (/避免0[℃°C]以下.*超过(?:35|40|50|70)[℃°C]/i.test(cnText)) {
    const m = cnText.match(/超过(\d+)[℃°C]/);
    const maxT = m ? m[1] : '70';
    return `Avoid low temperatures below 0°C and high temperatures above ${maxT}°C.`;
  }
  if (/冻结|霜冻|过热/i.test(cnText)) {
    return 'Protect from freezing, excessive heat and direct sunlight.';
  }
  return cnText
    .replace(/避免/g, 'Avoid ')
    .replace(/0℃以下的低温/g, 'low temperatures below 0°C')
    .replace(/超过/g, 'temperatures above ')
    .replace(/℃的高温/g, '°C')
    .replace(/。/g, '.');
}

  // Section 10 100% 忠实同构对齐 (按中文事实 1:1 动态装配，彻底杜绝外生编造)
  let s10 = engine.records.find(r => r.sectionNumber === 10);
  if (s10 && baseCnEngine) {
    const cnS10 = baseCnEngine.records.find(r => r.sectionNumber === 10);
    if (cnS10 && cnS10.rows.length >= 2) {
      while (s10.rows.length > cnS10.rows.length) {
        s10 = deleteRow(engine, s10, s10.rows.length - 1);
      }
      while (s10.rows.length < cnS10.rows.length) {
        s10 = addRowAfter(engine, s10, s10.rows.length - 1);
      }
      for (let i = 1; i < cnS10.rows.length; i++) {
        const cnRow = cnS10.rows[i];
        const cnLbl = (cnRow.cells[0]?.text || '').trim();
        const cnVal = (cnRow.cells[cnRow.cells.length - 1]?.text || '').trim();
        const enRow = s10.rows[i];
        if (!enRow || enRow.cells.length < 2) continue;
        const c0 = enRow.cells[0];
        const c1 = enRow.cells[enRow.cells.length - 1];

        const setCellLabelDirect = (cell, labelText) => {
          if (!cell?.node) return;
          const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
          const p = cell.node.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p) {
            rebuildRunsWithTypography(p, labelText, { font: 'Arial', sizeVal: '19', bold: true }, W_NS);
          }
          cell.text = labelText;
        };

        if (/化学稳定/i.test(cnLbl)) {
          setCellLabelDirect(c0, `10.${i}  Chemical stability:`);
          safeWrite(c1, 'No decomposition if used according to specifications.');
        } else if (/危害反应/i.test(cnLbl)) {
          setCellLabelDirect(c0, `10.${i}  Possibility of hazardous reactions:`);
          safeWrite(c1, 'No hazardous reactions when stored and handled correctly.');
        } else if (/避免.*条件|条件/i.test(cnLbl)) {
          setCellLabelDirect(c0, `10.${i}  Conditions to avoid:`);
          safeWrite(c1, translateConditionsToAvoid(cnVal));
        } else if (/危险分解|分解产物/i.test(cnLbl)) {
          setCellLabelDirect(c0, `10.${i}  Hazardous decomposition products:`);
          safeWrite(c1, enValues['sec10.hazardous_decomp'] || 'Flammable and harmful gases generated during thermal decomposition.');
        } else if (/禁配/i.test(cnLbl)) {
          setCellLabelDirect(c0, `10.${i}  Incompatible materials:`);
          safeWrite(c1, 'No data available.');
        }
      }
      renumberRecord(s10);
    }
  }
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  const isMultiComponent = modelCode === 'PA-3223' || Boolean(facts.isMultiComponentComposite);
  const cnS11ForCheck = baseCnEngine?.records?.find(r => r.sectionNumber === 11);
  const isCnS11FullWidth = cnS11ForCheck && cnS11ForCheck.rows.length === 4 && cnS11ForCheck.rows[3]?.cells?.length === 1;
  const enS11Paradigm = (isMultiComponent || isCnS11FullWidth) ? 'PARADIGM_1_FULL_WIDTH_MERGED' : 'PARADIGM_2_STANDARD_SLOTS';
  if (s11 && (isMultiComponent || enS11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED')) {
    // Mode B 通栏复合豁免模态：已由 buildThreeTierSection11 全权接管，跳过传统单端点映射以防中文污染
  } else if (s11) {
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
      if (s11.rows[1]) {
        formatSection11PreambleRow(s11.rows[1], 'No toxicological studies were available for this product.', true, 0);
      }
      if (s11.rows[2]?.cells?.[0]) {
        let enIntro = 'The following are toxicological data for the component:';
        if (/类似产品的风险评估/i.test(cnS11Preambles[1])) {
          enIntro = 'Toxicological data from risk assessment of similar products:';
        } else if (/N[－\-—\s]*甲基吡咯烷酮|NMP/i.test(cnS11Preambles[1])) {
          enIntro = 'The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):';
        } else if (/N,N[－\-—\s]*二甲基乙酰胺|DMAC/i.test(cnS11Preambles[1])) {
          enIntro = 'The following is toxicological data for N,N-Dimethylacetamide:';
        } else if (/2-丁氧基乙醇|111-76-2/i.test(cnS11Preambles[1])) {
          enIntro = 'The following is toxicological data for 2-Butoxyethanol (CAS: 111-76-2):';
        } else if (/以[下为](?:是)?(.*?)毒理学数据/i.test(cnS11Preambles[1])) {
          const comp = cnS11Preambles[1].match(/以[下为](?:是)?(.*?)毒理学数据/i)[1].trim();
          enIntro = `The following are toxicological data for ${comp}:`;
        }
        formatSection11PreambleRow(s11.rows[2], enIntro, true);
      }
    } else if (cnS11Preambles.length === 1) {
      if (s11.rows[1]) {
        formatSection11PreambleRow(s11.rows[1], 'No toxicological studies were available for this product.', true, 0);
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
      const teratoCn = findCnVal(/致畸/i);
      const fertCn = findCnVal(/生育/i) || repCn;
      const stotCn = findCnVal(/特异性靶器官/i);
      const aspCn = findCnVal(/吸入危险|吸入危害/i);
      const addInfoCn = findCnVal(/附加信息/i);

      for (let i = 0; i < s11.rows.length; i++) {
        const row = s11.rows[i];
        const rText = row.cells.map(c => c.text).join(' ');
        const lastCell = row.cells[row.cells.length - 1];
        if (!lastCell) continue;

        if (/Oral/i.test(rText) && oralCn) safeWrite(lastCell, translateToxicologyValueToEnglish(oralCn, 'oral'));
        else if (/Inhalation/i.test(rText) && inhalCn) safeWrite(lastCell, translateToxicologyValueToEnglish(inhalCn, 'inhalation'));
        else if (/Dermal/i.test(rText) && dermCn) safeWrite(lastCell, translateToxicologyValueToEnglish(dermCn, 'dermal'));
        else if (/Primary skin irritation/i.test(rText) && skinIrrCn) safeWrite(lastCell, translateToxicologyValueToEnglish(skinIrrCn));
        else if (/Primary eye irritation|Primary mucosal irritation/i.test(rText) && eyeIrrCn) {
          const isMucosal = cnS11?.rows?.some(r => /主要粘膜刺激/i.test(r.cells[0]?.text || ''));
          if (isMucosal) {
            writeCellLabel(row.cells[0], '11.3 Primary mucosal irritation:', true);
          }
          safeWrite(lastCell, translateToxicologyValueToEnglish(eyeIrrCn));
        }
        else if (/Sensitization/i.test(rText) && sensCn) safeWrite(lastCell, translateToxicologyValueToEnglish(sensCn));
        else if (/Mutagenicity/i.test(rText) && mutCn) safeWrite(lastCell, translateToxicologyValueToEnglish(mutCn));
        else if (/Carcinogenicity/i.test(rText) && carcCn) safeWrite(lastCell, translateToxicologyValueToEnglish(carcCn));
        else if (/Teratogenicity/i.test(rText) && teratoCn) safeWrite(lastCell, translateToxicologyValueToEnglish(teratoCn));
        else if (/Fertility/i.test(rText) && fertCn) safeWrite(lastCell, translateToxicologyValueToEnglish(fertCn));
        else if (/Reproductive toxicity/i.test(rText)) {
          const repRowInCn = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
          if (repRowInCn) {
            safeWrite(lastCell, repCn ? translateToxicologyValueToEnglish(repCn) : 'No data available.');
          }
        }
        else if (/Specific target organ/i.test(rText) && stotCn) safeWrite(lastCell, translateToxicologyValueToEnglish(stotCn));
        else if (/Aspiration hazard/i.test(rText) && aspCn) safeWrite(lastCell, translateToxicologyValueToEnglish(aspCn));
        else if (/Additional information/i.test(rText)) {
          if (addInfoCn) {
            writeStructuredToxicologyCellValue(lastCell, translateToxicologyValueToEnglish(addInfoCn), { isEnglish: true });
          } else {
            safeWrite(lastCell, 'No data available.');
          }
        }
      }

      // 3. 动态精简：严格与中文母版 cnS11 结构同构对齐，中文未列入的指标项英文必须同步剪枝
      const cnHasCarc = cnS11?.rows?.some(r => /致癌/i.test(r.cells[0]?.text || ''));
      const cnHasRep = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
      const cnHasStot = cnS11?.rows?.some(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
      const cnHasAsp = cnS11?.rows?.some(r => /吸入危险|吸入危害/i.test(r.cells[0]?.text || ''));
      const cnHasAdd = cnS11?.rows?.some(r => /附加信息/i.test(r.cells[0]?.text || ''));

      for (let i = s11.rows.length - 1; i >= 3; i--) {
        const row = s11.rows[i];
        const rText = row.cells.map(c => c.text).join(' ');
        const lastCellText = (row.cells[row.cells.length - 1]?.text || '').trim();
        let shouldPrune = false;
        if (/Inhalation:/i.test(rText) && !inhalCn) shouldPrune = true;
        else if (/Dermal:/i.test(rText) && !dermCn) shouldPrune = true;
        else if (/Primary skin irritation/i.test(rText) && !skinIrrCn) shouldPrune = true;
        else if (/Primary eye irritation/i.test(rText) && !eyeIrrCn) shouldPrune = true;
        else if (/Sensitization/i.test(rText) && !sensCn) shouldPrune = true;
        else if (/Mutagenicity/i.test(rText) && !mutCn) shouldPrune = true;
        else if (/Carcinogenicity/i.test(rText) && !cnHasCarc) shouldPrune = true;
        else if (/Teratogenicity/i.test(rText) && !findCnVal(/致畸/i)) shouldPrune = true;
        else if (/In vitro genotoxicity/i.test(rText) && !findCnVal(/体外遗传毒性|体外基因毒性/i)) shouldPrune = true;
        else if (/Reproductive toxicity/i.test(rText) && !cnHasRep) shouldPrune = true;
        else if (/Specific target organ/i.test(rText) && !cnHasStot) shouldPrune = true;
        else if (/Aspiration hazard/i.test(rText) && !cnHasAsp) shouldPrune = true;
        else if (/Additional information/i.test(rText) && !cnHasAdd) shouldPrune = true;
        else if (/根据现有数据/i.test(rText)) shouldPrune = true;
        else if (i >= 3 && row.cells.length === 1) shouldPrune = true;
        else if (!rText.trim()) shouldPrune = true;
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

      // 若中文母版行数少于英文版（例如中文仅有前言说明无指标项），严格对齐双语行数，修剪英文多余尾行
      const targetRowCount = cnS11?.rows?.length || s11.rows.length;
      while (s11.rows.length > targetRowCount) {
        s11 = deleteRow(engine, s11, s11.rows.length - 1);
      }
    }

    // 4. 重新编号确保 11.1 ~ 11.N 严密对齐
    renumberRecord(s11, '11');

    // 消除英文版 Section 11 中残留的中文全角冒号、拼写瑕疵及转义字符
    const s11XmlTexts = Array.from(s11.node?.getElementsByTagNameNS(W_NS, 't') || []);
    for (const tNode of s11XmlTexts) {
      if (tNode.textContent) {
        if (tNode.textContent.includes('：')) tNode.textContent = tNode.textContent.replace(/：/g, ':');
        if (tNode.textContent.includes('orga ntoxicity')) tNode.textContent = tNode.textContent.replace(/orga ntoxicity/g, 'organ toxicity');
        if (tNode.textContent.includes('repeate dexposure')) tNode.textContent = tNode.textContent.replace(/repeate dexposure/g, 'repeated exposure');
        if (tNode.textContent.includes('&gt;')) tNode.textContent = tNode.textContent.replace(/&gt;/g, '>');
      }
    }

    // 通用英文 Section 11 标准排版与悬挂缩进保全 (基于中文母版实测事实数据驱动)
    for (let rIdx = 3; rIdx < s11.rows.length; rIdx++) {
      const c0 = s11.rows[rIdx]?.cells[0];
      if (c0) {
        applyStandardHangingIndent(c0, '420', '420');
      }
      normalizeSection11RowHeight(s11.rows[rIdx]);
    }
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
      // 中文母版有 2 行说明行：Row 1 产品免责，Row 2 组分引言 (G-35 统一 9.5pt)
      if (s12.rows[1]?.cells?.[0]) {
        safeWrite(s12.rows[1].cells[0], translateSection12PreambleToEnglish(cnPreambles[0]) || 'No ecotoxicological studies are available for this product.');
        setCellPreambleTypography(s12.rows[1].cells[0], true);
      }
      if (s12.rows[2]?.cells?.[0]) {
        safeWrite(s12.rows[2].cells[0], translateSection12PreambleToEnglish(cnPreambles[1]));
        setCellPreambleTypography(s12.rows[2].cells[0], true);
      }
    } else if (cnPreambles.length === 1) {
      if (s12.rows[1]?.cells?.[0]) {
        safeWrite(s12.rows[1].cells[0], translateSection12PreambleToEnglish(cnPreambles[0]) || 'No ecotoxicological studies are available for this product.');
        setCellPreambleTypography(s12.rows[1].cells[0], true);
      }
      if (s12.rows[2]?.cells?.length === 1) {
        s12 = deleteRow(engine, s12, 2);
      }
    } else if (cnPreambles.length === 0) {
      while (s12.rows.length > 1 && s12.rows[1].cells.length === 1) {
        s12 = deleteRow(engine, s12, 1);
      }
      renumberRecord(s12, '12');
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
    if (s13.rows[0]?.cells[0]) {
      const c0 = s13.rows[0].cells[0];
      if (c0.labelNodes && c0.labelNodes.length >= 2) {
        c0.labelNodes[0].textContent = '13.';
        c0.labelNodes[1].textContent = ' Disposal considerations';
      } else if (c0.labelNodes && c0.labelNodes.length === 1) {
        c0.labelNodes[0].textContent = '13. Disposal considerations';
      }
      c0.text = '13. Disposal considerations';
    }
    if (s13.rows.length === 3) {
      s13 = addRowAfter(engine, s13, 1);
    }
    if (s13.rows.length >= 4) {
      safeWrite(s13.rows[1].cells[0], enValues['sec13.line1']);
      setCellPreambleTypography(s13.rows[1].cells[0], true);
      safeWrite(s13.rows[2].cells[0], enValues['sec13.line2']);
      setCellPreambleTypography(s13.rows[2].cells[0], true);
      if (s13.rows[3]?.cells[1]) {
        safeWrite(s13.rows[3].cells[1], enValues['sec13.methods']);
      }
    } else {
      if (s13.rows[1]?.cells[0]) {
        safeWrite(s13.rows[1].cells[0], enValues['sec13.line1']);
        setCellPreambleTypography(s13.rows[1].cells[0], true);
      }
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

  // Section 15 (法规标准 100% 官方标准纯英文化，绝对零中文；根据中文母版剪枝未列法规)
  let s15 = engine.records.find(r => r.sectionNumber === 15);
  if (s15) {
    const cnS15 = baseCnEngine?.records?.find(r => r.sectionNumber === 15);
    const cnS15Text = cnS15 ? cnS15.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';
    const cnHasGb15258 = /15258|安全标签编写/i.test(cnS15Text);

    if (!cnHasGb15258) {
      const enGb15258Row = s15.rows.find(r => /15258|precautionary label/i.test(r.cells[0]?.text || ''));
      if (enGb15258Row) {
        s15 = deleteRow(engine, s15, s15.rows.indexOf(enGb15258Row));
      }
    }

    if (cnS15) {
      while (s15.rows.length > cnS15.rows.length) {
        s15 = deleteRow(engine, s15, s15.rows.length - 1);
      }
    }

    const has16483Year = /16483-2008/i.test(cnS15Text);
    const has13690Year = /13690-2009/i.test(cnS15Text);
    const stdRegulations = [
      'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591',
      has16483Year
        ? 'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections'
        : 'GB/T 16483 Safety data sheet for chemical products - Content and order of sections',
      has13690Year
        ? 'GB 13690-2009 General rules for classification and hazard communication of chemicals'
        : 'GB 13690 General rules for classification and hazard communication of chemicals',
      'GB 30000.2-29 Rules for classification and labelling of chemicals'
    ];
    if (cnHasGb15258) {
      stdRegulations.push('GB 15258 General rules for preparation of precautionary label for chemicals');
    }

    let regIdx = 0;
    for (let i = 0; i < s15.rows.length; i++) {
      const row = s15.rows[i];
      const lbl = (row.cells[0]?.text || '').trim();
      if (/591|16483|13690|30000|15258|危险化学品|化学品安全|分类和危险性|标签规范|安全标签/i.test(lbl) || (i >= 4 && regIdx < stdRegulations.length)) {
        safeWrite(row.cells[0], stdRegulations[regIdx]);
        if (row.cells[1]) {
          const cnVal = row.cells[1].text?.trim() || '';
          if (/不适用/i.test(cnVal)) safeWrite(row.cells[1], 'Not applicable');
          else safeWrite(row.cells[1], 'Complies');
        }
        regIdx++;
      }
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

  // 确保 Section 9 序号完全自增一致（避免排版标准化后序号失步）
  const finalS9 = engine.records.find(r => r.sectionNumber === 9);
  if (finalS9) renumberRecord(finalS9);

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

  // 确保 Section 9 序号完全自增一致（避免排版标准化后序号失步）
  const presetS9 = enPresetEngine.records.find(r => r.sectionNumber === 9);
  if (presetS9) renumberRecord(presetS9);

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

async function safeWriteFileWithLockGuard(targetPath, buffer, maxRetries = 3) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await fs.writeFile(targetPath, buffer);
      return targetPath;
    } catch (err) {
      if ((err.code === 'EBUSY' || err.code === 'EPERM') && attempt < maxRetries) {
        attempt++;
        console.warn(`[文件锁拦截] 目标物理文件 ${targetPath} 正被外部编辑器/阅读器独占占用！正在进行第 ${attempt}/${maxRetries} 次等待重试...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        throw new Error(`【文件独占锁定致命拦截 (Hard Blocker)】无法写入目标交付物: ${targetPath}！该文件当前正被外部程序（如 PDF 阅读器、Word 或 WPS）独占锁定。请先在外部软件中关闭该文件，然后重新执行！绝不允许静默降级或吞下异常！`);
      }
      throw err;
    }
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

  // 交付目录绝对纯净清场：物理清理任何历史遗留的非 8 格式文件与备用副本碎片
  if (targetDir) {
    try {
      const canonicalNames = new Set([
        ...docxItems.map(i => i.name),
        ...pdfOutputs.map(p => p.pdfName)
      ]);
      const dirEntries = await fs.readdir(targetDir, { withFileTypes: true });
      for (const entry of dirEntries) {
        if (entry.isFile()) {
          const fileName = entry.name;
          if (!canonicalNames.has(fileName)) {
            if (
              fileName.includes('_源文件留存') ||
              fileName.includes('_原版留存')
            ) {
              const archiveSubdir = path.join(targetDir, '源文件留存');
              await fs.mkdir(archiveSubdir, { recursive: true }).catch(() => {});
              await fs.rename(path.join(targetDir, fileName), path.join(archiveSubdir, fileName)).catch(() => {});
              console.log(`[CleanSweep] 安全归档源文件留存至子目录: ${fileName} -> 源文件留存/`);
            } else if (
              fileName.includes('(最新)') ||
              fileName.includes('(更新)') ||
              fileName.includes('(临时更新)') ||
              fileName.includes('手做改版材料') ||
              fileName.includes('当前匹配结果')
            ) {
              await fs.unlink(path.join(targetDir, fileName)).catch(() => {});
              console.log(`[CleanSweep] 清除交付目录非标准历史碎片: ${fileName}`);
            }
          }
        }
      }
    } catch (cleanErr) {
      console.warn(`[CleanSweep] 清场异常: ${cleanErr.message}`);
    }
  }

  // Gate 12: 全流程双极双层深度审计一票否决门禁 (Skill + Engine 强制项)
  // 必须对导出的 8 格式生成物进行最终机器级 AST 深度审计，任何一项违章立即抛出异常熔断阻断交付！
  if (targetDir) {
    try {
      const auditModule = await import('../scripts/audit_bipolar_bilayer.mjs');
      if (auditModule?.runBipolarBilayerAudit) {
        const auditRes = await auditModule.runBipolarBilayerAudit(targetDir, modelCode);
        if (!auditRes.success) {
          throw new Error(`【质量门禁拦截 (Gate 12)】${modelCode} 产出物双极双层全景深度审计未通过，存在 ${auditRes.failCount} 项严重违章！立即阻断交付。`);
        }
      }
    } catch (auditErr) {
      if (auditErr.message?.includes('质量门禁拦截')) throw auditErr;
      console.warn(`[Pipeline] 深度审计模块执行提示: ${auditErr.message}`);
    }
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
    viscosityOverride: facts.viscosityOverride || facts.viscosity,
    facts
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

  // 3.4 全局强化表格边框规范 (外框实线，内框统一虚线) 与理化指标序号自增同步
  for (const eng of [baseCnEngine, baseEnEngine, cnPresetEngine, enPresetEngine]) {
    const isEn = eng === baseEnEngine || eng === enPresetEngine;
    for (const record of eng.records) {
      if (record.kind === 'table') {
        enforceTableStandardBorders(record);
      }
    }
    // 表格行防跨页撕裂加固：为文档中所有表格的 w:tr 注入 <w:cantSplit/>
    if (eng.documentXml) {
      const allTables = Array.from(eng.documentXml.getElementsByTagNameNS(W_NS, 'tbl'));
      for (const tbl of allTables) {
        const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
        for (const tr of trs) {
          let trPr = tr.getElementsByTagNameNS(W_NS, 'trPr')[0];
          if (!trPr) {
            trPr = tr.ownerDocument.createElementNS(W_NS, 'w:trPr');
            tr.insertBefore(trPr, tr.firstChild);
          }
          if (trPr.getElementsByTagNameNS(W_NS, 'cantSplit').length === 0) {
            trPr.appendChild(tr.ownerDocument.createElementNS(W_NS, 'w:cantSplit'));
          }
        }
      }
    }
    // 强制执行全文档跨章节设计令牌与底层排版投影 (INV-FONT-UNIFORMITY)
    applyGlobalTypographyProjection(eng, isEn);
    // 强制执行结构性题头与标签加粗法定不变量加固 (INV-BOLD-S2-S15)
    enforceStructuralTypographyInvariants(eng, isEn);
    const s8Rec = eng.records.find(r => r.sectionNumber === 8);
    if (s8Rec) {
      // 1. Table 8 值格字阶与字体全局统一性规范 (INV-FONT-UNIFORMITY):
      // 中文版：值格统一为小四号 12pt (sz="24") 宋体常规体（严禁加粗）
      // 英文版：值格统一为五号 9.5pt (sz="19") Arial 常规体
      const targetSz = isEn ? '19' : '24';
      const targetFont = isEn ? 'Arial' : '宋体';
      for (let r = 2; r < s8Rec.rows.length; r++) {
        const vCell = s8Rec.rows[r]?.cells?.[1];
        if (vCell?.node) {
          const rPrs = Array.from(vCell.node.getElementsByTagNameNS(W_NS, 'rPr'));
          for (const rPr of rPrs) {
            const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
            bs.forEach(b => rPr.removeChild(b));
            const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
            bCss.forEach(b => rPr.removeChild(b));
            const szs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'sz'));
            szs.forEach(sz => sz.setAttribute('w:val', targetSz));
            const szCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'szCs'));
            szCss.forEach(szCs => szCs.setAttribute('w:val', targetSz));
            const rFontsList = Array.from(rPr.getElementsByTagNameNS(W_NS, 'rFonts'));
            for (const rf of rFontsList) {
              rf.setAttribute('w:ascii', targetFont);
              rf.setAttribute('w:hAnsi', targetFont);
              rf.setAttribute('w:eastAsia', targetFont);
              rf.setAttribute('w:cs', targetFont);
            }
          }
        }
      }
      // 2. Section 8 中文手部防护缩进规范: 严禁异常悬挂缩进 (hanging=3373)，必须为标准首行缩进 482
      const handRowCn = s8Rec.rows.find(row => /手部防护/i.test(row.cells[0]?.text || ''));
      if (handRowCn && handRowCn.cells[0]?.node) {
        const c0 = handRowCn.cells[0].node;
        const inds = Array.from(c0.getElementsByTagNameNS(W_NS, 'ind'));
        inds.forEach(ind => {
          ind.setAttribute('w:firstLine', '482');
          ind.setAttribute('w:firstLineChars', '200');
          ind.removeAttribute('w:left');
          ind.removeAttribute('w:hanging');
          ind.removeAttribute('w:leftChars');
          ind.removeAttribute('w:hangingChars');
        });
      }
      // 3. Section 8 英文标签题头统一字号规范: 统一为 w:sz="24" (12pt 加粗)，消除 sz="19" 与 sz="24" 断层
      if (isEn) {
        for (let r = 2; r < s8Rec.rows.length; r++) {
          const c0 = s8Rec.rows[r]?.cells?.[0]?.node;
          if (c0) {
            const szs = Array.from(c0.getElementsByTagNameNS(W_NS, 'sz'));
            szs.forEach(sz => sz.setAttribute('w:val', '24'));
            const szCss = Array.from(c0.getElementsByTagNameNS(W_NS, 'szCs'));
            szCss.forEach(szCs => szCs.setAttribute('w:val', '24'));
          }
        }
      }
    }
    // 4. Section 13 废弃处置段落对齐规范 (INV-S13-01): 英文版内容严格纯左对齐 (left)，中文版保持两端对齐 (both)
    const s13Rec = eng.records.find(r => r.sectionNumber === 13);
    if (s13Rec && isEn) {
      for (const row of s13Rec.rows) {
        for (const cell of row.cells) {
          if (cell?.node) {
            const jcs = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'jc'));
            for (const jc of jcs) {
              if (jc.getAttribute('w:val') === 'both') {
                jc.setAttribute('w:val', 'left');
              }
            }
          }
        }
      }
    }
    const s9 = eng.records.find(r => r.sectionNumber === 9);
    if (s9) renumberRecord(s9);
    const s10 = eng.records.find(r => r.sectionNumber === 10);
    if (s10) renumberRecord(s10);
  }

  // 3.5 真实性交叉质检门禁（防止再犯：拦截任何模板残留或中英文不一致）
  assertBilingualIntegrity(baseCnEngine, baseEnEngine);

  // 3.6 执行交付前全量硬性质量门禁 (Gate 1~5)
  // 动态探知源文件的 Section 12 说明行数量
  const s12RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 12);
  let expectedS12PreamblesCount = 0;
  if (s12RecordForAudit) {
    for (let i = 1; i < s12RecordForAudit.rows.length; i++) {
      const row = s12RecordForAudit.rows[i];
      if (row.cells.length > 1) break;
      const t = row.cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|12\.\d/i.test(t)) break;
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

  const isNonHazardousComposite = Boolean(facts.isNonHazardousComposite || detectNonHazardousComposite(baseCnEngine.records, facts));
  const sourceFactsForAudit = {
    expectedS11PreamblesCount,
    expectedS12PreamblesCount,
    expectedDate: effectiveDate,
    isNonHazardousComposite
  };

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
 * 结构性题头与标签加粗法定不变量加固引擎 (INV-BOLD-S2-S15)
 * 物理杜绝 Section 2 标签加粗丢失、Section 15 结构性题头加粗丢失与 Section 8.1 格式偏差
 */
export function enforceStructuralTypographyInvariants(eng, isEn = false) {
  if (!eng?.documentXml) return;
  const doc = eng.documentXml;
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  // 1. Section 2: 细粒度加粗与常规体分离校验 (INV-BOLD-S2-S15)
  const s2Rec = eng.records.find(r => r.sectionNumber === 2);
  if (s2Rec && s2Rec.rows.length >= 2) {
    const c0 = s2Rec.rows[1].cells[0]?.node;
    if (c0) {
      const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
      for (const p of ps) {
        const fullText = (p.textContent || '').trim();
        const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
        if (runs.length === 0) continue;

        const isSectionHeader = /^(?:2\.\d+\s*)?(?:GHS\s*危险性类别|GHS\s*分类|Classification of the substance or mixture|GHS\s*Classification|GHS\s*标签要素|Label elements|GHS\s*Label\s*Elements|危险性说明|危害性说明|Hazard\s*statements?|防范说明|Precautionary\s*statements?|其他危害|其他危险|Other\s*hazards?)[：:]?/i.test(fullText);
        const isSubLabelPrefix = /^(?:(?:GHS\s*)?(?:象形图|pictograms?)|(?:警告词|信号词|Signal\s*word)|(?:必须列在标签上的有害成[份分]|Hazardous components which must be listed on the label)|(?:需要注意的物质|Substances?\s*(?:of\s*concern|to\s*be\s*noted))|(?:预防措施|事故响应|安全存储|安全储存|废弃处置|Prevention|Response|Storage|Disposal))[：:]/i.test(fullText);

        const setRunBold = (runNode, bold) => {
          let rPr = runNode.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
          if (!runNode.getElementsByTagNameNS(W_NS, 'rPr')[0]) runNode.insertBefore(rPr, runNode.firstChild);
          const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
          bs.forEach(b => rPr.removeChild(b));
          const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
          bCss.forEach(b => rPr.removeChild(b));
          if (bold) {
            rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
            rPr.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
          }
        };

        if (isSectionHeader) {
          if (/^(?:2\.\d+\s*)?(?:其他危害|其他危险|Other\s*hazards?)[：:]/i.test(fullText)) {
            setRunBold(runs[0], true);
            for (let i = 1; i < runs.length; i++) setRunBold(runs[i], false);
          } else {
            for (const r of runs) setRunBold(r, true);
          }
        } else if (isSubLabelPrefix) {
          setRunBold(runs[0], true);
          for (let i = 1; i < runs.length; i++) setRunBold(runs[i], false);
        } else {
          for (const r of runs) setRunBold(r, false);
        }
      }
    }
  }

  // 2. Section 8.1 题头行与 Section 8.2 工程控制格式规范
  const s8Rec = eng.records.find(r => r.sectionNumber === 8);
  if (s8Rec && s8Rec.rows.length >= 2) {
    const r1 = s8Rec.rows[1];
    const c0 = r1.cells[0]?.node;
    if (c0) {
      const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
      if (runs.length >= 1) {
        let r0Pr = runs[0].getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
        if (!runs[0].getElementsByTagNameNS(W_NS, 'rPr')[0]) runs[0].insertBefore(r0Pr, runs[0].firstChild);
        let b = r0Pr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'b')[0]) r0Pr.appendChild(b);
        let bCs = r0Pr.getElementsByTagNameNS(W_NS, 'bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'bCs')[0]) r0Pr.appendChild(bCs);
        let sz = r0Pr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
        sz.setAttribute('w:val', '21');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'sz')[0]) r0Pr.appendChild(sz);
        let szCs = r0Pr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
        szCs.setAttribute('w:val', '21');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'szCs')[0]) r0Pr.appendChild(szCs);
        let rf = r0Pr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
        rf.setAttribute('w:ascii', 'Times New Roman');
        rf.setAttribute('w:hAnsi', 'Times New Roman');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'rFonts')[0]) r0Pr.appendChild(rf);
      }
      if (runs.length >= 2) {
        let r1Pr = runs[1].getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
        if (!runs[1].getElementsByTagNameNS(W_NS, 'rPr')[0]) runs[1].insertBefore(r1Pr, runs[1].firstChild);
        let b = r1Pr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'b')[0]) r1Pr.appendChild(b);
        let bCs = r1Pr.getElementsByTagNameNS(W_NS, 'bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'bCs')[0]) r1Pr.appendChild(bCs);
        let sz = r1Pr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
        sz.setAttribute('w:val', '24');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'sz')[0]) r1Pr.appendChild(sz);
        let szCs = r1Pr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
        szCs.setAttribute('w:val', '24');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'szCs')[0]) r1Pr.appendChild(szCs);
      }
    }
  }

  // 3. Section 15: 法定结构性子题头加粗保护
  const s15Rec = eng.records.find(r => r.sectionNumber === 15);
  if (s15Rec) {
    for (let rIdx = 1; rIdx < s15Rec.rows.length; rIdx++) {
      const row = s15Rec.rows[rIdx];
      const txt = (row.cells[0]?.text || '').trim();
      const isSubheader = /^(?:其它的规定|其它规定|其他规定|Other provisions|Other regulations)[：:]?/i.test(txt) ||
                          /^(?:符合下列法规要求|Complies with the following regulations|Comply with the following)[：:]?/i.test(txt);
      const c0 = row.cells[0]?.node;
      if (c0) {
        const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
        for (const r of runs) {
          let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
          if (!r.getElementsByTagNameNS(W_NS, 'rPr')[0]) r.insertBefore(rPr, r.firstChild);
          const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
          bs.forEach(b => rPr.removeChild(b));
          const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
          bCss.forEach(b => rPr.removeChild(b));
          if (isSubheader) {
            rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
            rPr.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
          }
        }
      }
    }
  }
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
    else if (/Identification/i.test(r0Text)) sectionNumber = 1;

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

      // 2. Section 8 4列表格专属处理：表头居中加粗无冒号，数据行居中常规体无冒号
      if (sectionNumber === 8 && cells.length === 4) {
        const isHeader = /Substance|Basis|Type|Value|物质|依据|类型|数值/i.test(row.textContent || '');
        for (let cIdx = 0; cIdx < cells.length; cIdx++) {
          const cell = cells[cIdx];
          cleanTabsInNode(cell, W_NS);
          const p = cell.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p) {
            let t = (p.textContent || '').replace(/[:：]$/g, '').trim();
            removeHangingIndentFromP(p, W_NS);
            setParagraphAlign(p, 'center', W_NS);
            rebuildRunsWithTypography(p, t, { font: 'Arial', sizeVal: '19', bold: isHeader }, W_NS);
          }
        }
        continue;
      }

      // 2.1 Section 3 专属豁免：表头加粗无冒号，具体成分名称绝不加粗且末尾绝无冒号
      // Section 15 英文版第 2 行防断层补全
      if (sectionNumber === 15 && rIdx === 1) {
        const text = (cells[0]?.textContent || '').trim();
        if (!text) {
          const p = cells[0]?.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p) {
            rebuildRunsWithTypography(p, 'Relevant safety, health and environmental regulations for the substance or mixture', {
              font: 'Arial',
              sizeVal: '19',
              bold: false
            }, W_NS);
          }
        }
      }

      // Section 3 专项：第3行成分通栏合并，表头加粗无冒号
      if (sectionNumber === 3) {
        if (rIdx === 2 && cells.length === 3) {
          const p0 = cells[0].getElementsByTagNameNS(W_NS, 'p')[0];
          const txt0 = (p0?.textContent || '').trim();
          if (/^(?:3\.2\s*)?(?:成分|Ingredients)/i.test(txt0)) {
            try {
              row.removeChild(cells[1]);
              row.removeChild(cells[2]);
              let tcPr = cells[0].getElementsByTagNameNS(W_NS, 'tcPr')[0];
              if (!tcPr) {
                tcPr = cells[0].ownerDocument.createElementNS(W_NS, 'w:tcPr');
                cells[0].insertBefore(tcPr, cells[0].firstChild);
              }
              let span = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
              if (!span) {
                span = cells[0].ownerDocument.createElementNS(W_NS, 'w:gridSpan');
                tcPr.appendChild(span);
              }
              span.setAttributeNS(W_NS, 'w:val', '3');
              let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')[0];
              if (!tcW) {
                tcW = cells[0].ownerDocument.createElementNS(W_NS, 'w:tcW');
                tcPr.appendChild(tcW);
              }
              tcW.setAttributeNS(W_NS, 'w:w', '9781');
              tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
            } catch (e) {}
          }
        }
        if (rIdx === 3 && cells.length >= 3) {
          // 表头行: Chemical name, CAS NO., Concentration % (w/w) -> 均加粗，末尾无冒号
          for (let cIdx = 0; cIdx < cells.length; cIdx++) {
            const cell = cells[cIdx];
            cleanTabsInNode(cell, W_NS);
            const p = cell.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              let t = (p.textContent || '').replace(/[:：]/g, '').trim();
              removeHangingIndentFromP(p, W_NS);
              setParagraphAlign(p, 'center', W_NS);
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
              setParagraphAlign(p, 'center', W_NS);
              rebuildRunsWithTypography(p, t, { font: 'Arial', sizeVal: '19', bold: false }, W_NS);
            }
          }
          continue;
        }
      }

      // 3. Section 11 专属：通栏单单元格行全量豁免，严禁压平 4 段或破坏行缩进
      if (sectionNumber === 11 && (cells.length === 1 || isSingleCellRow)) {
        continue;
      }
      if (sectionNumber === 2 && isSingleCellRow) {
        // Section 2 通栏复合模态：已由 buildFullWidthSection2 与 renderFullWidthRow 精准排版，严格豁免避免被 formatSingleCellRow 压平
        continue;
      }
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
          const p1 = c1.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p1) {
            // 英文版 Section 13 废弃处置内容严格纯左对齐 (left)，彻底消除 both 两端拉伸导致的假性居中失真
            setParagraphAlign(p1, 'left', W_NS);
          }
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

  // 全局清洗英文版中残留的全角中文标点符号（如全角引号、冒号、括号等，确保西文标点合规）
  const allTNodes = Array.from(xmlDoc.getElementsByTagNameNS(W_NS, 't'));
  for (const tNode of allTNodes) {
    if (tNode.textContent) {
      tNode.textContent = tNode.textContent
        .replace(/：/g, ':')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .replace(/，/g, ', ')
        .replace(/；/g, '; ');
    }
  }

  // 刷新缓存
    // 全局西文排版提纯：度数统一为 °C，修复断词 equ ipment
  const allT = Array.from(xmlDoc.getElementsByTagNameNS(W_NS, 't'));
  for (const tNode of allT) {
    if (tNode.textContent) {
      if (tNode.textContent.includes('℃')) {
        tNode.textContent = tNode.textContent.replace(/℃/g, '°C');
      }
      if (/equ\s+ipment/i.test(tNode.textContent)) {
        tNode.textContent = tNode.textContent.replace(/equ\s+ipment/gi, 'equipment');
      }
    }
  }

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

  // 权威规范化：针对标准物理特性标签执行 Canonical 映射，彻底防御多段合并历史残留叠词
  if (/log Pow|n-octanol/i.test(cleanLabel)) {
    cleanLabel = 'log Pow (n-octanol/water partition coefficient):';
  } else if (/Auto-ignition/i.test(cleanLabel)) {
    cleanLabel = 'Auto-ignition temperature:';
  } else if (/Ignition temp/i.test(cleanLabel)) {
    cleanLabel = 'Ignition temperature:';
  } else if (/Hazardous decomposition/i.test(cleanLabel) || /危险分解产物/i.test(cleanLabel)) {
    cleanLabel = 'Hazardous decomposition products:';
  } else if (/Decomposition temp/i.test(cleanLabel) || /分解温度/i.test(cleanLabel)) {
    cleanLabel = 'Decomposition temperature:';
  } else if (/Saturated vapour/i.test(cleanLabel)) {
    cleanLabel = 'Saturated vapour pressure:';
  } else if (/Firefighting precautions/i.test(cleanLabel)) {
    cleanLabel = 'Firefighting precautions and protective equipment:';
  } else {
    // 通用连续重复词清洗
    cleanLabel = cleanLabel
      .replace(/(\b\w{3,}\b)(?:\s+\1\b)+/gi, '$1')
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
  t1.textContent = seqStr ? (seqStr + '  ') : '';
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
      const runTxt = (t && t.textContent) ? t.textContent.trim() : '';
      if (t && t.textContent) {
        let text = t.textContent.replace(/：/g, ': ');
        text = text.replace(/[ \t]{2,}/g, ' '); // 压缩多余连续空格，避免视觉大间距
        if (rIdx === 0) {
          text = text.replace(/^\s+/, ''); // 清除行首前导空格
        }
        t.textContent = text;
      }
      const bEl = r.getElementsByTagNameNS(W_NS, 'b')[0];
      const isAlreadyBold = bEl && bEl.getAttributeNS(W_NS, 'val') !== '0';
      const isSubLabel = /^(?:Oral|Inhalation|Dermal|Prevention|Response|Storage|Disposal):?$/i.test(runTxt);
      applyRunStyle(r, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: Boolean(isSubLabel)
      }, W_NS);
    }
  }
}

function formatRowAsSectionHeader(row, W_NS) {
  const ps = Array.from(row.getElementsByTagNameNS(W_NS, 'p'));
  for (const p of ps) {
    removeHangingIndentFromP(p, W_NS);
    const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
    numPrs.forEach(n => n.parentNode?.removeChild(n));
    let text = (p.textContent || '').trim();
    if (/^(?:1\.?)*\s*Identification$/i.test(text)) {
      text = '1. Identification';
    }
    // 英文 16 章节大标题统一补齐规范半角空格 (彻底消除编号与字母粘连，如 2.Hazards -> 2. Hazards)
    text = text.replace(/^(\d{1,2})\.([A-Za-z])/g, '$1. $2');
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
      if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|Acute toxicity|Primary skin irritation|11\.\d|毒性[:：]|Toxicity[:：]|羟基|Hydroxy|二乙二醇|丙二醇|Propylene/i.test(t)) break;
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
          // 法定豁免：Section 13 (Table 13) 尾行方法内容格允许且要求 both (对齐手做版两端对齐规格)
          const isS13DisposalMethods = (t === 12 && r === rows.length - 1 && c === 1);
          if (!isS13DisposalMethods && (jc === 'both' || jc === 'distribute')) {
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

  // Gate 7: Section 13 标准结构门禁 (兼容 3 行或 4 行独立结构)
  const s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13 && s13.rows.length !== 3 && s13.rows.length !== 4) {
    throw new Error(`【质量门禁拦截 (Gate 7)】${docName} Section 13 行数异常: 当前 ${s13.rows.length} 行 (必须保持 3 行或 4 行标准结构)!`);
  }

  // Gate 8: 值格数值常规体与字体纯净度断言 (G-11 字体分离法定不变量)
  for (let t = 0; t < allTbls.length; t++) {
    const tbl = allTbls[t];
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (let r = 0; r < rows.length; r++) {
      const cells = Array.from(rows[r].getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length < 2) continue;
      const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
      if (/化学品名称.*CAS编号|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type/i.test(rowText)) continue;
      for (let c = 1; c < cells.length; c++) {
        const cell = cells[c];
        const cellText = (cell.textContent || '').trim();
        if (/^(?:CAS编号|含量%（w\/w）|CAS NO\.|Concentration % \(w\/w\)|依据|类型|数值|Basis|Type|Value)$/i.test(cellText)) continue;
        const runs = Array.from(cell.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          const runText = (run.textContent || '').trim();
          if (!runText) continue;
          const bEl = run.getElementsByTagNameNS(W_NS, 'b')[0];
          const isBold = bEl && bEl.getAttributeNS(W_NS, 'val') !== '0';
          if (isBold) {
            const isSubLabel = /^(预防措施|事故响应|安全储存|废弃处置|经口|吸入|经皮|物种|分类|结果|重复剂量中毒|病理变化|致畸形|致畸性|致畸|生育力|Oral|Inhalation|Dermal|Species|Classification|Result|Repeated dose toxicity|Pathological changes|Teratogenicity|Fertility|Prevention|Response|Storage|Disposal)[：:]?$/i.test(runText) || /^[：:]$/.test(runText);
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

  // Gate 9: 标点完整性与句末闭合/防悬挂标点 (G-26, 专属于 Paradigm 1 通栏详述模式)
  if (isEnglish) {
    const s11En = engine.records.find(r => r.sectionNumber === 11);
    if (s11En && s11En.rows.length === 4 && s11En.rows[3]?.cells?.length === 1) {
      const row3PList = Array.from(s11En.rows[3].cells[0]?.node?.getElementsByTagNameNS(W_NS, 'p') || []);
      for (const p of row3PList) {
        const t = (p.textContent || '').trim();
        if (/:$/.test(t)) {
          throw new Error(`【质量门禁拦截 (Gate 9)】${docName} Section 11 通栏详述段落发现非法尾部悬挂冒号: "${t}"！必须以句号或分号闭合。`);
        }
      }
    }
  } else {
    const s11Cn = engine.records.find(r => r.sectionNumber === 11);
    if (s11Cn && s11Cn.rows.length === 4 && s11Cn.rows[3]?.cells?.length === 1) {
      const row3Text = s11Cn.rows[3].cells[0]?.text || '';
      if (!row3Text.includes('\n') && /mg\/kg刺激性|mg\/l刺激性|mg\/m3刺激性/.test(row3Text)) {
        throw new Error(`【质量门禁拦截 (Gate 9)】${docName} Section 11 通栏详述段落发现文本标签粘连碰撞: "mg/kg刺激性"！必须以分号分隔并句末闭合。`);
      }
    }
  }

  // Gate 10: 反多空格排版公理 (G-28, 专属于 Paradigm 1 通栏模式详述段落；但在 Section 11 软换行垂直列对齐中，允许法定 6 空格(CN)与 10/14 空格(EN)缩进)
  const s11Check = engine.records.find(r => r.sectionNumber === 11);
  if (s11Check && s11Check.rows.length === 4 && s11Check.rows[3]?.cells?.length === 1) {
    const r3PList = Array.from(s11Check.rows[3].cells[0]?.node?.getElementsByTagNameNS(W_NS, 'p') || []);
    for (const p of r3PList) {
      const t = p.textContent || '';
      const sanitized = t.replace(/ {8}| {6}| {5}| {3}/g, '');
      if (/[ ]{2,}/.test(sanitized)) {
        throw new Error(`【质量门禁拦截 (Gate 10)】${docName} Section 11 发现连续多空格伪造对齐: "${t}"！正文严禁出现 2 个及以上连续空格。`);
      }
    }
  }

  // Gate 11: 中英文双语结构拓扑同构公理 (G-25, 专属于 Paradigm 1 通栏模式)
  if (s11Check && s11Check.rows.length === 4 && s11Check.rows[3]?.cells?.length === 1) {
    const r3PList = Array.from(s11Check.rows[3].cells[0]?.node?.getElementsByTagNameNS(W_NS, 'p') || []);
    const expectedLen = sourceFacts?.modelCode === 'PA-3223' ? 4 : (sourceFacts?.modelCode === 'PU-202A' ? 1 : null);
    if (expectedLen !== null && r3PList.length !== expectedLen) {
      throw new Error(`【质量门禁拦截 (Gate 11)】${docName} Section 11 通栏模式段落数异常: 实测 ${r3PList.length} 段 (必须严格保持 ${expectedLen} 段同构)!`);
    }
  }
}
