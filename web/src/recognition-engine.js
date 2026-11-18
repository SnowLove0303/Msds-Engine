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


export const SEMANTIC_TYPES = Object.freeze({
  SECTION_HEADER: '章节标题',
  SEQ_LABEL: '序号标签',
  PARENT_LABEL: '父级标签',
  CHILD_LABEL: '子标签',
  LABEL: '子标签', // 兼容引用
  VALUE: '数据值',
  EXPLANATION: '说明行',
  TABLE_HEADER: '表头',
  COMPONENT_DATA: '组分数据'
});

/**
 * 多维特征行语义分类器 (Multidimensional Row Semantic Classifier)
 * 依据加粗、冒号、序号模式、列数与句式多维特征精准判别行属性，杜绝将说明行或值误判为标签
 */
export function classifyRowSemanticType(row, secNum, rowIndex = 0) {
  const cells = row.cells || [];
  const cellCount = cells.length;
  const c0Text = (cells[0]?.text || '').trim();
  const c1Text = (cells[1]?.text || '').trim();
  const fullText = cells.map(c => (c.text || '').trim()).join(' ');

  // 1. 章节大标题 (支持容差前缀 v1. 匹配)
  const headerMatch = detectSectionHeaderInRow(row);
  if (rowIndex === 0 || headerMatch) {
    if (headerMatch) {
      return {
        rowType: SEMANTIC_TYPES.SECTION_HEADER,
        label: headerMatch.title,
        value: '—'
      };
    }
  }

  // 2. 表头行 (Section 3 成分表、Section 8 暴露限值表等)
  if (cellCount >= 3 && /化学品名称|CAS编号|%\s*（w\/w）|Component|CAS|Basis|Type|Value|暴露限值|职业接触限值|MAC|PC-TWA/i.test(fullText)) {
    return {
      rowType: SEMANTIC_TYPES.TABLE_HEADER,
      label: cells.map(c => (c.text || '').trim()).join(' | '),
      value: '—'
    };
  }

  // 3. Section 3 组分数据行 (多列网格且包含 CAS 或浓度)
  if (secNum === 3 && cellCount >= 3 && rowIndex >= 2) {
    return {
      rowType: SEMANTIC_TYPES.COMPONENT_DATA,
      label: c0Text || '未命名组分',
      value: `CAS: ${c1Text || '—'} | 浓度: ${cells[2]?.text || '—'}`
    };
  }

  // 4. 左列为空、右列有内容的行 (如 Section 5 行 4: 烟尘警告叙述)
  if (!c0Text && c1Text) {
    return {
      rowType: SEMANTIC_TYPES.EXPLANATION,
      label: '—',
      value: c1Text
    };
  }

  // 5. 单列行 / 通栏行
  if (cellCount === 1 || (cellCount === 2 && !c1Text)) {
    // 检查前置引导语 (如 Section 11 "类似产品的风险评估数据："、Section 15 "其它的规定："、"符合下列法规要求：")
    const isPreambleGuidance = /^(?:类似产品的风险评估数据|其它的规定|其它规定|其他规定|符合下列法规要求|相关法律法规|免责声明)[：:]?$/i.test(c0Text);
    if (isPreambleGuidance) {
      return {
        rowType: SEMANTIC_TYPES.EXPLANATION,
        label: '—',
        value: c0Text
      };
    }

    // 检查是否为带序号的子题头 (如 8.1控制参数, 8.2暴露控制)
    const mSeqHeader = c0Text.match(/^(\d+\.\d+)\s*(.*)$/);
    if (mSeqHeader) {
      const rest = mSeqHeader[2].trim();
      if (/[:：]/.test(rest)) {
        const [lblPart, ...valParts] = rest.split(/[:：]/);
        return {
          rowType: SEMANTIC_TYPES.SEQ_LABEL,
          label: `${mSeqHeader[1]} ${lblPart}：`.trim(),
          value: valParts.join('：').trim() || '—'
        };
      }
      return {
        rowType: SEMANTIC_TYPES.SEQ_LABEL,
        label: c0Text,
        value: '—'
      };
    }

    // 检查是否为父级标签 (如 Section 8 "手部防护：", "建议：")
    const isParentHeader = /^(?:手部防护|分类题头|建议|分类标准|防护指南|通用要求|防护措施|工程控制)[：:]?$/i.test(c0Text) ||
                           (secNum === 8 && /^手部防护[：:]?$/i.test(c0Text));
    if (isParentHeader) {
      return {
        rowType: SEMANTIC_TYPES.PARENT_LABEL,
        label: c0Text,
        value: '—'
      };
    }

    // 检查是否为冒号拆分单行 (如 4.1.一般措施：立即脱掉...)
    const colonMatch = c0Text.match(/^([^：:]{2,15}[：:])\s*(.*)$/);
    if (colonMatch) {
      const lbl = colonMatch[1].trim();
      const val = colonMatch[2].trim();
      const isSeq = /^\d+\./.test(lbl);
      const isParent = /^(?:手部防护|分类题头|建议|分类标准|防护指南|通用要求)[：:]?$/i.test(lbl);
      return {
        rowType: isSeq ? SEMANTIC_TYPES.SEQ_LABEL : (isParent ? SEMANTIC_TYPES.PARENT_LABEL : SEMANTIC_TYPES.CHILD_LABEL),
        label: lbl,
        value: val || '—'
      };
    }

    // 检查是否为法规条目 (GB/T, 国务院令, etc.)
    if (/^GB[\/T\s\d]|国务院令/i.test(c0Text)) {
      return {
        rowType: SEMANTIC_TYPES.VALUE,
        label: '—',
        value: c0Text
      };
    }

    // 典型说明行特征 (法规免责声明、长句叙述、非危险说明)
    return {
      rowType: SEMANTIC_TYPES.EXPLANATION,
      label: '—',
      value: c0Text || fullText
    };
  }

  // 6. 双列标准行 (cells.length === 2 且 c0Text, c1Text 均有值)
  if (cellCount === 2) {
    // 特殊情况：左侧为长句说明且无冒号，无加粗 (如 "该产品无可用的毒理学研究。")
    const isLeftLongNarrative = (c0Text.length > 15 && !/[:：]$/.test(c0Text) && !cells[0]?.typography?.isBold) ||
                                /无可用的毒理学研究|无可用的接触限值|不易生物降解/i.test(c0Text);
    if (isLeftLongNarrative) {
      return {
        rowType: SEMANTIC_TYPES.EXPLANATION,
        label: '—',
        value: c1Text ? `${c0Text} ${c1Text}`.trim() : c0Text
      };
    }

    // 检查左侧是否为章节引导语
    const isPreamble = /^(?:类似产品的风险评估数据|其它的规定|其它规定|其他规定|符合下列法规要求)[：:]?$/i.test(c0Text);
    if (isPreamble) {
      return {
        rowType: SEMANTIC_TYPES.EXPLANATION,
        label: '—',
        value: c1Text ? `${c0Text} ${c1Text}`.trim() : c0Text
      };
    }

    // 带分级序号的标签 (如 1.1产品名称：, 9.1外观：, 10.1化学稳定性：)
    if (/^\d+\.\d+/.test(c0Text)) {
      return {
        rowType: SEMANTIC_TYPES.SEQ_LABEL,
        label: c0Text,
        value: c1Text || '—'
      };
    }

    // 检查是否为父级分类题头
    const isParentHeader = /^(?:手部防护|分类题头|建议|分类标准|防护指南|通用要求|防护措施|工程控制)[：:]?$/i.test(c0Text) ||
                           (secNum === 8 && /手部防护|建议/i.test(c0Text));

    // 普通标签 (如 中文名称：, 供应商名称：, 手套材料：)
    // 严格检查 c0Text.length > 0 且具有标签形态
    const isLabel = c0Text.length > 0 && (/[:：]$/.test(c0Text) || cells[0]?.typography?.isBold || c0Text.length <= 15);
    if (isLabel) {
      return {
        rowType: isParentHeader ? SEMANTIC_TYPES.PARENT_LABEL : SEMANTIC_TYPES.CHILD_LABEL,
        label: c0Text,
        value: c1Text || '—'
      };
    }

    // 兜底为说明行
    return {
      rowType: SEMANTIC_TYPES.EXPLANATION,
      label: '—',
      value: c0Text ? `${c0Text} ${c1Text}`.trim() : c1Text
    };
  }

  // 7. 其他多列网格
  return {
    rowType: SEMANTIC_TYPES.VALUE,
    label: c0Text || '—',
    value: cells.slice(1).map(c => (c.text || '').trim()).join(' | ') || '—'
  };
}

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

  // 若包含点分二级及以上小节序号 (如 4.1, 5.1., 8.2)，绝非一级章节大标题！
  if (/^\s*(?:[vV])?\s*\d{1,2}\.\d+/i.test(firstCellText)) return null;

  // 兼容历史杂质前缀 (如 'v1.', 'V1.', '  1.')
  const match = firstCellText.match(/^\s*(?:[vV])?\s*(\d{1,2})[\.、\s]+(.*)$/);
  if (!match) return null;

  const secNum = Number(match[1]);
  if (secNum < 1 || secNum > 16) return null;

  const titlePart = match[2].trim();
  const kw = SECTION_KEYWORDS[secNum];
  if (kw && kw.test(titlePart)) {
    const cleanTitle = `${secNum}.${titlePart}`;
    return { sectionNumber: secNum, title: cleanTitle };
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

        // 针对 Section 2 复合单单元格执行多行多层级段落穿透拆解
        if (currentSecNum === 2 && targetSec.rows.length > 0 && structMeta.type === STRUCTURE_TYPES.FULL_WIDTH) {
          const c0 = (row.cells?.[0]?.text || '').trim();
          const lines = c0.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length > 1 && /GHS|物质或混合物|危险/i.test(c0)) {
            for (let lIdx = 0; lIdx < lines.length; lIdx++) {
              const line = lines[lIdx];
              if (/^物质或混合物/i.test(line)) {
                targetSec.rows.push({
                  rowIndex: targetSec.rows.length,
                  structureType: STRUCTURE_TYPES.FULL_WIDTH,
                  semanticType: SEMANTIC_TYPES.EXPLANATION,
                  label: '—',
                  value: line,
                  columnCount: 1,
                  cells: [{ colIndex: 0, text: line, typography: { isBold: true } }]
                });
              } else if (/[:：]$/.test(line)) {
                const nextLine = lines[lIdx + 1] || '—';
                targetSec.rows.push({
                  rowIndex: targetSec.rows.length,
                  structureType: STRUCTURE_TYPES.TWO_COLUMN,
                  semanticType: SEMANTIC_TYPES.CHILD_LABEL,
                  label: line,
                  value: nextLine,
                  columnCount: 2,
                  cells: [
                    { colIndex: 0, text: line, typography: { isBold: true } },
                    { colIndex: 1, text: nextLine, typography: { isBold: false } }
                  ]
                });
                lIdx++; // 消耗下一行作为值
              } else {
                targetSec.rows.push({
                  rowIndex: targetSec.rows.length,
                  structureType: STRUCTURE_TYPES.FULL_WIDTH,
                  semanticType: SEMANTIC_TYPES.EXPLANATION,
                  label: '—',
                  value: line,
                  columnCount: 1,
                  cells: [{ colIndex: 0, text: line, typography: { isBold: false } }]
                });
              }
            }
            secRawRowsMap.get(currentSecNum).push(row);
            targetSec.rowsCount = targetSec.rows.length;
            continue;
          }
        }

        const semanticMeta = classifyRowSemanticType(row, currentSecNum, targetSec.rows.length);

        targetSec.rows.push({
          rowIndex: targetSec.rows.length,
          structureType: structMeta.type,
          semanticType: semanticMeta.rowType,
          label: semanticMeta.label,
          value: semanticMeta.value,
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
    if (/^(?:3\.\d\s*)?(?:物质|混合物|成分\/组成信息)/i.test(full) && cells.length === 1) {
      continue;
    }

    const c0 = cells[0] || '';
    const c1 = cells[1] || '';
    const c2 = cells[cells.length - 1] || '';

    const names = c0.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const casList = c1.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const concList = c2.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    if (names.length > 1 || casList.length > 1) {
      const maxLen = Math.max(names.length, casList.length, concList.length);
      for (let i = 0; i < maxLen; i++) {
        const name = names[i] || names[0] || '';
        const cas = casList[i] || casList[0] || '';
        const conc = concList[i] || concList[0] || '';
        if (name && !/^(?:3\.\d.*|化学品名称.*|CAS.*|成分.*|混合物|物质)$/i.test(name.trim())) {
          facts.components.push({
            name,
            casNumber: cas,
            cas,
            concentration: conc,
            conc,
            columnCount: cells.length
          });
        }
      }
    } else {
      const casMatch = full.match(/\b(\d{2,7}-\d{2}-\d)\b/);
      const isTradeSecret = /商业机密|商业秘密|保密|Trade\s*secret|Confidential/i.test(full);
      if (casMatch || isTradeSecret || cells.length >= 3) {
        const cas = casMatch ? casMatch[1] : (isTradeSecret ? '商业机密' : (c1 || '无'));
        let name = c0;
        let concentration = c2;

        const pctMatch = full.match(/(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?%)/);
        if (pctMatch) concentration = pctMatch[1];

        if (name && !/^(?:3\.\d.*|化学品名称.*|CAS.*|成分.*|混合物|物质)$/i.test(name.trim())) {
          facts.components.push({
            name,
            casNumber: cas,
            cas,
            concentration,
            conc: concentration,
            columnCount: cells.length
          });
        }
      }
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


/**
 * 将识别 facts 对象原生序列化为标准 Context 1 Markdown 资产
 */
export function serializeFactsToMarkdown(facts) {
  const model = facts.modelCode || 'MSDS';
  const srcName = facts.sourceName || '未命名源文件';
  const prodName = facts.productName || '未知品名';
  const category = facts.productType || facts.category || facts.productName || '—';
  const isHaz = facts.ghs?.isHazardous ? '危险化学品' : '非危险化学品 (未分类 / Non-hazardous)';

  let md = '# ' + model + ' Context 1 原始化学事实与结构形态提取资产\n\n';
  md += '> **生成时间**：' + (facts.recognizedAt || new Date().toISOString()) + '\n';
  md += '> **输入源文件**：`' + srcName + '`\n';
  md += '> **提取特征指纹**：型号 `' + model + '` | 品名 `' + prodName + '`\n';
  md += '> **GHS 危害性判定**：' + isHaz + '\n\n';

  md += '## 一、核心元数据清单 (Metadata)\n\n';
  md += '| 属性字段 | 提取事实值 | 判定依据 |\n';
  md += '| :--- | :--- | :--- |\n';
  md += '| **产品型号 (Model Code)** | `' + model + '` | Section 1 行 1 匹配提取 |\n';
  md += '| **产品中文品名 (Product Name)** | `' + prodName + '` | Section 1 行 2 匹配提取 |\n';
  md += '| **化学品分类 (Chemical Category)** | `' + category + '` | Section 1 匹配提取 |\n';
  md += '| **GHS 危害性分类** | **' + isHaz + '** | Section 2 明示非危险品，无象形图/信号词 |\n';
  md += '| **CAS 组分数量** | ' + (facts.components?.length || 0) + ' 个组分 | Section 3 表格提取 |\n';
  md += '| **理化参数项数** | ' + (facts.physicalProperties?.length || 0) + ' 项原始指标 | Section 9 提取 |\n\n';

  md += '## 二、Section 3 组分明细事实表 (Composition Facts)\n\n';
  if (facts.components?.length > 0) {
    md += '| 组分名称 | CAS 登记号 | 质量百分比 (wt%) | 结构列数 |\n';
    md += '| :--- | :--- | :--- | :---: |\n';
    for (const comp of facts.components) {
      const cName = comp.name || '—';
      const cCas = comp.casNumber || comp.cas || '—';
      const cConc = (comp.concentration || comp.conc || '—') + '%';
      const cCols = comp.columnCount || 3;
      md += '| ' + cName + ' | ' + cCas + ' | ' + cConc + ' | ' + cCols + ' |\n';
    }
  } else {
    md += '*（源文档未提供组分明细表格）*\n';
  }
  md += '\n';

  md += '## 三、Section 9 理化特性提取清单 (Physical Properties)\n\n';
  if (facts.physicalProperties?.length > 0) {
    md += '| 序号 | 属性指标 (Label) | 原始数值 (Value) |\n';
    md += '| :---: | :--- | :--- |\n';
    for (let i = 0; i < facts.physicalProperties.length; i++) {
      const p = facts.physicalProperties[i];
      const pLbl = p.label || '未命名';
      const pVal = p.value || '*(空)*';
      md += '| ' + (i + 1) + ' | ' + pLbl + ' | ' + pVal + ' |\n';
    }
  } else {
    md += '*（源文档未提供理化参数）*\n';
  }
  md += '\n';

  md += '## 四、16 章节全量原始网格与段落结构 (16 Sections Raw Grid & Text)\n\n';
  for (let s = 1; s <= 16; s++) {
    const sec = facts.sections?.[s];
    const sTitle = sec?.title || ('Section ' + s);
    md += '### 第 ' + s + ' 部分：' + sTitle + '\n\n';
    if (!sec || !sec.rows || sec.rows.length === 0) {
      md += '*（源文档未提供该章节内容）*\n\n';
      continue;
    }
    const rCount = sec.rowsCount || sec.rows.length;
    const sSum = sec.structureSummary || {};
    md += '- **行数统计**: 共 ' + rCount + ' 行\n';
    md += '- **结构形态**: 2列标准行: ' + (sSum.twoColumnCount || 0) + ' | 通栏行: ' + (sSum.fullWidthCount || 0) + ' | 多列网格: ' + (sSum.multiColumnCount || 0) + ' | 提示说明行: ' + (sSum.explanationRowCount || 0) + '\n\n';

    md += '| 行号 | 属性 | 标签/题头 | 数据值/内容 |\n';
    md += '| :---: | :---: | :--- | :--- |\n';
    for (let rIdx = 0; rIdx < sec.rows.length; rIdx++) {
      const row = sec.rows[rIdx];
      const semType = row.semanticType || '说明行';
      const lbl = (row.label || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>').trim() || '—';
      const val = (row.value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>').trim() || '—';
      md += '| ' + rIdx + ' | `' + semType + '` | ' + lbl + ' | ' + val + ' |\n';
    }
    md += '\n';
  }

  return md;
}
