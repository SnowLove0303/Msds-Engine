import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import {
  loadDocx,
  extractSemanticSnapshot,
  applySemanticOverrides,
  writeCellValue,
  writeCellLabel,
  updateHeaderFooterData,
  addRowAfter,
  deleteRow,
  renumberRecord
} from './src/docx-engine.js';
import { convertBatchDocxToPdf } from './src/pdf-converter.js';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

function tableRecords(engine) {
  return (engine?.records || []).filter((r) => r.kind === 'table');
}

// 英文事实模型构造器 (遵循国际化化工 SDS 规范与专业术语库)
function buildEnglishValues(modelCode, cnSolids, cnWaterRange, cnEtherRange) {
  return {
    // Section 1
    'sec1.product_name': `Waterborne epoxy emulsion ${modelCode}`,
    'sec1.chemical_category': 'Epoxy water dispersion',
    'sec1.recommended_use': 'Raw material for coatings',
    'sec1.supplier_name': 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
    'sec1.supplier_address': 'Room 1106, Area A, Guangzhou International Business Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou',
    'sec1.telephone': '86-20-82567990',
    'sec1.fax': '86-20-32214789',

    // Section 2
    'sec2.ghs_classification': 'GHS hazard class:\nHazardous to the aquatic environment - Chronic Hazard, Category 3 (H412)',
    'sec2.ghs_label_elements': 'GHS pictogram\nPropylene glycol monomethyl ether\nHazard statements:\nH412 Harmful to aquatic life with long lasting effects.',
    'sec2.precautionary_statements': 'Prevention:\nP273 Avoid release to the environment.\nDisposal:\nP501 Dispose of contents/container to a qualified waste treatment plant.',
    'sec2.other_hazards': 'No applicable information.',

    // Section 3
    'sec3.product_type': 'Mixture',
    'sec3.comp1_name': 'Modified epoxy polymer',
    'sec3.comp1_cas': 'Trade secret',
    'sec3.comp1_conc': '45-55',
    'sec3.comp2_name': 'Water',
    'sec3.comp2_cas': '7732-18-5',
    'sec3.comp2_conc': cnWaterRange,
    'sec3.comp3_name': 'Propylene glycol monomethyl ether',
    'sec3.comp3_cas': '107-98-2',
    'sec3.comp3_conc': cnEtherRange,

    // Section 4
    'sec4.general_advice': 'Immediately remove all contaminated clothing.',
    'sec4.ingestion': 'Do NOT induce vomiting. Seek medical attention immediately.',
    'sec4.eye_contact': 'Hold eyelids open and flush with plenty of warm water for at least 10 minutes. Consult an ophthalmologist.',
    'sec4.skin_contact': 'Wash immediately with plenty of soap and water. If skin reaction occurs, seek medical advice.',
    'sec4.inhalation': 'If respiratory irritation occurs, seek medical advice.',

    // Section 5
    'sec5.suitable_extinguishing': 'Carbon dioxide (CO2), foam, extinguishing powder. For large fires, use water spray.',
    'sec5.unsuitable_extinguishing': 'High-volume water jet.',
    'sec5.specific_hazards': 'Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide. Do not breathe fumes/smoke in case of fire or explosion.',
    'sec5.protective_equipment': 'Firefighters must wear self-contained breathing apparatus. Do not allow contaminated fire-fighting water to enter soil, groundwater, or surface water.',

    // Section 6
    'sec6.personal_precautions': 'Wear protective equipment. Ensure adequate ventilation. Keep unauthorized persons away.',
    'sec6.environmental_precautions': 'Do not discharge into drains, wastewater, or soil.',
    'sec6.cleaning_method': 'Absorb with chemical absorbent material or dry sand if necessary, and store in tightly closed containers.',

    // Section 7
    'sec7.handling': 'Observe common chemical precautions during handling. Avoid contact with skin and eyes. Keep away from food, drink and tobacco. Wash hands before breaks and at the end of workday. Store work clothing separately. Change contaminated or soaked clothing.',
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
    'sec9.appearance': 'Milky white liquid',
    'sec9.odour_threshold': 'No data available.',
    'sec9.ph': 'No data available.',
    'sec9.ionicity': 'Non-ionic',
    'sec9.boiling_point': 'Approx. 100℃',
    'sec9.flash_point': 'No flash point below initial boiling point',
    'sec9.evaporation_rate': 'No data available.',
    'sec9.flammability': 'Not applicable',
    'sec9.combustion_value': 'Not applicable',
    'sec9.saturated_vapour': 'No data available.',
    'sec9.vapour_density': 'No data available.',
    'sec9.density': 'Approx. 1.06 g/cm³',
    'sec9.solubility': 'Miscible',
    'sec9.surface_tension': 'No data available.',
    'sec9.partition_coefficient': 'No data available.',
    'sec9.auto_ignition': 'Not applicable',
    'sec9.ignition_temp': 'No data available.',
    'sec9.decomposition_temp': 'No data available.',
    'sec9.viscosity': '200-5000 mPa.s',
    'sec9.explosive': 'No data available.',
    'sec9.dust_explosion': 'No data available.',
    'sec9.solids': cnSolids,
    'sec9.other_info': 'The above data are not product specifications. Please refer to the Technical Data Sheet for specifications.',

    // Section 10
    'sec10.stability': 'No decomposition if used according to specifications.',
    'sec10.hazardous_decomp': 'Flammable and harmful gases generated during thermal decomposition.',
    'sec10.hazardous_reactions': 'No hazardous reactions when stored and handled correctly.',

    // Section 11 (严格对应基准文档，消除无关成分与中文残留，标准 2 行)
    'sec11.toxicological': 'No toxicological studies are available for this product.',

    // Section 12 (严格对应基准文档，消除无关物质与中文残留，标准 4 行)
    'sec12.ecotoxicity': 'According to ecotoxicological data, the product is classified as non-hazardous to fish and daphnia.',
    'sec12.persistence': 'The product is not readily biodegradable.',
    'sec12.other_effects': 'No data available.',

    // Section 13 (标准 3 行结构)
    'sec13.general': 'Dispose of in accordance with applicable national standards and national or local regulations.\nWithin the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
    'sec13.methods': 'Empty containers as completely as possible (e.g., by pouring, scraping, or draining until “drip-dry”).\nThey may be sent to an appropriate collection point under existing chemical industry recycling schemes.\nRecycle containers in accordance with national regulations and applicable environmental requirements.\nDo not discharge waste via wastewater.',

    // Section 14
    'sec14.road_rail': 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.',
    'sec14.sea': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
    'sec14.air': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
    'sec14.special_precautions': 'Not regulated as dangerous goods. Temperature must not exceed +40℃ and must not fall below +5℃. Keep away from food, acids and bases.',

    // Section 15 (法规清单全英文化)
    'sec15.regulations': 'Relevant safety, health and environmental regulations for the substance or mixture',
    'sec15.r4': 'Regulations on the Safety Administration of Hazardous Chemicals (State Council Decree No. 591)',
    'sec15.r5': 'GB/T 16483-2008 Safety Data Sheet for Chemical Products - Content and Order of Sections',
    'sec15.r6': 'GB 13690-2009 General Rules for Classification and Hazard Communication of Chemicals',
    'sec15.r7': 'GB 30000.2-29 Safety Rules for Classification and Labelling of Chemicals',
    'sec15.r8': 'GB 15258 General Rules for Preparation of Precautionary Labels for Chemicals',

    // Section 16
    'sec16.other': 'To the best of our knowledge, the information provided in this Safety Data Sheet is accurate as of the date of publication. The information given is designed only as guidance for safe handling, use, processing, storage, transportation, disposal, and release and is not to be considered a warranty or quality specification. The information relates only to the specific material designated and may not be valid for such material used in combination with any other materials or in any process, unless specified in the text.'
  };
}

async function buildEnglishDocx(templateBuffer, modelCode, companyName, enValues) {
  const engine = await loadDocx(templateBuffer, `MSDS_EN_${modelCode}.docx`);
  
  // 1. 设置页眉页脚 (通过底层 XML 物理覆写)
  updateHeaderFooterData(engine, {
    model: modelCode,
    company: companyName,
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: '2026/10/10',
    language: 'EN',
    entity: companyName.includes('Guanzhi') ? '冠志' : '国彩'
  });

  const safeWrite = (cell, val) => {
    if (cell && val !== undefined && val !== null) {
      if (!cell.editable) {
        cell.editable = true;
      }
      writeCellValue(cell, val);
    }
  };

  const safeWriteLabel = (cell, val) => {
    if (cell && val !== undefined && val !== null) {
      writeCellLabel(cell, val, true);
    }
  };

  // 2. 逐章节填答与结构修剪
  // Section 1: 物料及供应商标识
  const s1 = engine.records.find(r => r.sectionNumber === 1);
  if (s1) {
    for (const row of s1.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Product name/i.test(lbl)) safeWrite(c1, enValues['sec1.product_name']);
      else if (/Chemical category/i.test(lbl)) safeWrite(c1, enValues['sec1.chemical_category']);
      else if (/Product use suggestions/i.test(lbl)) safeWrite(c1, enValues['sec1.recommended_use']);
      else if (/Name of supplier/i.test(lbl)) safeWrite(c1, companyName);
      else if (/Supplier address/i.test(lbl)) safeWrite(c1, enValues['sec1.supplier_address']);
      else if (/Tel/i.test(lbl)) safeWrite(c1, enValues['sec1.telephone']);
      else if (/Fax/i.test(lbl)) safeWrite(c1, enValues['sec1.fax']);
    }
  }

  // Section 2: 危险性概述 (对齐中文基准 5 行结构：Row 0 题头，Row 1 2.1分类，Row 2 2.2标签要素，Row 3 2.3防范说明，Row 4 2.4其他危害)
  let s2 = engine.records.find(r => r.sectionNumber === 2);
  if (s2) {
    if (s2.rows[1]) {
      if (s2.rows[1].cells[0]) safeWriteLabel(s2.rows[1].cells[0], '2.1  Classification of the substance or mixture：');
      if (s2.rows[1].cells[1]) safeWrite(s2.rows[1].cells[1], enValues['sec2.ghs_classification']);
    }
    if (s2.rows[2]) {
      if (s2.rows[2].cells[0]) safeWriteLabel(s2.rows[2].cells[0], '2.2  GHS Label Elements：');
      if (s2.rows[2].cells[1]) safeWrite(s2.rows[2].cells[1], enValues['sec2.ghs_label_elements']);
    }
    if (s2.rows[3]) {
      if (s2.rows[3].cells[0]) safeWriteLabel(s2.rows[3].cells[0], '2.3  Precautionary Statements：');
      if (s2.rows[3].cells[1]) safeWrite(s2.rows[3].cells[1], enValues['sec2.precautionary_statements']);
    }
    if (s2.rows[4]) {
      if (s2.rows[4].cells[0]) safeWriteLabel(s2.rows[4].cells[0], '2.4  Other Hazards');
      if (s2.rows[4].cells[1]) safeWrite(s2.rows[4].cells[1], enValues['sec2.other_hazards']);
    }
    // 物理剪枝多余模板占位行 (G, H, I, K, L, M, N, O, P, Q)，收敛至 5 行精炼标准结构
    while (s2.rows.length > 5) {
      s2 = deleteRow(engine, s2, s2.rows.length - 1);
    }
  }

  // Section 3: 成分信息 (确保 3 行成分，纯英文)
  let s3 = engine.records.find(r => r.sectionNumber === 3);
  if (s3) {
    const r1 = s3.rows.find(r => /Product type/i.test(r.cells[0]?.text));
    if (r1 && r1.cells[1]) safeWrite(r1.cells[1], enValues['sec3.product_type']);

    if (s3.rows.length < 7) {
      s3 = addRowAfter(engine, s3, s3.rows.length - 1);
    }
    if (s3.rows[4]) {
      safeWrite(s3.rows[4].cells[0], enValues['sec3.comp1_name']);
      safeWrite(s3.rows[4].cells[1], enValues['sec3.comp1_cas']);
      safeWrite(s3.rows[4].cells[2], enValues['sec3.comp1_conc']);
    }
    if (s3.rows[5]) {
      safeWrite(s3.rows[5].cells[0], enValues['sec3.comp2_name']);
      safeWrite(s3.rows[5].cells[1], enValues['sec3.comp2_cas']);
      safeWrite(s3.rows[5].cells[2], enValues['sec3.comp2_conc']);
    }
    if (s3.rows[6]) {
      safeWrite(s3.rows[6].cells[0], enValues['sec3.comp3_name']);
      safeWrite(s3.rows[6].cells[1], enValues['sec3.comp3_cas']);
      safeWrite(s3.rows[6].cells[2], enValues['sec3.comp3_conc']);
    }
    while (s3.rows.length > 7) {
      s3 = deleteRow(engine, s3, s3.rows.length - 1);
    }
  }

  // Section 4: 急救措施
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

  // Section 5: 消防措施 (优先匹配 Unsuitable，确保 5.2 精准写入 High-volume water jet)
  const s5 = engine.records.find(r => r.sectionNumber === 5);
  if (s5) {
    for (const row of s5.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Unsuitable/i.test(lbl)) safeWrite(c1, enValues['sec5.unsuitable_extinguishing']);
      else if (/Suitable/i.test(lbl)) safeWrite(c1, enValues['sec5.suitable_extinguishing']);
      else if (/Special hazards/i.test(lbl)) safeWrite(c1, enValues['sec5.specific_hazards']);
      else if (/Firefighting precautions|Protective/i.test(lbl)) safeWrite(c1, enValues['sec5.protective_equipment']);
    }
  }

  // Section 6: 意外泄漏措施
  const s6 = engine.records.find(r => r.sectionNumber === 6);
  if (s6) {
    for (const row of s6.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Firefighting precautions|Personal/i.test(lbl)) safeWrite(c1, enValues['sec6.personal_precautions']);
      else if (/Environmental/i.test(lbl)) safeWrite(c1, enValues['sec6.environmental_precautions']);
      else if (/Methods and material|Clean/i.test(lbl)) safeWrite(c1, enValues['sec6.cleaning_method']);
    }
  }

  // Section 7: 操作与储存
  const s7 = engine.records.find(r => r.sectionNumber === 7);
  if (s7) {
    for (const row of s7.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Precautions for safe handling|Handling/i.test(lbl)) safeWrite(c1, enValues['sec7.handling']);
      else if (/Conditions for safe storage|Storage/i.test(lbl)) safeWrite(c1, enValues['sec7.storage']);
    }
  }

  // Section 8: 接触控制/个人防护 (收敛至 12 行，删除底模无关 HDI 表格)
  let s8 = engine.records.find(r => r.sectionNumber === 8);
  if (s8) {
    for (const row of s8.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (c1) {
        if (/Respiratory/i.test(lbl)) safeWrite(c1, enValues['sec8.respiratory_protection']);
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
    // 物理删除第 12 行起的底模无关工作场所限值表格 (HDI/PMA残留)，收敛至 12 行标准结构
    while (s8.rows.length > 12) {
      s8 = deleteRow(engine, s8, s8.rows.length - 1);
    }
  }

  // Section 9: 物理和化学特性 (覆盖全部属性，准确匹配 Solid content，中文字样替换为英文)
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
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
      else if (/Heat of combustion|Combustion value/i.test(lbl)) safeWrite(c1, enValues['sec9.combustion_value']);
      else if (/Saturated vapour/i.test(lbl)) safeWrite(c1, enValues['sec9.saturated_vapour']);
      else if (/Relative vapour/i.test(lbl)) safeWrite(c1, enValues['sec9.vapour_density']);
      else if (/Density/i.test(lbl)) safeWrite(c1, enValues['sec9.density']);
      else if (/Solubility/i.test(lbl)) safeWrite(c1, enValues['sec9.solubility']);
      else if (/Surface tension/i.test(lbl)) safeWrite(c1, enValues['sec9.surface_tension']);
      else if (/log Pow|Partition coefficient/i.test(lbl)) safeWrite(c1, enValues['sec9.partition_coefficient']);
      else if (/Auto-ignition/i.test(lbl)) safeWrite(c1, enValues['sec9.auto_ignition']);
      else if (/Ignition temp/i.test(lbl)) safeWrite(c1, enValues['sec9.ignition_temp']);
      else if (/Decomposition temp/i.test(lbl)) safeWrite(c1, enValues['sec9.decomposition_temp']);
      else if (/Dynamic viscosity/i.test(lbl)) safeWrite(c1, enValues['sec9.viscosity']);
      else if (/Explosive properties/i.test(lbl)) safeWrite(c1, enValues['sec9.explosive']);
      else if (/Dust explosion/i.test(lbl)) safeWrite(c1, enValues['sec9.dust_explosion']);
      else if (/Solid(?:s)?\s*content/i.test(lbl)) safeWrite(c1, enValues['sec9.solids']);
      else if (/Other information/i.test(lbl)) safeWrite(c1, enValues['sec9.other_info']);
      else if (/无数据|乳白/i.test(c1.text)) safeWrite(c1, 'No data available.');
    }
  }

  // Section 10: 稳定性和反应性 (收敛至 4 行)
  let s10 = engine.records.find(r => r.sectionNumber === 10);
  if (s10) {
    for (const row of s10.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Chemical stability/i.test(lbl)) safeWrite(c1, enValues['sec10.stability']);
      else if (/Hazardous decomposition/i.test(lbl)) safeWrite(c1, enValues['sec10.hazardous_decomp']);
      else if (/Possible hazardous|Possibility of hazardous/i.test(lbl)) safeWrite(c1, enValues['sec10.hazardous_reactions']);
      else if (/无数据/i.test(c1.text)) safeWrite(c1, 'No data available.');
    }
    while (s10.rows.length > 4) {
      s10 = deleteRow(engine, s10, s10.rows.length - 1);
    }
  }

  // Section 11: 毒理学信息 (彻底消除二乙二醇单丁醚与DMAc残留，收敛至与中文基准一致的标准 2 行)
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    if (s11.rows[1]?.cells[0]) safeWrite(s11.rows[1].cells[0], enValues['sec11.toxicological']);
    while (s11.rows.length > 2) {
      s11 = deleteRow(engine, s11, s11.rows.length - 1);
    }
  }

  // Section 12: 生态学信息 (彻底消除底模中文导语与无关物质行，收敛至与中文基准一致的标准 4 行)
  let s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12) {
    // 模板前两行为中文通则导语与无关物质行，物理删除以恢复 4 行基准结构
    s12 = deleteRow(engine, s12, 1);
    s12 = deleteRow(engine, s12, 1);
    for (const row of s12.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Ecotoxicity/i.test(lbl)) safeWrite(c1, enValues['sec12.ecotoxicity']);
      else if (/Persistence/i.test(lbl)) safeWrite(c1, enValues['sec12.persistence']);
      else if (/Other adverse/i.test(lbl)) safeWrite(c1, enValues['sec12.other_effects']);
    }
  }

  // Section 13: 废弃处置 (严格遵循 3 行金标，全英文)
  let s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13) {
    if (s13.rows.length === 4) {
      safeWrite(s13.rows[1].cells[0], enValues['sec13.general']);
      s13 = deleteRow(engine, s13, 2);
      if (s13.rows[2]?.cells[1]) safeWrite(s13.rows[2].cells[1], enValues['sec13.methods']);
    } else {
      if (s13.rows[1]?.cells[0]) safeWrite(s13.rows[1].cells[0], enValues['sec13.general']);
      if (s13.rows[2]?.cells[1]) safeWrite(s13.rows[2].cells[1], enValues['sec13.methods']);
    }
  }

  // Section 14: 运输信息 (修复 Maritime transport 正则匹配与全英文化)
  const s14 = engine.records.find(r => r.sectionNumber === 14);
  if (s14) {
    for (const row of s14.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Road and rail/i.test(lbl)) safeWrite(c1, enValues['sec14.road_rail']);
      else if (/Maritime transport|Sea transport/i.test(lbl)) safeWrite(c1, enValues['sec14.sea']);
      else if (/Air transport/i.test(lbl)) safeWrite(c1, enValues['sec14.air']);
      else if (/Special precautions/i.test(lbl)) safeWrite(c1, enValues['sec14.special_precautions']);
    }
  }

  // Section 15: 法规信息 (全量英文法规标准译名替换)
  const s15 = engine.records.find(r => r.sectionNumber === 15);
  if (s15) {
    if (s15.rows[1]?.cells[0]) safeWrite(s15.rows[1].cells[0], enValues['sec15.regulations']);
    if (s15.rows[4]?.cells[0]) safeWrite(s15.rows[4].cells[0], enValues['sec15.r4']);
    if (s15.rows[5]?.cells[0]) safeWrite(s15.rows[5].cells[0], enValues['sec15.r5']);
    if (s15.rows[6]?.cells[0]) safeWrite(s15.rows[6].cells[0], enValues['sec15.r6']);
    if (s15.rows[7]?.cells[0]) safeWrite(s15.rows[7].cells[0], enValues['sec15.r7']);
    if (s15.rows[8]?.cells[0]) safeWrite(s15.rows[8].cells[0], enValues['sec15.r8']);
  }

  // Section 16: 其他信息 (英文免责声明)
  const s16 = engine.records.find(r => r.sectionNumber === 16);
  if (s16) {
    if (s16.rows[1]?.cells[0]) safeWrite(s16.rows[1].cells[0], enValues['sec16.other']);
  }

  engine.records.filter(r => r.kind === 'table').forEach(renumberRecord);
  return engine;
}

// 主流水线处理
async function processModel({
  targetDir,
  modelCode,
  cnGroundTruthFile,
  cnSolids,
  cnWaterRange,
  cnEtherRange
}) {
  console.log(`\n======================================================`);
  console.log(`🚀 开始产出八格式 MSDS: 型号 ${modelCode}`);
  console.log(`目标输出目录: ${targetDir}`);
  console.log(`======================================================`);

  // 1. 读取权威中文基准底稿
  const cnBuf = await fs.readFile(cnGroundTruthFile);
  const cnGuanzhiEngine = await loadDocx(cnBuf, `${modelCode} msds_CN 冠志.docx`);
  
  // 确保页眉页脚数据一致 (通过底层 XML 物理覆写)
  updateHeaderFooterData(cnGuanzhiEngine, {
    model: modelCode,
    company: '广州冠志新材料科技有限公司',
    title: '物料安全数据表',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: '2026/10/10',
    language: 'CN',
    entity: '冠志'
  });

  // 规范化 Section 13 (消除错误拆行，保持与标准模板一致的 3 行结构，合并至单单元格换行段落)
  let s13Cn = cnGuanzhiEngine.records.find(r => r.sectionNumber === 13);
  if (s13Cn && s13Cn.rows.length === 4) {
    writeCellValue(s13Cn.rows[1].cells[0], '必须遵守适用的国标、国家或当地法规进行废弃。\n在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。');
    s13Cn = deleteRow(cnGuanzhiEngine, s13Cn, 2);
  }

  // 生成 1: CN 冠志 DOCX
  const cnGuanzhiDocxPath = path.join(targetDir, `${modelCode} msds_CN 冠志.docx`);
  const cnGuanzhiBuf = await cnGuanzhiEngine.exportArrayBuffer();
  await fs.writeFile(cnGuanzhiDocxPath, Buffer.from(cnGuanzhiBuf));
  console.log(`✅ [1/8] 成功生成: ${path.basename(cnGuanzhiDocxPath)} (${cnGuanzhiBuf.byteLength} bytes)`);

  // 生成 2: CN 国彩 DOCX
  const cnGuocaiDocxPath = path.join(targetDir, `${modelCode} msds_CN 国彩.docx`);
  const cnGuocaiEngine = await loadDocx(cnGuanzhiBuf.slice(0), `${modelCode} msds_CN 国彩.docx`);
  updateHeaderFooterData(cnGuocaiEngine, {
    model: modelCode,
    company: '英德市国彩新材料有限公司',
    title: '物料安全数据表',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: '2026/10/10',
    language: 'CN',
    entity: '国彩'
  });
  // 覆写 Section 1.3 供应商信息
  const s1Guocai = tableRecords(cnGuocaiEngine).find(r => r.sectionNumber === 1);
  if (s1Guocai) {
    for (const row of s1Guocai.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/供应商名称/i.test(lbl)) writeCellValue(c1, '英德市国彩新材料有限公司');
      else if (/供应商地址/i.test(lbl)) writeCellValue(c1, '广东省英德市白沙镇太平村更古坑凯迪工业园区');
      else if (/电话/i.test(lbl)) writeCellValue(c1, '86-763-2811205');
      else if (/传真/i.test(lbl)) writeCellValue(c1, '86-763-2811024');
    }
  }
  const cnGuocaiBuf = await cnGuocaiEngine.exportArrayBuffer();
  await fs.writeFile(cnGuocaiDocxPath, Buffer.from(cnGuocaiBuf));
  console.log(`✅ [2/8] 成功生成: ${path.basename(cnGuocaiDocxPath)} (${cnGuocaiBuf.byteLength} bytes)`);

  // 读取官方英文底模
  const enTplBuf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const enValues = buildEnglishValues(modelCode, cnSolids, cnWaterRange, cnEtherRange);

  // 生成 3: EN 冠志 DOCX
  const enGuanzhiDocxPath = path.join(targetDir, `${modelCode} msds_EN 冠志.docx`);
  const enGuanzhiEngine = await buildEnglishDocx(enTplBuf, modelCode, 'Guangzhou Guanzhi New Material Technology Co., Ltd.', enValues);
  const enGuanzhiBuf = await enGuanzhiEngine.exportArrayBuffer();
  await fs.writeFile(enGuanzhiDocxPath, Buffer.from(enGuanzhiBuf));
  console.log(`✅ [3/8] 成功生成: ${path.basename(enGuanzhiDocxPath)} (${enGuanzhiBuf.byteLength} bytes)`);

  // 生成 4: EN 国彩 DOCX
  const enGuocaiDocxPath = path.join(targetDir, `${modelCode} msds_EN 国彩.docx`);
  const enGuocaiValues = {
    ...enValues,
    'sec1.supplier_name': 'Yingde Guocai New Material Co., Ltd.',
    'sec1.supplier_address': 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde, Guangdong, China',
    'sec1.telephone': '86-763-2811205',
    'sec1.fax': '86-763-2811024'
  };
  const enGuocaiEngine = await buildEnglishDocx(enTplBuf, modelCode, 'Yingde Guocai New Material Co., Ltd.', enGuocaiValues);
  const enGuocaiBuf = await enGuocaiEngine.exportArrayBuffer();
  await fs.writeFile(enGuocaiDocxPath, Buffer.from(enGuocaiBuf));
  console.log(`✅ [4/8] 成功生成: ${path.basename(enGuocaiDocxPath)} (${enGuocaiBuf.byteLength} bytes)`);

  // 批量转译 4 份高保真 PDF
  console.log('🔄 开始调用 Windows COM / WPS 极速批量转译 4 份高保真 PDF...');
  const pdfResults = await convertBatchDocxToPdf([
    { docxBuffer: cnGuanzhiBuf, fileName: `${modelCode} msds_CN 冠志.docx` },
    { docxBuffer: cnGuocaiBuf, fileName: `${modelCode} msds_CN 国彩.docx` },
    { docxBuffer: enGuanzhiBuf, fileName: `${modelCode} msds_EN 冠志.docx` },
    { docxBuffer: enGuocaiBuf, fileName: `${modelCode} msds_EN 国彩.docx` },
  ]);

  for (let i = 0; i < pdfResults.length; i++) {
    const item = pdfResults[i];
    const pdfPath = path.join(targetDir, item.pdfName);
    await fs.writeFile(pdfPath, item.pdfBuffer);
    console.log(`✅ [${i + 5}/8] 成功生成: ${item.pdfName} (${item.size} bytes)`);
  }

  console.log(`🎉 型号 ${modelCode} 八格式交付物全部产出完成！`);
}

async function main() {
  // 1. 产出 EP-1702
  await processModel({
    targetDir: 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\EP-1702',
    modelCode: 'EP-1702',
    cnGroundTruthFile: 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\EP-1702\\EP-1702 msds_CN 冠志 (手动调整）.docx',
    cnSolids: '53±2%',
    cnWaterRange: '35-45',
    cnEtherRange: '2-8'
  });

  // 2. 产出 EP-1704 (文档实际型号 EP-1740)
  await processModel({
    targetDir: 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\EP-1704',
    modelCode: 'EP-1740',
    cnGroundTruthFile: 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\EP-1704\\EP-1740 msds_CN 冠志 （手动产出）.docx',
    cnSolids: '52±2%',
    cnWaterRange: '23-35',
    cnEtherRange: '17-25'
  });
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
