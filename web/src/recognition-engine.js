import fs from 'fs';
import { JSDOM } from 'jsdom';

// Ensure DOMParser and XMLSerializer are polyfilled in Node.js runtime
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx, extractAdaptiveRevisionDate } from './docx-engine.js';
import { decomposeCellPairToFacts, isLabelLike } from './smart-matching.js';

/**
 * 通用多段落单元格键值对解析包装器 (Universal Multi-Paragraph Cell-Pair Wrapper)
 */
export function extractMultiParagraphCellPairs(row) {
  if (!row || !row.cells) return [];
  return decomposeCellPairToFacts(row.cells[0], row.cells[1], row);
}

/**
 * MSDS-Engine 全景标准化识别系统 (Panoramic Recognition Engine)
 * 纯事实感知与全量无损提取中枢：
 * 1. 覆盖 16 个章节全部段落与表格，无任何遗漏（支持单表格内多章节合并自动拆分）；
 * 2. 精准识别结构形态：TWO_COLUMN (标准两列), EXPLANATION_ROW (说明行), FULL_WIDTH (通栏跨列), MULTI_COLUMN (三列及以上);
 * 3. 深入抽取字体与排版样式：字号 (pt), 字体族 (fontFamily), 粗体 (isBold), 对齐 (alignment), 缩进 (indent);
 * 4. 提取 16 章节全部专有语义字段与测试数据；
 * 5. 输出 100% 纯净 JSON 可序列化事实，彻底杜绝 DOM 循环引用。
 */

export const STRUCTURE_TYPES = {
  TWO_COLUMN: 'TWO_COLUMN',           // 标准两列 (Label + Value)
  EXPLANATION_ROW: 'EXPLANATION_ROW', // 引导说明行 / 单行提示
  FULL_WIDTH: 'FULL_WIDTH',           // 通栏跨列排版 (gridSpan 或单单元格占满)
  MULTI_COLUMN: 'MULTI_COLUMN'        // 三列及以上 (如多组分 CAS 表、接触限值表)
};

const SECTION_KEYWORDS = {
  1: /(?:标识|供应商|Identification|Supplier)/i,
  2: /(?:危险|概述|标签|Hazard)/i,
  3: /(?:成分|组成|资料|Composition|Ingredient)/i,
  4: /(?:急救|措施|First\s*aid)/i,
  5: /(?:消防|灭火|Fire)/i,
  6: /(?:泄漏|意外|应急|Accidental|Release)/i,
  7: /(?:操作|处置|储存|Handling|Storage)/i,
  8: /(?:接触|控制|防护|Exposure|Protection)/i,
  9: /(?:理化|物理|特性|Physical|Chemical)/i,
  10: /(?:稳定|反应|Stability|Reactivity)/i,
  11: /(?:毒理|毒性|Toxicological|Toxicity)/i,
  12: /(?:生态|环境|Ecological|Ecology)/i,
  13: /(?:废弃|处理|处置|Disposal)/i,
  14: /(?:运输|Transport)/i,
  15: /(?:法规|法律|Regulatory|Regulations)/i,
  16: /(?:其他|Other)/i
};

/**
 * 判定某一行是否为内嵌在表格中的新章节标题行
 */
function detectSectionHeaderInRow(row) {
  if (!row.cells || row.cells.length === 0) return null;
  const firstCellText = (row.cells[0]?.text || '').trim();

  const match = firstCellText.match(/^\s*(\d{1,2})[\.、\s]+(.*)$/);
  if (!match) return null;

  const secNum = Number(match[1]);
  if (secNum < 1 || secNum > 16) return null;

  const titlePart = match[2].trim();
  const kw = SECTION_KEYWORDS[secNum];
  if (kw && kw.test(titlePart)) {
    return { sectionNumber: secNum, title: firstCellText };
  }
  return null;
}

/**
 * 提取单元格主导的字体与排版样式 (纯数据对象)
 */
function extractCellTypography(cell) {
  const typography = {
    fontFamily: null,
    fontSizePt: null,
    isBold: false,
    isItalic: false,
    alignment: 'left',
    gridSpan: cell?.properties?.gridSpan || 1,
    widthDxa: cell?.properties?.width?.value || null
  };

  if (!cell?.paragraphs || cell.paragraphs.length === 0) return typography;

  const firstP = cell.paragraphs[0];
  if (firstP?.format?.alignment) {
    typography.alignment = firstP.format.alignment;
  }

  const runs = cell.paragraphs.flatMap(p => p.runs || []);
  if (runs.length > 0) {
    typography.isBold = runs.some(r => r.bold || r.format?.bold);
    typography.isItalic = runs.some(r => r.format?.italic);

    const firstRun = runs.find(r => r.format?.font || r.format?.sizeHalfPoints);
    if (firstRun) {
      if (firstRun.format?.font) typography.fontFamily = firstRun.format.font;
      if (firstRun.format?.sizeHalfPoints) {
        typography.fontSizePt = Number(firstRun.format.sizeHalfPoints) / 2;
      }
    }
  }

  return typography;
}

/**
 * 判定单行的结构形态
 */
function classifyRowStructure(row) {
  const cells = row.cells || [];
  const cellCount = cells.length;

  if (cellCount === 0) {
    return { type: STRUCTURE_TYPES.EXPLANATION_ROW, gridSpan: 1 };
  }

  if (cellCount === 1) {
    const c = cells[0];
    const span = c.properties?.gridSpan || 1;
    const txt = (c.text || '').trim();

    const isExplanation = /^(?:说明|注|注意|提示|下列|免责|适用|Note|Notice|Attention)[：:]/i.test(txt) ||
                          (txt.length < 50 && /[：:]$/.test(txt));

    return {
      type: isExplanation ? STRUCTURE_TYPES.EXPLANATION_ROW : STRUCTURE_TYPES.FULL_WIDTH,
      gridSpan: span
    };
  }

  if (cellCount === 2) {
    const c0 = cells[0];
    const c1 = cells[1];
    const txt0 = (c0.text || '').trim();
    const txt1 = (c1.text || '').trim();

    if (!txt0 && txt1) {
      return { type: STRUCTURE_TYPES.EXPLANATION_ROW, gridSpan: 2 };
    }

    return { type: STRUCTURE_TYPES.TWO_COLUMN, gridSpan: 1 };
  }

  return { type: STRUCTURE_TYPES.MULTI_COLUMN, columnCount: cellCount };
}

/**
 * 主入口：全量识别 DOCX 源文件事实
 */
export async function recognizeSourceDocx(docxPathOrBuffer, sourceName = 'source.docx') {
  let fileBuffer = docxPathOrBuffer;
  if (typeof docxPathOrBuffer === 'string') {
    if (fs.existsSync(docxPathOrBuffer)) {
      fileBuffer = await fs.promises.readFile(docxPathOrBuffer);
    } else {
      throw new Error(`文件不存在: ${docxPathOrBuffer}`);
    }
  }

  const engine = await loadDocx(fileBuffer, sourceName);
  const records = engine.records || [];

  const facts = {
    sourceName,
    recognizedAt: new Date().toISOString(),
    isEnglish: engine.isEnglish || false,
    revisionDate: extractAdaptiveRevisionDate(engine) || null,
    modelCode: null,
    productName: null,
    sections: {}, // 1 ~ 16 章节全量结构感知 (纯数据，无 DOM)
    ghs: {
      isHazardous: false,
      categories: [],
      signalWord: null,
      hazardStatements: [],
      precautionaryStatements: {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      },
      otherHazards: null,
      hasPictograms: false,
      pictogramCount: 0
    },
    components: [], // Section 3 组分列表
    firstAid: {}, // Section 4
    fireFighting: {}, // Section 5
    accidentalRelease: {}, // Section 6
    handlingStorage: {}, // Section 7
    exposureControls: { limits: [], ppe: {} }, // Section 8
    physicalProperties: [], // Section 9 23 项理化指标
    stabilityReactivity: {}, // Section 10
    toxicology: { // Section 11
      paradigm: 'PARADIGM_2_STANDARD_SLOTS',
      acuteToxicity: { oral: null, inhalation: null, dermal: null },
      skinIrritation: null,
      eyeDamage: null,
      sensitization: null,
      germCellMutagenicity: null,
      carcinogenicity: null,
      reproductiveToxicity: { fertility: null, teratogenicity: null, raw: null },
      stotSingle: null,
      stotRepeated: null,
      aspirationHazard: null,
      additionalInfo: []
    },
    ecology: { endpoints: [], rawText: null }, // Section 12
    disposal: { wasteMethod: null, containerMethod: null, rawText: null }, // Section 13
    transport: { // Section 14
      unNumber: null,
      shippingNameCn: null,
      shippingNameEn: null,
      hazardClass: null,
      packingGroup: null,
      marinePollutant: null,
      specialPrecautions: {
        primaryCn: null,
        primaryEn: null,
        hasPrecautions: false
      },
      additionalInfo: {
        rawCn: null,
        itemsCn: [],
        itemsEn: []
      },
      marpol: {
        valCn: '不适用',
        valEn: 'Not applicable.'
      },
      isNonDangerousGoods: true
    },
    regulations: { catalogs: [], rawText: null }, // Section 15
    otherInfo: { revisionInfo: null, disclaimer: null, references: null, rawText: null } // Section 16
  };

  // 初始化 1~16 章节标准槽位
  for (let s = 1; s <= 16; s++) {
    facts.sections[s] = {
      sectionNumber: s,
      title: null,
      rowsCount: 0,
      structureSummary: {
        twoColumnCount: 0,
        explanationRowCount: 0,
        fullWidthCount: 0,
        multiColumnCount: 0
      },
      rows: []
    };
  }

  // 临时存储 DOM 原始行供专用解析器提取语义，不存入最终输出 facts
  const secRawRowsMap = new Map();
  for (let s = 1; s <= 16; s++) secRawRowsMap.set(s, []);

  // 1. 遍历并切分记录行，支持单表格中多章节共存时的智能分离
  for (const record of records) {
    let currentSecNum = record.sectionNumber;
    let currentSecTitle = record.title || '';

    const rawRows = record.rows || [];
    for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
      const row = rawRows[rIdx];
      const inlineHeader = detectSectionHeaderInRow(row);
      if (inlineHeader) {
        currentSecNum = inlineHeader.sectionNumber;
        currentSecTitle = inlineHeader.title;
      }

      if (currentSecNum && currentSecNum >= 1 && currentSecNum <= 16) {
        const targetSec = facts.sections[currentSecNum];
        if (!targetSec.title && currentSecTitle) {
          targetSec.title = currentSecTitle;
        }

        const structMeta = classifyRowStructure(row);
        const cellsData = (row.cells || []).map((cell, cIdx) => ({
          colIndex: cIdx,
          text: (cell.text || '').trim(),
          typography: extractCellTypography(cell)
        }));

        targetSec.rows.push({
          rowIndex: targetSec.rows.length,
          structureType: structMeta.type,
          columnCount: cellsData.length,
          cells: cellsData
        });

        secRawRowsMap.get(currentSecNum).push(row);

        targetSec.rowsCount = targetSec.rows.length;
        if (structMeta.type === STRUCTURE_TYPES.TWO_COLUMN) targetSec.structureSummary.twoColumnCount++;
        else if (structMeta.type === STRUCTURE_TYPES.EXPLANATION_ROW) targetSec.structureSummary.explanationRowCount++;
        else if (structMeta.type === STRUCTURE_TYPES.FULL_WIDTH) targetSec.structureSummary.fullWidthCount++;
        else if (structMeta.type === STRUCTURE_TYPES.MULTI_COLUMN) targetSec.structureSummary.multiColumnCount++;
      }
    }
  }

  // 2. 深入 16 章节语义解析 (使用隔离的 secRawRowsMap)
  for (let s = 1; s <= 16; s++) {
    const rawRows = secRawRowsMap.get(s) || [];
    const secData = facts.sections[s];
    const mockRecord = { sectionNumber: s, title: secData.title, rows: rawRows };

    switch (s) {
      case 1: parseSection1(mockRecord, facts); break;
      case 2: parseSection2(mockRecord, facts, engine); break;
      case 3: parseSection3(mockRecord, facts); break;
      case 4: parseSection4(mockRecord, facts); break;
      case 5: parseSection5(mockRecord, facts); break;
      case 6: parseSection6(mockRecord, facts); break;
      case 7: parseSection7(mockRecord, facts); break;
      case 8: parseSection8(mockRecord, facts); break;
      case 9: parseSection9(mockRecord, facts); break;
      case 10: parseSection10(mockRecord, facts); break;
      case 11: parseSection11(mockRecord, facts); break;
      case 12: parseSection12(mockRecord, facts); break;
      case 13: parseSection13(mockRecord, facts); break;
      case 14: parseSection14(mockRecord, facts); break;
      case 15: parseSection15(mockRecord, facts); break;
      case 16: parseSection16(mockRecord, facts); break;
    }
  }

  // 兜底从源文件名推导型号
  if (!facts.modelCode && sourceName) {
    const baseMatch = sourceName.match(/([A-Z]+[-_]?\d+[A-Z0-9]*)/i);
    if (baseMatch) facts.modelCode = baseMatch[1].toUpperCase();
  }

  return facts;
}

// -------------------------------------------------------------
// 16 章节专用深度解析子系统
// -------------------------------------------------------------

function parseSection1(record, facts) {
  for (const row of record.rows || []) {
    const fullRowText = row.cells.map(c => c.text).join(' ');
    const nameMatch = fullRowText.match(/(?:产品中文名称|中文名称|Product name|Chemical name)[：:\s]*([^\r\n]+)/i);
    if (nameMatch && !facts.productName) {
      facts.productName = nameMatch[1].trim();
    }
    const modelMatch = fullRowText.match(/(?:产品型号|型号|Model|Product model)[：:\s]+([A-Za-z0-9_.\-]+)/i);
    if (modelMatch && !facts.modelCode) {
      facts.modelCode = modelMatch[1].trim();
    }
    if (!facts.modelCode && nameMatch) {
      const codeInName = nameMatch[1].match(/([A-Z]{2,}[-_]?\d+[A-Z0-9]*)/i);
      if (codeInName) facts.modelCode = codeInName[1].trim();
    }
  }
}

function parseSection2(record, facts, engine) {
  const rawLines = [];
  for (const row of record.rows || []) {
    for (const cell of row.cells || []) {
      for (const p of cell.paragraphs || []) {
        const txt = (p.text || '').trim();
        if (txt) {
          txt.split(/\r?\n/).forEach(l => {
            const line = l.trim();
            if (line) rawLines.push(line);
          });
        }
      }
    }
  }

  let inGhsCategories = false;
  let currentPGroup = null;

  for (const line of rawLines) {
    if (/2\.1\s*(?:GHS危险性类别|Classification of the substance)/i.test(line)) {
      inGhsCategories = true;
      const afterColon = line.replace(/.*2\.1\s*(?:GHS危险性类别|Classification of the substance)[：:\s]*/i, '').trim();
      if (afterColon) {
        const cats = afterColon.split(/[；;、]+/).map(s => s.trim()).filter(Boolean);
        facts.ghs.categories.push(...cats);
      }
      continue;
    }

    if (inGhsCategories) {
      if (/2\.2|GHS标签要素|信号词|危险性说明|象形图/i.test(line)) {
        inGhsCategories = false;
      } else {
        const cats = line.split(/[；;、]+/).map(s => s.trim()).filter(Boolean);
        for (const c of cats) {
          if (c && !facts.ghs.categories.includes(c)) {
            facts.ghs.categories.push(c);
          }
        }
      }
    }

    if (/信号词[：:\s]*(危险|警告|Danger|Warning)/i.test(line)) {
      const match = line.match(/信号词[：:\s]*(危险|警告|Danger|Warning)/i);
      if (match) facts.ghs.signalWord = match[1];
    }

    const hMatches = line.matchAll(/(H\d{3}[a-zA-Z]?)[：:\s]*([^\r\n;；]+)/g);
    for (const m of hMatches) {
      facts.ghs.hazardStatements.push({ code: m[1], text: m[2].trim() });
    }

    if (/【预防措施】|预防[：:]/i.test(line)) currentPGroup = 'prevention';
    else if (/【事故响应】|事故响应[：:]/i.test(line)) currentPGroup = 'response';
    else if (/【安全储存】|安全储存[：:]/i.test(line)) currentPGroup = 'storage';
    else if (/【废弃处置】|废弃处置[：:]/i.test(line)) currentPGroup = 'disposal';

    const pMatches = line.matchAll(/(P\d{3}(?:\+P\d{3})*)[：:\s]*([^\r\n;；]+)/g);
    for (const pm of pMatches) {
      const item = { code: pm[1], text: pm[2].trim() };
      if (currentPGroup) {
        facts.ghs.precautionaryStatements[currentPGroup].push(item);
      } else {
        facts.ghs.precautionaryStatements.prevention.push(item);
      }
    }

    if (/2\.3\s*(?:其他危害|Other hazards)[：:\s]*([^\r\n]+)/i.test(line)) {
      const oth = line.match(/2\.3\s*(?:其他危害|Other hazards)[：:\s]*([^\r\n]+)/i);
      if (oth) facts.ghs.otherHazards = oth[1].trim();
    }
  }

  facts.ghs.isHazardous = facts.ghs.categories.length > 0 || facts.ghs.hazardStatements.length > 0;
}

function parseSection3(record, facts) {
  const rows = record.rows || [];
  for (const row of rows) {
    const cells = row.cells.map(c => (c.text || '').trim());
    if (cells.length < 2) continue;

    const full = cells.join(' ');
    if (/化学品名称|CAS|质量分数|浓度|Component|Concentration/i.test(full) && cells.length >= 3) {
      continue;
    }

    const casMatch = full.match(/\b(\d{2,7}-\d{2}-\d)\b/);
    if (casMatch) {
      const cas = casMatch[1];
      let name = cells[0];
      let concentration = cells[cells.length - 1];

      const pctMatch = full.match(/(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?%)/);
      if (pctMatch) concentration = pctMatch[1];

      facts.components.push({
        name,
        casNumber: cas,
        concentration,
        columnCount: cells.length
      });
    }
  }
}

function parseSection4(record, facts) {
  for (const row of record.rows || []) {
    const full = row.cells.map(c => c.text).join(' ');
    if (/皮肤接触[：:]/i.test(full)) facts.firstAid.skin = full.replace(/.*皮肤接触[：:]/i, '').trim();
    if (/眼睛接触[：:]/i.test(full)) facts.firstAid.eyes = full.replace(/.*眼睛接触[：:]/i, '').trim();
    if (/吸入[：:]/i.test(full)) facts.firstAid.inhalation = full.replace(/.*吸入[：:]/i, '').trim();
    if (/食入|误服[：:]/i.test(full)) facts.firstAid.ingestion = full.replace(/.*(?:食入|误服)[：:]/i, '').trim();
  }
}

function parseSection5(record, facts) {
  for (const row of record.rows || []) {
    const full = row.cells.map(c => c.text).join(' ');
    if (/灭火介质[：:]/i.test(full)) facts.fireFighting.media = full.replace(/.*灭火介质[：:]/i, '').trim();
    if (/特别危险性[：:]/i.test(full)) facts.fireFighting.hazards = full.replace(/.*特别危险性[：:]/i, '').trim();
  }
}

function parseSection6(record, facts) {
  const allText = record.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  facts.accidentalRelease.rawText = allText;
}

function parseSection7(record, facts) {
  for (const row of record.rows || []) {
    const full = row.cells.map(c => c.text).join(' ');
    if (/操作处置注意事项|操作注意事项[：:]/i.test(full)) {
      facts.handlingStorage.handling = full.replace(/.*(?:操作处置注意事项|操作注意事项)[：:]/i, '').trim();
    }
    if (/安全储存条件|储存注意事项[：:]/i.test(full)) {
      facts.handlingStorage.storage = full.replace(/.*(?:安全储存条件|储存注意事项)[：:]/i, '').trim();
    }
  }
}

function parseSection8(record, facts) {
  for (const row of record.rows || []) {
    const cells = row.cells.map(c => (c.text || '').trim());
    if (cells.length >= 3) {
      facts.exposureControls.limits.push({
        substance: cells[0],
        mac_twa: cells[1],
        stel: cells[2]
      });
    }
    const full = cells.join(' ');
    if (/呼吸系统防护[：:]/i.test(full)) facts.exposureControls.ppe.respiratory = full.replace(/.*呼吸系统防护[：:]/i, '').trim();
    if (/眼睛防护[：:]/i.test(full)) facts.exposureControls.ppe.eyes = full.replace(/.*眼睛防护[：:]/i, '').trim();
    if (/手部防护[：:]/i.test(full)) facts.exposureControls.ppe.hands = full.replace(/.*手部防护[：:]/i, '').trim();
  }
}

function parseSection9(record, facts) {
  const rows = record.rows || [];
  for (const row of rows) {
    const pairs = decomposeCellPairToFacts(row.cells?.[0], row.cells?.[1], row, 9);
    for (const pair of pairs) {
      if (!pair.rawLabel && !pair.rawValue) continue;
      const label = pair.rawLabel || '';
      const val = pair.rawValue || '';
      const seqMatch = label.match(/^9\.(\d{1,2})/);
      const seq = seqMatch ? Number(seqMatch[1]) : null;

      facts.physicalProperties.push({
        sequence: seq,
        label,
        value: val,
        columnCount: row.cells?.length || 2,
        typography: extractCellTypography(row.cells?.[1])
      });
    }
  }
}

function parseSection10(record, facts) {
  for (const row of record.rows || []) {
    const pairs = decomposeCellPairToFacts(row.cells?.[0], row.cells?.[1], row, 10);
    for (const pair of pairs) {
      const label = pair.rawLabel || '';
      const val = pair.rawValue || '';
      if (/反应性/i.test(label)) facts.stabilityReactivity.reactivity = val;
      if (/稳定性/i.test(label)) facts.stabilityReactivity.stability = val;
      if (/危险反应/i.test(label)) facts.stabilityReactivity.hazardousReactions = val;
      if (/应避免的条件/i.test(label)) facts.stabilityReactivity.conditionsToAvoid = val;
      if (/不相容的材料|禁配物/i.test(label)) facts.stabilityReactivity.incompatibleMaterials = val;
      if (/危险的分解产物/i.test(label)) facts.stabilityReactivity.decompositionProducts = val;
    }
  }
}

function parseSection11(record, facts) {
  const rows = record.rows || [];
  if (rows.length <= 4) {
    facts.toxicology.paradigm = 'PARADIGM_1_FULL_WIDTH_MERGED';
  } else {
    facts.toxicology.paradigm = 'PARADIGM_2_STANDARD_SLOTS';
  }

  for (const row of rows) {
    const label = (row.cells[0]?.text || '').trim();
    const val = (row.cells[1]?.text || '').trim();

    if (/急性毒性/i.test(label)) {
      if (/经口/i.test(val)) facts.toxicology.acuteToxicity.oral = val;
      if (/吸入/i.test(val)) facts.toxicology.acuteToxicity.inhalation = val;
      if (/经皮/i.test(val)) facts.toxicology.acuteToxicity.dermal = val;
    } else if (/经口/i.test(label)) {
      facts.toxicology.acuteToxicity.oral = val;
    } else if (/吸入/i.test(label)) {
      facts.toxicology.acuteToxicity.inhalation = val;
    } else if (/经皮/i.test(label)) {
      facts.toxicology.acuteToxicity.dermal = val;
    } else if (/皮肤刺激/i.test(label)) {
      facts.toxicology.skinIrritation = val;
    } else if (/严重眼睛损伤|眼刺激/i.test(label)) {
      facts.toxicology.eyeDamage = val;
    } else if (/呼吸道或皮肤致敏|致敏/i.test(label)) {
      facts.toxicology.sensitization = val;
    } else if (/生殖毒性/i.test(label)) {
      facts.toxicology.reproductiveToxicity.raw = val;
      if (row.cells.length >= 3) {
        facts.toxicology.reproductiveToxicity.fertility = (row.cells[2]?.text || '').trim();
      }
    } else if (/附加信息/i.test(label)) {
      if (val) facts.toxicology.additionalInfo.push(val);
    }
  }
}

function parseSection12(record, facts) {
  const rows = record.rows || [];
  for (const row of rows) {
    const pairs = decomposeCellPairToFacts(row.cells?.[0], row.cells?.[1], row, 12);
    for (const pair of pairs) {
      if (pair.rawLabel || pair.rawValue) {
        facts.ecology.endpoints.push({ label: pair.rawLabel, value: pair.rawValue });
      }
    }
  }
}

function parseSection13(record, facts) {
  const allText = record.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  facts.disposal.rawText = allText;
}

function parseSection14(record, facts) {
  const rows = record.rows || [];
  const s14Pairs = [];
  for (const row of rows) {
    const pairs = decomposeCellPairToFacts(row.cells?.[0], row.cells?.[1], row, 14);
    s14Pairs.push(...pairs);
  }

  const allText = s14Pairs.map(p => `${p.rawLabel} ${p.rawValue}`).join(' ');
  facts.transport.isNonDangerousGoods = /非危险货物|Not dangerous goods|非危险品/i.test(allText);

  for (const p of s14Pairs) {
    const lbl = p.rawLabel || '';
    const val = p.rawValue || '';

    // 14.1 UN 编号
    if (/14\.1|UN|联合国编号/i.test(lbl)) {
      const m = val.match(/UN\s*(\d{4})|\b(\d{4})\b/i);
      if (m) facts.transport.unNumber = m[1] || m[0];
      else if (val) facts.transport.unNumber = val;
    }
    // 14.2 联合国运输名称
    if (/14\.2|运输名称|proper shipping name/i.test(lbl)) {
      facts.transport.shippingNameCn = val;
      facts.transport.shippingNameEn = val === '树脂溶液' ? 'RESIN SOLUTION' : (/RESIN SOLUTION/i.test(val) ? val : 'CHEMICALS');
    }
    // 14.3 运输危险类别
    if (/14\.3|危险[级类]别|hazard class/i.test(lbl)) {
      const m = val.match(/(\d)/);
      facts.transport.hazardClass = m ? m[1] : val;
    }
    // 14.4 包装类型
    if (/14\.4|包装[组类]型?|packing group/i.test(lbl)) {
      const m = val.match(/([I|V]+)/i);
      facts.transport.packingGroup = m ? m[1] : val;
    }
    // 14.5 环境危险
    if (/14\.5|环境危|海洋污染物|marine pollutant|environmental hazard/i.test(lbl)) {
      facts.transport.marinePollutant = val;
    }
    // 14.6 特殊防范措施 (主标签)
    if (/14\.6|特殊防范|特殊注意事项|special precautions/i.test(lbl)) {
      facts.transport.specialPrecautions.primaryCn = val;
      facts.transport.specialPrecautions.primaryEn = val.includes('参见')
        ? val.replace(/参见(?:第)?(\d+)[-－—~](\d+)节/, 'See sections $1-$2.')
        : (/See sections/i.test(val) ? val : 'See sections 6-8.');
      facts.transport.specialPrecautions.hasPrecautions = true;
    }
    // 附加信息 (子标签)
    if (/附加信息|additional information/i.test(lbl)) {
      facts.transport.additionalInfo.rawCn = val;
      const lines = val.split('\n').map(l => l.trim()).filter(Boolean);
      facts.transport.additionalInfo.itemsCn = lines;
      facts.transport.additionalInfo.itemsEn = lines.map(line => {
        let en = line;
        if (/具可燃性/i.test(line)) {
          let tMax = '+35';
          let tMin = '-10';
          const mHigh = line.match(/高于\s*([+\-－]?\d+)℃/);
          const mLow = line.match(/低于\s*([+\-－]?\d+)℃/);
          if (mHigh) tMax = mHigh[1].startsWith('+') ? mHigh[1] : `+${mHigh[1]}`;
          if (mLow) tMin = mLow[1].replace('－', '-');
          en = `Flammable. Temperature must not exceed ${tMax}°C and must not fall below ${tMin}°C.`;
        } else if (/远离食物|远离.*酸.*碱/i.test(line)) {
          en = 'Keep away from food, acids and bases.';
        }
        return en;
      });
    }
    // 14.7 MARPOL
    if (/14\.7|MARPOL|IBC/i.test(lbl)) {
      facts.transport.marpol.valCn = val;
      facts.transport.marpol.valEn = /不适用/i.test(val) ? 'Not applicable.' : val;
    }
  }
}

function parseSection15(record, facts) {
  const allText = record.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  facts.regulations.rawText = allText;
}

function parseSection16(record, facts) {
  const allText = record.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  facts.otherInfo.rawText = allText;
}
