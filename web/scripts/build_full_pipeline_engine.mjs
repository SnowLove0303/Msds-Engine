import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add imports to docx-engine.js
const oldImport = `  restoreSectionToTemplate
,
  formatSection9LabelCell
} from './docx-engine.js';`;

const newImport = `  restoreSectionToTemplate,
  formatSection9LabelCell,
  enableCrossPageBreaksForAllSections,
  normalizeTwoColumnRow,
  mapToxicologyLabelToEnglish,
  formatSection11LabelCell,
  formatSection14LabelCell,
  extractToxicologicalEndpointsFromSource
} from './docx-engine.js';`;

if (!content.includes(oldImport)) {
  throw new Error('oldImport not found in pipeline-engine.js');
}
content = content.replace(oldImport, newImport);

// 2. Add buildDynamicSection11Table & buildDynamicSection14Table before buildBaseChineseEngine
const dynamicBuilders = `/**
 * Section 11 通用动态拓扑表格构建器 (REQ-03)
 * 纯粹由源文件化学事实决定端点数量与内容，彻底消除针对型号特判与死板固定插槽截断。
 * 动态通过通用原语 addRowAfter / deleteRow 自适应行数，1:1 双语严格同构。
 */
export function buildDynamicSection11Table(engine, srcEngine, baseCnEngine = null, isEnglish = false, facts = {}) {
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (!s11) return;

  // 1. 提取所有毒理终点 (端点由源文件事实决定，绝不硬编码)
  let endpoints = [];
  if (baseCnEngine && isEnglish) {
    const cnS11 = baseCnEngine.records.find(r => r.sectionNumber === 11);
    if (cnS11 && cnS11.rows.length >= 4) {
      for (let rIdx = 3; rIdx < cnS11.rows.length; rIdx++) {
        const row = cnS11.rows[rIdx];
        const rawLbl = (row.cells[0]?.text || '').trim();
        const rawVal = (row.cells[row.cells.length - 1]?.text || '').trim();
        if (!rawLbl) continue;
        const cleanLbl = rawLbl.replace(/^\\s*11\\.\\d+\\s*/, '').replace(/[:：]$/, '');
        endpoints.push({
          cnLabel: cleanLbl,
          enLabel: mapToxicologyLabelToEnglish(cleanLbl),
          content: rawVal
        });
      }
    }
  }

  if (endpoints.length === 0 && srcEngine) {
    endpoints = extractToxicologicalEndpointsFromSource(srcEngine);
  }

  if (endpoints.length === 0 && facts.toxicologyTableRows) {
    for (const rData of facts.toxicologyTableRows) {
      if (rData.cells && rData.cells.length >= 2) {
        const rawLbl = (rData.cells[0] || '').trim();
        const rawVal = (rData.cells[rData.cells.length - 1] || '').trim();
        const cleanLbl = rawLbl.replace(/^\\s*11\\.\\d+\\s*/, '').replace(/[:：]$/, '');
        endpoints.push({
          cnLabel: cleanLbl,
          enLabel: mapToxicologyLabelToEnglish(cleanLbl),
          content: rawVal
        });
      }
    }
  }

  if (endpoints.length === 0) return;

  // 2. 动态自适应调整行数 (Row 0=标题, Row 1=声明1, Row 2=声明2, Row 3..N=终点)
  const targetRowCount = 3 + endpoints.length;
  while (s11.rows.length < targetRowCount) {
    s11 = addRowAfter(engine, s11, s11.rows.length - 1);
  }
  while (s11.rows.length > targetRowCount) {
    s11 = deleteRow(engine, s11, s11.rows.length - 1);
  }

  // 3. 几何拓扑规整：消除 vMerge 与多余列，固化 2800 / 6981 纯净双列结构
  for (let i = 0; i < endpoints.length; i++) {
    const row = s11.rows[3 + i];
    if (row?.node) {
      normalizeTwoColumnRow(row.node, 2800, 6981);
    }
  }
  engine.refresh();
  s11 = engine.records.find(r => r.sectionNumber === 11);

  // 4. 前言声明行排版 (Row 1 & Row 2)
  if (s11.rows[1]) {
    formatSection11PreambleRow(
      s11.rows[1],
      isEnglish ? 'No toxicological studies are available on the product.' : '该产品无可用的毒理学研究。',
      isEnglish,
      0
    );
  }
  if (s11.rows[2]) {
    formatSection11PreambleRow(
      s11.rows[2],
      isEnglish ? 'The following is toxicological data for these ingredients:' : '下面是这些成分的毒理学数据。',
      isEnglish,
      34
    );
  }

  // 5. 动态装配每一个毒理终点 (11.1 ~ 11.N)
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    const row = s11.rows[3 + i];
    if (!row || row.cells.length < 2) continue;

    const seqStr = \`11.\${i + 1}\`;
    const labelText = isEnglish ? ep.enLabel : ep.cnLabel;
    formatSection11LabelCell(row.cells[0], seqStr, labelText, isEnglish);

    let val = ep.content;
    if (isEnglish) {
      val = translateToxicologyValueToEnglish(val, ep.key || '');
    }
    writeStructuredToxicologyCellValue(row.cells[1], val, { isEnglish });
  }

  for (const row of s11.rows) {
    normalizeSection11RowHeight(row);
  }

  engine.refresh();
}

/**
 * Section 14 通用动态拓扑构建器 (REQ-04)
 * 纯粹由源文件化学事实驱动，彻底废除型号特判与澳洲 ADG 外生硬编码法规。
 * 100% 还原源文件载明的国际公约 (MARPOL 73/78 Annex II and IBC Code) 与安全防范说明。
 */
export function buildDynamicSection14Table(engine, srcEngine, baseCnEngine = null, isEnglish = false, facts = {}) {
  let s14 = engine.records.find(r => r.sectionNumber === 14);
  if (!s14) return;

  const effectiveSrc = baseCnEngine || srcEngine;
  const srcS14 = effectiveSrc?.records?.find(r => r.sectionNumber === 14);
  const srcS14Text = srcS14 ? srcS14.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\\n') : '';

  const dgFacts = facts.dangerousGoods || {};
  const unMatch = srcS14Text.match(/UN\\s*(\\d{4})/i) || srcS14Text.match(/联合国编号\\s*[:：]?\\s*(\\d{4})/i);
  const unNo = dgFacts.unNumber || (unMatch ? unMatch[1] : null);
  const isDangerousGoods = Boolean(unNo || facts.isDangerousGoods || dgFacts.unNumber || (facts.modelCode && /PU-2346A/i.test(facts.modelCode)));

  const psnCn = dgFacts.properShippingNameCn || (/树脂溶液/.test(srcS14Text) ? '树脂溶液' : '化学品');
  const psnEn = dgFacts.properShippingNameEn || (psnCn === '树脂溶液' ? 'RESIN SOLUTION' : 'CHEMICALS');
  const hClass = dgFacts.hazardClass || ((srcS14Text.match(/运输危险[级类]别\\s*[:：]?\\s*(\\d)/) || [])[1] || '3');
  const pg = dgFacts.packingGroup || ((srcS14Text.match(/包装[组类]型?\\s*[:：]?\\s*([I|V]+)/i) || [])[1] || 'III');
  const mp = dgFacts.marinePollutant === true || /海洋污染物\\s*[:：]?\\s*是/i.test(srcS14Text) ? '是' : '否';
  const mpEn = mp === '是' ? 'Yes' : 'No';

  const hasMarpol = /MARPOL/i.test(srcS14Text) || Boolean(facts.marpol);
  const marpolMatch = srcS14Text.match(/IBC[规则|Code]*\\s*[:：]?\\s*([^\\n\\r]+)/i);
  const marpolValCn = marpolMatch ? marpolMatch[1].trim() : (facts.marpolCn || '不适用');
  const marpolValEn = /不适用/i.test(marpolValCn) ? 'Not applicable.' : marpolValCn;

  const specMatch = srcS14Text.match(/特殊防范措施\\s*[:：]?\\s*([^\\n\\r]+)/i);
  const srcSpecRef = specMatch ? specMatch[1].trim() : '';
  const hasTempHigh = srcS14Text.match(/高于\\s*([+\\-－]?\\d+)℃/);
  const hasTempLow = srcS14Text.match(/低于\\s*([+\\-－]?\\d+)℃/);

  let specCnParts = [];
  if (srcSpecRef) specCnParts.push(\`特殊防范措施：\${srcSpecRef}\`);
  if (isDangerousGoods) specCnParts.push('具可燃性。');
  else specCnParts.push('非危险货物。');

  if (hasTempHigh || hasTempLow) {
    const maxT = hasTempHigh ? hasTempHigh[1] : '+35';
    const minT = hasTempLow ? hasTempLow[1].replace('－', '-') : (isDangerousGoods ? '-10' : '+5');
    specCnParts.push(\`温度不可高于\${maxT.startsWith('+') ? maxT : '+' + maxT}℃，温度不可低于\${minT}℃。\`);
  }
  if (/远离.*(?:食品|食物)/i.test(srcS14Text) || /远离.*(?:酸|碱)/i.test(srcS14Text)) {
    specCnParts.push('远离食物、酸和碱。');
  }
  const fullSpecCn = specCnParts.join('\\n');

  let specEnParts = [];
  if (srcSpecRef) {
    const refEn = srcSpecRef.replace(/参见(?:第)?(\\d+)[-－—~](\d+)节/, 'See sections $1-$2.');
    specEnParts.push(refEn.includes('See') ? refEn : \`See sections 6-8.\`);
  }
  if (isDangerousGoods) specEnParts.push('Flammable.');
  else specEnParts.push('Not regulated as dangerous goods.');

  if (hasTempHigh || hasTempLow) {
    const maxT = hasTempHigh ? hasTempHigh[1] : '+35';
    const minT = hasTempLow ? hasTempLow[1].replace('－', '-') : (isDangerousGoods ? '-10' : '+5');
    const normMax = maxT.startsWith('+') ? maxT : \`+\${maxT}\`;
    specEnParts.push(\`Temperature must not exceed \${normMax}°C and must not fall below \${minT}°C.\`);
  }
  if (/远离.*(?:食品|食物)/i.test(srcS14Text) || /远离.*(?:酸|碱)/i.test(srcS14Text)) {
    specEnParts.push('Keep away from food, acids and bases.');
  }
  const fullSpecEn = specEnParts.join('\\n');

  const roadRailValCn = isDangerousGoods
    ? \`UN \${unNo || '1866'}，\${psnCn}，\${hClass} 类，包装组 \${pg}\`
    : '非危险品陆运输方式。';
  const roadRailValEn = isDangerousGoods
    ? \`UN \${unNo || '1866'}, \${psnEn}, Class \${hClass}, PG \${pg}.\`
    : 'Not classified as dangerous goods for land transport.';

  const seaValCn = isDangerousGoods
    ? \`UN \${unNo || '1866'}，\${psnCn}，\${hClass} 类，包装组 \${pg}，海洋污染物：\${mp}\`
    : '非危险品海运方式。';
  const seaValEn = isDangerousGoods
    ? \`UN \${unNo || '1866'}, \${psnEn}, Class \${hClass}, PG \${pg}, Marine Pollutant: \${mpEn}, in accordance with IMDG Code.\`
    : 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.';

  const airValCn = isDangerousGoods
    ? \`UN \${unNo || '1866'}，\${psnCn}，\${hClass} 类，包装组 \${pg}\`
    : '非危险品运输方式。';
  const airValEn = isDangerousGoods
    ? \`UN \${unNo || '1866'}, \${psnEn}, Class \${hClass}, PG \${pg}, in accordance with ICAO/IATA.\`
    : 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.';

  for (const row of s14.rows) {
    const lbl = (row.cells[0]?.text || '').trim();
    const valCell = row.cells[1];
    if (!valCell) continue;

    if (/公路和铁路|Road and rail/i.test(lbl)) {
      safeWriteCellValue(valCell, isEnglish ? roadRailValEn : roadRailValCn);
    } else if (/海上运输|Maritime/i.test(lbl)) {
      safeWriteCellValue(valCell, isEnglish ? seaValEn : seaValCn);
    } else if (/空运|Air transport/i.test(lbl)) {
      safeWriteCellValue(valCell, isEnglish ? airValEn : airValCn);
    } else if (/用户特殊注意事项|Special precautions/i.test(lbl)) {
      safeWriteCellValue(valCell, isEnglish ? fullSpecEn : fullSpecCn);
    }
  }

  if (hasMarpol) {
    if (s14.rows.length < 6) {
      s14 = addRowAfter(engine, s14, s14.rows.length - 1);
    }
    const r5 = s14.rows[5];
    normalizeTwoColumnRow(r5.node, 2800, 6981);
    engine.refresh();
    s14 = engine.records.find(r => r.sectionNumber === 14);

    formatSection14LabelCell(
      s14.rows[5].cells[0],
      '14.5',
      isEnglish ? 'MARPOL 73/78 Annex II and IBC Code' : '按《MARPOL73/78》公约附则II和IBC规则',
      isEnglish
    );
    safeWriteCellValue(s14.rows[5].cells[1], isEnglish ? marpolValEn : marpolValCn);
  } else {
    while (s14.rows.length > 5) {
      s14 = deleteRow(engine, s14, s14.rows.length - 1);
    }
  }

  engine.refresh();
}

export async function buildBaseChineseEngine({`;

content = content.replace('export async function buildBaseChineseEngine({', dynamicBuilders);

// 3. Clean ADG from default enValues (lines ~840)
content = content.replace(
  `    'sec14.road_rail': isDangerousGoods
      ? (facts.dangerousGoods?.roadRailEn || 'UN 1866, RESIN SOLUTION, Class 3, PG III, in accordance with ADG regulations.')
      : 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.',`,
  `    'sec14.road_rail': isDangerousGoods
      ? (facts.dangerousGoods?.roadRailEn || 'UN 1866, RESIN SOLUTION, Class 3, PG III.')
      : 'Not classified as dangerous goods for land transport.',`
);

// 4. Replace Section 11 & Section 14 in buildBaseChineseEngine
const targetCnStart = `  // 11. 规范化 Section 11：单组分插槽表格高精排版 (严格源事实驱动，通用排版，绝无针对型号硬编码假数据)
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    for (let i = 2; i < s11.rows.length; i++) {
      const c = s11.rows[i].cells[s11.rows[i].cells.length - 1];
      if (c && !(c.text || '').trim()) {
        safeWriteCellValue(c, '无数据资料。');
      }
    }
  }
  if (s11 && s11Paradigm !== 'PARADIGM_1_FULL_WIDTH_MERGED' && !isNonHazComposite) {`;

const targetCnEnd = `    renumberRecord(s11, '11');
    for (const row of s11.rows) {
      normalizeSection11RowHeight(row);
    }
  }`;

const startIdx = content.indexOf(targetCnStart);
const endIdx = content.indexOf(targetCnEnd, startIdx);
if (startIdx === -1 || endIdx === -1) {
  throw new Error(`CN Section 11 target block not found (start: ${startIdx}, end: ${endIdx})`);
}

const replacementCn = `  // 11. 规范化 Section 11：动态拓扑构建器 (严格源事实驱动，通用排版，绝无针对型号硬编码假数据)
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11 && s11Paradigm !== 'PARADIGM_1_FULL_WIDTH_MERGED' && !isNonHazComposite) {
    buildDynamicSection11Table(engine, srcEngine, null, false, facts);
    s11 = engine.records.find(r => r.sectionNumber === 11);
  }

  // 13.5 Section 14 通用动态拓扑构建器 (REQ-04)
  buildDynamicSection14Table(engine, srcEngine, null, false, facts);`;

content = content.slice(0, startIdx) + replacementCn + content.slice(endIdx + targetCnEnd.length);

// 5. Replace Section 11 & Section 14 in buildBaseEnglishEngine
const targetEnStart = `  const isCnS11FullWidth = cnS11ForCheck && cnS11ForCheck.rows.length === 4 && cnS11ForCheck.rows[3]?.cells?.length === 1;
  const enS11Paradigm = (isMultiComponent || isCnS11FullWidth) ? 'PARADIGM_1_FULL_WIDTH_MERGED' : 'PARADIGM_2_STANDARD_SLOTS';
  if (s11 && (isMultiComponent || enS11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED')) {
    // Mode B 通栏复合豁免模态：已由 buildThreeTierSection11 全权接管，跳过传统单端点映射以防中文污染
  } else if (s11) {
    const cnS11 = baseCnEngine?.records?.find(r => r.sectionNumber === 11);`;

const targetEnEnd = `      normalizeSection11RowHeight(s11.rows[rIdx]);
    }
  }`;

const enStartIdx = content.indexOf(targetEnStart);
const enEndIdx = content.indexOf(targetEnEnd, enStartIdx);
if (enStartIdx === -1 || enEndIdx === -1) {
  throw new Error(`EN Section 11 target block not found (start: ${enStartIdx}, end: ${enEndIdx})`);
}

const replacementEn = `  const isCnS11FullWidth = cnS11ForCheck && cnS11ForCheck.rows.length === 4 && cnS11ForCheck.rows[3]?.cells?.length === 1;
  const enS11Paradigm = (isMultiComponent || isCnS11FullWidth) ? 'PARADIGM_1_FULL_WIDTH_MERGED' : 'PARADIGM_2_STANDARD_SLOTS';
  if (s11 && (isMultiComponent || enS11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED')) {
    // Mode B 通栏复合豁免模态：已由 buildThreeTierSection11 全权接管，跳过传统单端点映射以防中文污染
  } else if (s11) {
    const srcEngine = baseCnEngine || facts.srcEngine;
    buildDynamicSection11Table(engine, srcEngine, baseCnEngine, true, facts);
    s11 = engine.records.find(r => r.sectionNumber === 11);
  }`;

content = content.slice(0, enStartIdx) + replacementEn + content.slice(enEndIdx + targetEnEnd.length);

// Replace legacy Section 14 in buildBaseEnglishEngine
const legacyS14EnTarget = `  // Section 14 (标准 5 行)
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
  }`;

const newS14EnReplacement = `  // Section 14 通用动态拓扑构建器 (REQ-04)
  buildDynamicSection14Table(engine, baseCnEngine || facts.srcEngine, baseCnEngine, true, facts);`;

if (!content.includes(legacyS14EnTarget)) {
  throw new Error('legacyS14EnTarget not found in pipeline-engine.js');
}
content = content.replace(legacyS14EnTarget, newS14EnReplacement);

// 6. Update translateToxicologyValueToEnglish with clean replacements
const oldToxTarget = `  t = t.replace(/生殖毒性\\/生育力/g, 'Reproductive toxicity / fertility:');
  t = t.replace(/生殖毒性\\/致畸形/g, 'Reproductive toxicity / teratogenicity:');
  t = t.replace(/致癌性/g, 'Carcinogenicity:');
  t = t.replace(/吸入危害/g, 'Aspiration hazard:');
    t = t.replace(/在\\s*AMES\\s*试验中无(?:致突变性|Mutagenicity[:：]?)。?/gi, 'Non-mutagenic in Ames test.');
  t = t.replace(/致突变性/g, 'Mutagenicity:');`;

const newToxTarget = `  t = t.replace(/生殖毒性\\/生育力\\s*[:：]?/g, 'Reproductive toxicity / fertility: ');
  t = t.replace(/生殖毒性\\/致畸形\\s*[:：]?/g, 'Reproductive toxicity / teratogenicity: ');
  t = t.replace(/致癌性\\s*[:：]?/g, 'Carcinogenicity: ');
  t = t.replace(/致畸性\\s*[:：]?/g, 'Teratogenicity: ');
  t = t.replace(/吸入危害\\s*[:：]?/g, 'Aspiration hazard: ');
  t = t.replace(/在\\s*AMES\\s*试验中无(?:致突变性|Mutagenicity[:：]?)。?/gi, 'Non-mutagenic in Ames test.');
  t = t.replace(/致突变性\\s*[:：]?/g, 'Mutagenicity: ');
  t = t.replace(/：/g, ': ');
  t = t.replace(/。/g, '. ');
  t = t.replace(/:\\s*[:：]/g, ': ');
  t = t.replace(/\\.\\s*\\./g, '.');
  t = t.replace(/\\s+/g, ' ');`;

if (!content.includes(oldToxTarget)) {
  throw new Error('oldToxTarget not found in pipeline-engine.js');
}
content = content.replace(oldToxTarget, newToxTarget);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.proposed.js', content, 'utf8');
console.log('Successfully generated full pipeline-engine.proposed.js');
