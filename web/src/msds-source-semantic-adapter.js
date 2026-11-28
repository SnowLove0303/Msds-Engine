import fs from 'fs';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { DOMParser as XmlDomParser } from '@xmldom/xmldom';

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
 * 通用一级章节标题识别（零章节数上限、零行业词典硬编码）
 */
export function detectSectionHeaderUniversal(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (/^\s*(?:[vV])?\s*\d+\.\d+/i.test(clean)) return null;
  const match = clean.match(/^\s*(?:[vV])?\s*(\d+)[\.、\s]+(.+)$/);
  if (!match) return null;
  const secNum = Number(match[1]);
  if (!Number.isFinite(secNum) || secNum < 1) return null;
  const titlePart = match[2].trim();
  if (!titlePart || titlePart.length > 160) return null;
  return { sectionNumber: secNum, title: `${secNum}.${titlePart}` };
}

/**
 * 判定一段文本是否为一级章节大标题 (如 "1. 化学品及企业标识" 或 "1. Identification")
 */
export function detectSectionHeaderInText(text, options = {}) {
  if (options?.universal) {
    return detectSectionHeaderUniversal(text);
  }
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  // 若包含点分二级及以上小节序号 (如 4.1, 5.1., 8.2)，绝非一级章节大标题！
  if (/^\s*(?:[vV])?\s*\d{1,2}\.\d+/i.test(clean)) return null;

  // 兼容历史杂质前缀 (如 'v1.', 'V1.', '  1.')
  const match = clean.match(/^\s*(?:[vV])?\s*(\d{1,2})[\.、\s]+(.*)$/);
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
 * 判定某一行是否为内嵌在表格中的新章节标题行
 */
function detectSectionHeaderInRow(row) {
  if (!row.cells || row.cells.length === 0) return null;
  const firstCellText = (row.cells[0]?.text || '').trim();
  return detectSectionHeaderInText(firstCellText);
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

function extractStructuralFieldCandidates(rows, tableIndex) {
  const candidates = [];
  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const cells = rows[rIdx]?.cells || [];
    if (cells.length === 2) {
      const c0 = cells[0];
      const c1 = cells[1];
      const lbl = (c0?.text || '').trim();
      const val = (c1?.text || '').trim();
      const isBoldOrColon = Boolean(c0?.typography?.isBold) || /[：:]$/.test(lbl);
      if (lbl && isBoldOrColon) {
        candidates.push({
          method: 'two_col_kv',
          label: lbl.replace(/[：:]\s*$/, ''),
          value: val,
          source: { tableIndex, rowIndex: rIdx, labelCellIndex: 0, valueCellIndex: 1 }
        });
      }
    } else if (cells.length === 1) {
      const txt = (cells[0]?.text || '').trim();
      for (const line of txt.split(/\r?\n/)) {
        const m = line.trim().match(/^([^：:\n]{1,80})[：:]\s*(.+)$/);
        if (m) {
          candidates.push({
            method: 'inline_colon_kv',
            label: m[1].trim(),
            value: m[2].trim(),
            source: { tableIndex, rowIndex: rIdx, labelCellIndex: 0, valueCellIndex: 0 }
          });
        }
      }
    }
  }
  return candidates;
}

function parseHeaderFooterXmlPart(xmlText, partName) {
  const parser = new XmlDomParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const paragraphs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p')).map((p, idx) => {
    const text = Array.from(p.getElementsByTagNameNS(W_NS, 't')).map(t => t.textContent || '').join('').trim();
    return { index: idx, text };
  }).filter(p => p.text.length > 0);
  const tablesCount = doc.getElementsByTagNameNS(W_NS, 'tbl').length;
  const drawingsCount = doc.getElementsByTagNameNS(W_NS, 'drawing').length;
  return {
    partName,
    text: paragraphs.map(p => p.text).join('\n'),
    paragraphs,
    tablesCount,
    drawingsCount
  };
}

/**
 * 通用全量无损文档识别器 (L2 Universal Source Recognizer)
 * 对标 python-docx 全量读取标准：零 1..16 上限、零行业词典锁死、保留全部内容/格式/sourceOoxml/coverage/warnings
 */
export async function recognizeDocumentUniversal(docxPathOrBuffer, options = {}) {
  const sourceName = typeof options === 'string' ? options : (options.sourceName || 'source.docx');
  let fileBuffer = docxPathOrBuffer;
  if (typeof docxPathOrBuffer === 'string') {
    if (fs.existsSync(docxPathOrBuffer)) {
      fileBuffer = await fs.promises.readFile(docxPathOrBuffer);
    } else {
      throw new Error(`文件不存在: ${docxPathOrBuffer}`);
    }
  }

  const zip = await JSZip.loadAsync(fileBuffer);
  const engine = await loadDocx(fileBuffer, sourceName);
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  // 1. 无损保留所有 word/*.xml 原生部件 (sourceOoxml)
  const sourceOoxml = {};
  const headerFooter = { headers: [], footers: [], tables: [] };
  const xmlFiles = Object.keys(zip.files).filter(name => /^word\/.*\.xml$/i.test(name) && !zip.files[name].dir).sort();
  for (const partName of xmlFiles) {
    const xmlText = await zip.files[partName].async('string');
    sourceOoxml[partName] = xmlText;
    if (/^word\/header\d*\.xml$/i.test(partName)) {
      headerFooter.headers.push(parseHeaderFooterXmlPart(xmlText, partName));
    } else if (/^word\/footer\d*\.xml$/i.test(partName)) {
      headerFooter.footers.push(parseHeaderFooterXmlPart(xmlText, partName));
    }
  }

  // 2. 扫描未标准化 OOXML 元素与嵌套表告警 (recognitionWarnings)
  const recognitionWarnings = [];
  const unsupportedTags = ['instrText', 'delText', 'sym', 'object', 'pict'];
  const xmlParser = new XmlDomParser();
  const parsedXmlDocs = {};
  for (const [partName, xmlText] of Object.entries(sourceOoxml)) {
    try {
      parsedXmlDocs[partName] = xmlParser.parseFromString(xmlText, 'text/xml');
    } catch {
      // ignore malformed optional part
    }
  }
  for (const localName of unsupportedTags) {
    let count = 0;
    for (const xmlDoc of Object.values(parsedXmlDocs)) {
      count += xmlDoc.getElementsByTagNameNS(W_NS, localName).length;
    }
    if (count > 0) {
      recognitionWarnings.push({
        code: 'source_ooxml_not_normalized',
        element: `w:${localName}`,
        count,
        message: '元素原样保存在 sourceOoxml 中，当前标准化文本视图未解析该元素。'
      });
    }
  }

  // 3. 提取表外正文段落 (bodyParagraphs) 与精确统计 XML <w:tbl>
  const docXml = engine.documentXml || parsedXmlDocs['word/document.xml'];
  const bodyNode = docXml?.getElementsByTagNameNS(W_NS, 'body')?.[0];
  const bodyParagraphs = [];
  let topLevelBodyTblCount = 0;
  if (bodyNode) {
    let pIdx = 0;
    for (const child of Array.from(bodyNode.childNodes || [])) {
      if (child.nodeType !== 1) continue;
      if (child.localName === 'p') {
        const text = Array.from(child.getElementsByTagNameNS(W_NS, 't')).map(t => t.textContent || '').join('').trim();
        const pPr = child.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
        const jcEl = pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0];
        const styleEl = pPr?.getElementsByTagNameNS(W_NS, 'pStyle')?.[0];
        bodyParagraphs.push({
          index: pIdx++,
          text,
          styleId: styleEl?.getAttributeNS(W_NS, 'val') || styleEl?.getAttribute('w:val') || null,
          alignment: jcEl?.getAttributeNS(W_NS, 'val') || jcEl?.getAttribute('w:val') || null
        });
      } else if (child.localName === 'tbl') {
        topLevelBodyTblCount++;
      }
    }
  }
  const totalBodyTableXmlCount = bodyNode ? bodyNode.getElementsByTagNameNS(W_NS, 'tbl').length : 0;

  // 4. 全量提取所有表格、行、单元格、排版参数与候选字段 (零 1..16 截断)
  const records = [];
  const tables = [];
  const dynamicSectionsMap = new Map();
  const fieldCandidates = [];
  let normalizedCellCount = 0;

  const engineTableRecords = (engine.records || []).filter(r => r.kind === 'table' && !/^word\/(?:header|footer)/i.test(r.part || ''));
  for (let tIdx = 0; tIdx < engineTableRecords.length; tIdx++) {
    const rec = engineTableRecords[tIdx];
    const gridWidthsTwips = (rec.structure?.gridWidthsTwips || []).map(Number);
    const formattedRows = (rec.rows || []).map((row, rIdx) => {
      const structMeta = classifyRowStructure(row);
      const formattedCells = (row.cells || []).map((cell, cIdx) => {
        normalizedCellCount++;
        const typo = extractCellTypography(cell);
        const cellParagraphs = (cell.paragraphs || []).map((p, pIdx) => ({
          index: pIdx,
          text: String(p.text || p.rawText || '').trimEnd(),
          alignment: p.format?.alignment || null,
          isBold: Boolean((p.runs || []).some(r => r.bold || r.format?.bold))
        })).filter(p => p.text.trim().length > 0);
        return {
          col: cell.col ?? cIdx,
          colspan: Number(cell.colspan || typo.gridSpan || 1),
          rowspan: Number(cell.rowspan || 1),
          text: (cell.text || '').trim(),
          paragraphs: cellParagraphs,
          imagesCount: (cell.images || []).length,
          typography: typo
        };
      });
      return {
        rowIndex: rIdx,
        structureType: structMeta.type,
        cellsCount: formattedCells.length,
        cells: formattedCells
      };
    });

    const tblFieldCandidates = extractStructuralFieldCandidates(formattedRows, tIdx);
    fieldCandidates.push(...tblFieldCandidates);

    const firstRowText = formattedRows[0]?.cells?.[0]?.text || '';
    const univHeader = detectSectionHeaderUniversal(firstRowText);
    const inferredSecNum = rec.sectionNumber || univHeader?.sectionNumber || (tIdx + 1);
    const title = rec.title || univHeader?.title || firstRowText || `Table ${tIdx + 1}`;

    const tableObj = {
      tableIndex: tIdx,
      sectionNumber: inferredSecNum,
      title,
      columns: gridWidthsTwips.length || (formattedRows[0]?.cellsCount || 0),
      gridWidthsTwips,
      rowsCount: formattedRows.length,
      rows: formattedRows,
      fieldCandidates: tblFieldCandidates
    };
    tables.push(tableObj);
    records.push({
      kind: 'table',
      tableIndex: tIdx,
      sectionNumber: inferredSecNum,
      title,
      columns: tableObj.columns,
      rows: formattedRows
    });

    if (!dynamicSectionsMap.has(inferredSecNum)) {
      dynamicSectionsMap.set(inferredSecNum, {
        sectionNumber: inferredSecNum,
        title,
        tables: [tableObj],
        rowsCount: formattedRows.length
      });
    } else {
      const existing = dynamicSectionsMap.get(inferredSecNum);
      existing.tables.push(tableObj);
      existing.rowsCount += formattedRows.length;
    }
  }

  if (totalBodyTableXmlCount !== tables.length) {
    recognitionWarnings.push({
      code: 'table_wrapper_not_normalized',
      sourceCount: totalBodyTableXmlCount,
      normalizedCount: tables.length,
      message: '文档 XML 中存在嵌套或包装表格；原始 XML 已完整保留在 sourceOoxml 中。'
    });
  }

  for (const rec of (engine.records || []).filter(r => r.kind === 'table' && /^word\/(?:header|footer)/i.test(r.part || ''))) {
    headerFooter.tables.push({
      part: rec.part,
      rowsCount: (rec.rows || []).length,
      text: (rec.rows || []).flatMap(r => (r.cells || []).map(c => (c.text || '').trim())).filter(Boolean).join(' | ')
    });
  }

  const dynamicSections = Array.from(dynamicSectionsMap.values()).sort((a, b) => a.sectionNumber - b.sectionNumber);

  return {
    schemaVersion: '2.0.0',
    sourceName,
    sourceType: 'docx',
    recognizedAt: new Date().toISOString(),
    headerFooter,
    bodyParagraphs,
    tables,
    records,
    dynamicSections,
    fieldCandidates,
    sourceOoxml,
    coverage: {
      bodyTableXmlCount: totalBodyTableXmlCount,
      topLevelBodyTableCount: topLevelBodyTblCount,
      normalizedBodyTableCount: tables.length,
      tableCountMatches: totalBodyTableXmlCount === tables.length,
      normalizedCellCount,
      bodyParagraphCount: bodyParagraphs.length,
      headerFooterPartsCount: headerFooter.headers.length + headerFooter.footers.length
    },
    recognitionWarnings
  };
}

/**
 * 主入口：全量识别 DOCX 源文件事实
 * 支持传入 { universalOnly: true } 仅返回零行业硬编码的通用识别结果
 */
export async function recognizeSourceDocx(docxPathOrBuffer, sourceNameOrOptions = 'source.docx', extraOptions = {}) {
  const opts = (typeof sourceNameOrOptions === 'object' && sourceNameOrOptions !== null)
    ? sourceNameOrOptions
    : { sourceName: sourceNameOrOptions, ...extraOptions };
  const sourceName = opts.sourceName || 'source.docx';

  let fileBuffer = docxPathOrBuffer;
  if (typeof docxPathOrBuffer === 'string') {
    if (fs.existsSync(docxPathOrBuffer)) {
      fileBuffer = await fs.promises.readFile(docxPathOrBuffer);
    } else {
      throw new Error(`文件不存在: ${docxPathOrBuffer}`);
    }
  }

  const universal = await recognizeDocumentUniversal(fileBuffer, { sourceName });
  if (opts.universalOnly) {
    return universal;
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
    chemicalClassification: null,
    contactPhone: null,
    emergencyPhone: null,
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
      hazardousComponentsOnLabel: null,
      hasPictograms: false,
      pictogramCount: 0
    },
    components: [], // Section 3 组分列表
    componentsNotes: [], // Section 3 组分附注（如成盐中和剂说明）
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
      mucousMembraneIrritation: null,
      clinicalAssessment: null,
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

  // 1. 遍历并切分记录行，支持单表格中多章节共存及“段落标题+表格/文本”混合拓扑分离
  let currentSecNum = null;
  let currentSecTitle = '';

  for (const record of records) {
    // A. 段落记录处理 (kind === 'text')
    if (record.kind === 'text') {
      const pText = (record.text || record.title || '').trim();
      if (!pText) continue;

      const inlineHeader = detectSectionHeaderInText(pText);
      if (inlineHeader) {
        currentSecNum = inlineHeader.sectionNumber;
        currentSecTitle = inlineHeader.title;
        const targetSec = facts.sections[currentSecNum];
        if (!targetSec.title) {
          targetSec.title = currentSecTitle;
        }
        continue;
      }

      // 非标题段落，若处于已激活的章节，将其转化为规范结构行注入事实
      if (currentSecNum && currentSecNum >= 1 && currentSecNum <= 16) {
        const targetSec = facts.sections[currentSecNum];
        const lines = pText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          const colonMatch = line.match(/^([^：:]{2,25})[：:](.*)$/);
          if (colonMatch && colonMatch[2].trim()) {
            const k = colonMatch[1].trim();
            const v = colonMatch[2].trim();
            const virtualRow = {
              cells: [
                { text: k, paragraphs: [{ text: k, runs: [{ bold: true, format: { font: 'SimSun', sizeHalfPoints: 21 } }] }] },
                { text: v, paragraphs: [{ text: v, runs: [{ bold: false, format: { font: 'SimSun', sizeHalfPoints: 21 } }] }] }
              ]
            };
            targetSec.rows.push({
              rowIndex: targetSec.rows.length,
              structureType: STRUCTURE_TYPES.TWO_COLUMN,
              semanticType: SEMANTIC_TYPES.CHILD_LABEL,
              label: k,
              value: v,
              columnCount: 2,
              cells: [
                { colIndex: 0, text: k, typography: { fontFamily: 'SimSun', fontSizePt: 10.5, isBold: true, isItalic: false, alignment: 'left', gridSpan: 1, widthDxa: null } },
                { colIndex: 1, text: v, typography: { fontFamily: 'SimSun', fontSizePt: 10.5, isBold: false, isItalic: false, alignment: 'left', gridSpan: 1, widthDxa: null } }
              ]
            });
            secRawRowsMap.get(currentSecNum).push(virtualRow);
            targetSec.structureSummary.twoColumnCount++;
          } else {
            const virtualRow = {
              cells: [
                { text: line, paragraphs: [{ text: line, runs: [{ bold: false, format: { font: 'SimSun', sizeHalfPoints: 21 } }] }] }
              ]
            };
            targetSec.rows.push({
              rowIndex: targetSec.rows.length,
              structureType: STRUCTURE_TYPES.FULL_WIDTH,
              semanticType: SEMANTIC_TYPES.EXPLANATION,
              label: '—',
              value: line,
              columnCount: 1,
              cells: [
                { colIndex: 0, text: line, typography: { fontFamily: 'SimSun', fontSizePt: 10.5, isBold: false, isItalic: false, alignment: 'left', gridSpan: 1, widthDxa: null } }
              ]
            });
            secRawRowsMap.get(currentSecNum).push(virtualRow);
            targetSec.structureSummary.fullWidthCount++;
          }
          targetSec.rowsCount = targetSec.rows.length;
        }
      }
      continue;
    }

    // B. 表格记录处理 (kind === 'table')
    if (record.sectionNumber && record.sectionNumber >= 1 && record.sectionNumber <= 16) {
      currentSecNum = record.sectionNumber;
      currentSecTitle = record.title || '';
    }

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

  // 3. 内置物理无损自检指纹 (Physical Integrity & Lossless Checksum)
  const W_NS_LOCAL = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const bodyNode = engine.documentXml?.getElementsByTagNameNS(W_NS_LOCAL, 'body')?.[0];
  const rawParagraphs = bodyNode ? Array.from(bodyNode.getElementsByTagNameNS(W_NS_LOCAL, 'p')).map(p => (p.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean) : [];
  const rawCharCount = rawParagraphs.join('').replace(/\s+/g, '').length;

  const c1Joined = [];
  const coveredSections = [];
  const emptySections = [];
  for (let s = 1; s <= 16; s++) {
    const sec = facts.sections[s];
    if (sec && sec.rowsCount > 0) {
      coveredSections.push(s);
    } else {
      emptySections.push(s);
    }
    if (sec?.title) c1Joined.push(sec.title);
    for (const r of (sec?.rows || [])) {
      for (const c of (r.cells || [])) {
        if (c.text) c1Joined.push(c.text);
      }
    }
  }
  const c1Compact = c1Joined.join('\n').replace(/\s+/g, '');
  const missingParagraphs = rawParagraphs.filter(line => {
    const compact = line.replace(/\s+/g, '');
    return compact.length >= 2 && !c1Compact.includes(compact);
  });

  facts.integrity = {
    rawParagraphCount: rawParagraphs.length,
    rawCharCount,
    extractedCharCount: c1Compact.length,
    conservationRatio: rawCharCount > 0 ? Number(((c1Compact.length / rawCharCount) * 100).toFixed(2)) : 0,
    coveredSectionsCount: coveredSections.length,
    emptySections,
    missingParagraphCount: missingParagraphs.length,
    missingParagraphs: missingParagraphs.slice(0, 20),
    isLossless: emptySections.length === 0 && missingParagraphs.length === 0
  };

  facts.universal = universal;
  facts.headerFooter = universal.headerFooter;
  facts.bodyParagraphs = universal.bodyParagraphs;
  facts.tables = universal.tables;
  facts.dynamicSections = universal.dynamicSections;
  facts.fieldCandidates = universal.fieldCandidates;
  facts.sourceOoxml = universal.sourceOoxml;
  facts.coverage = universal.coverage;
  facts.recognitionWarnings = universal.recognitionWarnings;

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
    const modelMatch = fullRowText.match(/(?:产品型号|型号|Model|Product model|产品名称)[：:\s]+([A-Za-z0-9_.\-]+)/i);
    if (!facts.modelCode) {
      const directCodeMatch = fullRowText.match(/\b([A-Z]{2,4}[-_]?\d{3,5}[A-Z0-9-]*)\b/i);
      if (directCodeMatch) {
        facts.modelCode = directCodeMatch[1].toUpperCase();
      }
    }
    if (modelMatch && !facts.modelCode) {
      facts.modelCode = modelMatch[1].trim();
    }
    if (!facts.modelCode && nameMatch) {
      const codeInName = nameMatch[1].match(/([A-Z]{2,}[-_]?\d+[A-Z0-9]*)/i);
      if (codeInName) facts.modelCode = codeInName[1].trim();
    }

    const chemMatch = fullRowText.match(/(?:化学品分类|产品分类|产品类型|Chemical classification)[：:\s]*([^\r\n]+)/i);
    if (chemMatch && !facts.chemicalClassification) {
      facts.chemicalClassification = chemMatch[1].trim();
    }

    const c0 = (row.cells[0]?.text || '').trim();
    const c1 = (row.cells[1]?.text || '').trim();
    if (/(?:化学品分类|产品分类|产品类型|Chemical classification)/i.test(c0) && c1 && !facts.chemicalClassification) {
      facts.chemicalClassification = c1;
    }
    if (/(?:应急咨询电话|应急电话|24小时应急电话|Emergency telephone)/i.test(c0) && c1 && !facts.emergencyPhone) {
      facts.emergencyPhone = c1;
    }
    if (/(?:联系电话|电话|公司电话|Telephone)/i.test(c0) && c1 && !facts.contactPhone) {
      facts.contactPhone = c1;
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
            if (line) {
              rawLines.push(line);
              if (/(?:请注意以下物质|中和剂|已键合为盐|键合为盐)/i.test(line)) {
                if (!facts.componentsNotes) facts.componentsNotes = [];
                if (!facts.componentsNotes.includes(line)) facts.componentsNotes.push(line);
              }
            }
          });
        }
      }
    }
  }

  // 0. 检查是否包含 Drawing 象形图节点
  let drawingCount = 0;
  for (const row of record.rows || []) {
    for (const cell of row.cells || []) {
      for (const p of cell.paragraphs || []) {
        for (const r of p.runs || []) {
          if (r.images && r.images.length > 0) {
            drawingCount += r.images.length;
          }
        }
      }
    }
  }
  if (drawingCount > 0) {
    facts.ghs.hasPictograms = true;
    facts.ghs.pictogramCount = drawingCount;
  }

  let inGhsCategories = false;
  let currentPGroup = null;
  const prosePrecautionary = {
    prevention: [],
    response: [],
    storage: [],
    disposal: []
  };

  const isNegationCategory = (cat) => /^(?:无|无危害|不适用|(?:根据\s*GHS\s*)?不属于(?:危害化学品|危险(?:化学)?品|危险物|危险货物)|未分类|非危险(?:品|化学品)?|not\s*classified(?:\s*as\s*hazardous)?|not\s*a\s*hazardous\s*substance(?:\s*or\s*mixture)?(?:\s*according\s*to\s*GHS)?|none|n\/?a)$/i.test((cat || '').trim());

  for (const line of rawLines) {
    if (/(?:2\.1\s*)?(?:GHS危险性类别|GHS\s*Hazard\s*Categories|GHS分类|物质或混合物的?分类|危险性类别|Classification of the substance)/i.test(line)) {
      inGhsCategories = true;
      const afterColon = line.replace(/.*(?:GHS危险性类别|GHS\s*Hazard\s*Categories|GHS分类|物质或混合物的?分类|危险性类别|Classification of the substance)[：:\s]*/i, '').trim();
      if (afterColon && !/^(?:分类|详见下文|如下)/i.test(afterColon)) {
        const cats = afterColon.split(/[；;、\n]+/).map(s => s.trim()).filter(Boolean);
        for (const c of cats) {
          if (c && !isNegationCategory(c) && !facts.ghs.categories.includes(c)) {
            facts.ghs.categories.push(c);
          }
        }
      }
      continue;
    }

    if (inGhsCategories) {
      if (/2\.2|2\.3|GHS标签要素|标签要素|信号词|警示词|警告词|危险性说明|危害性说明|象形图|防范说明|Precautionary|P\d{3}|其他危[害险]|Other\s*hazards/i.test(line)) {
        inGhsCategories = false;
      } else {
        if (!/^(?:物质或混合物分类|GHS分类|危险性类别|CHS危险性类别)[：:]?$/i.test(line)) {
          if (!/^(?:防范说明|P\d{3}|2\.\d|其他危[害险])/i.test(line)) {
            const cats = line.split(/[；;、\n]+/).map(s => s.trim()).filter(Boolean);
            for (const c of cats) {
              if (c && !isNegationCategory(c) && !facts.ghs.categories.includes(c)) {
                facts.ghs.categories.push(c);
              }
            }
          }
        }
      }
    }

    if (/(?:象形图|危险象形标记|Pictograms?)[：:\s]*(.+)/i.test(line)) {
      const picText = line.replace(/.*(?:象形图|危险象形标记|Pictograms?)[：:\s]*/i, '').trim();
      if (/^(?:无|None|不适用)$/i.test(picText)) {
        facts.ghs.hasPictograms = false;
        facts.ghs.pictogramCount = 0;
      } else if (picText && !/^(?:详见|参见|如下)/i.test(picText)) {
        facts.ghs.hasPictograms = true;
        if (facts.ghs.pictogramCount === 0) facts.ghs.pictogramCount = 1;
      }
    }

    if (/(?:信号词|警示词|警告词|Signal\s*word)[：:\s]*(危险|警告|无|Danger|Warning|None)/i.test(line)) {
      const match = line.match(/(?:信号词|警示词|警告词|Signal\s*word)[：:\s]*(危险|警告|无|Danger|Warning|None)/i);
      if (match) {
        const sw = match[1].trim();
        facts.ghs.signalWord = /^(?:无|none)$/i.test(sw) ? null : sw;
      }
    }

    // 标签有害成分识别 (如: 必须列在标签上的有害成份：2-丁氧基乙醇)
    if (/(?:必须列在标签上的有害成[份分]|列在标签上的有害成[份分])[：:\s]*(.*)/i.test(line)) {
      const match = line.match(/(?:必须列在标签上的有害成[份分]|列在标签上的有害成[份分])[：:\s]*(.*)/i);
      if (match && match[1].trim()) {
        facts.ghs.hazardousComponentsOnLabel = match[1].trim();
      }
    }

    // 危险性说明提取 (支持有 H 码及无 H 码非危/描述性陈述)
    const cleanHText = (code, rawTxt, fullLine) => {
      let t = (rawTxt || '').replace(/^[)）\]】\s]+|[)）\]】\s]+$/g, '').trim();
      if (!t && fullLine) {
        const stripped = fullLine.replace(/\(H\d{3}[a-zA-Z]?\)/g, '').replace(/H\d{3}[a-zA-Z]?/g, '').replace(/^[)）\]】\s]+|[)）\]】\s]+$/g, '').trim();
        if (stripped && !/^(?:GHS|CHS|危险性类别|分类)[：:\s]*$/i.test(stripped) && !/(?:类别\s*\d|分类)/i.test(stripped)) {
          t = stripped;
        }
      }
      // 严格遵循 Context 1 零虚构公理：若源文仅载明 H 码而无叙述文本，保持为空字符串，交由 Context 2 治理层按需补全
      return t;
    };

    if (/(?:危[险害]性说明|危险陈述|Hazard\s*statements?)[：:\s]*/i.test(line)) {
      const hContent = line.replace(/.*(?:危[险害]性说明|危险陈述|Hazard\s*statements?)[：:\s]*/i, '').trim();
      const hMatches = Array.from(hContent.matchAll(/(H\d{3}[a-zA-Z]?)[：:\s]*([^\r\n;；]+)/g));
      if (hMatches.length > 0) {
        for (const m of hMatches) {
          const code = m[1];
          const text = cleanHText(code, m[2], line);
          if (!facts.ghs.hazardStatements.some(h => h.code === code)) {
            facts.ghs.hazardStatements.push({ code, text });
          }
        }
      } else if (hContent && !/^(?:无|None|详见下文|如下)$/i.test(hContent)) {
        facts.ghs.hazardStatements.push({ code: null, text: hContent });
      }
    } else {
      const hMatches = line.matchAll(/(H\d{3}[a-zA-Z]?)[：:\s]*([^\r\n;；]+)/g);
      for (const m of hMatches) {
        const code = m[1];
        const text = cleanHText(code, m[2], line);
        if (!facts.ghs.hazardStatements.some(h => h.code === code)) {
          facts.ghs.hazardStatements.push({ code, text });
        }
      }
    }

    // 防范说明分组指示
    if (/(?:【?预防措施】?|防范说明\s*[:：]?\s*预防)/i.test(line)) {
      currentPGroup = 'prevention';
      const afterHdr = line.replace(/.*(?:【?预防措施】?|防范说明\s*[:：]?\s*预防)[：:\s]*/i, '').trim();
      if (afterHdr) prosePrecautionary.prevention.push(afterHdr);
      continue;
    } else if (/(?:【?事故响应】?|防范说明\s*[:：]?\s*事故响应|响应措施)/i.test(line)) {
      currentPGroup = 'response';
      const afterHdr = line.replace(/.*(?:【?事故响应】?|防范说明\s*[:：]?\s*事故响应|响应措施)[：:\s]*/i, '').trim();
      if (afterHdr) prosePrecautionary.response.push(afterHdr);
      continue;
    } else if (/(?:【?安全(?:储存|存储)】?|防范说明\s*[:：]?\s*安全(?:储存|存储)|(?:安全)?(?:储存|存储))[：:]/i.test(line)) {
      currentPGroup = 'storage';
      const afterHdr = line.replace(/.*(?:【?安全(?:储存|存储)】?|防范说明\s*[:：]?\s*安全(?:储存|存储)|(?:安全)?(?:储存|存储))[：:\s]*/i, '').trim();
      if (afterHdr) prosePrecautionary.storage.push(afterHdr);
      continue;
    } else if (/(?:【?废弃处[置理]】?|防范说明\s*[:：]?\s*废弃)/i.test(line)) {
      currentPGroup = 'disposal';
      const afterHdr = line.replace(/.*(?:【?废弃处[置理]】?|防范说明\s*[:：]?\s*废弃)[：:\s]*/i, '').trim();
      if (afterHdr) prosePrecautionary.disposal.push(afterHdr);
      continue;
    }

    if (/(?:2\.3\s*)?(?:其他危害|物理化学危[险害]|健康危[险害]|环境危[险害]|Other hazards)/i.test(line)) {
      currentPGroup = null;
      if (!facts.ghs.otherHazards) facts.ghs.otherHazards = [];
      if (Array.isArray(facts.ghs.otherHazards)) {
        facts.ghs.otherHazards.push(line);
      } else {
        facts.ghs.otherHazards = [facts.ghs.otherHazards, line].filter(Boolean);
      }
      continue;
    }

    const pMatches = Array.from(line.matchAll(/(P\d{3}(?:\s*\+\s*P\d{3})*)[：:\s]*([^\r\n;；]+)/g));
    if (pMatches.length > 0) {
      for (const pm of pMatches) {
        const codeClean = pm[1].replace(/\s+/g, '');
        const item = { code: codeClean, text: pm[2].trim() };
        const prefix = codeClean.slice(0, 2);
        let targetGroup = currentPGroup;
        if (!targetGroup || (prefix === 'P5' && targetGroup !== 'disposal') || (prefix === 'P4' && targetGroup !== 'storage') || (prefix === 'P3' && targetGroup !== 'response') || (prefix === 'P2' && targetGroup !== 'prevention')) {
          if (prefix === 'P2') targetGroup = 'prevention';
          else if (prefix === 'P3') targetGroup = 'response';
          else if (prefix === 'P4') targetGroup = 'storage';
          else if (prefix === 'P5') targetGroup = 'disposal';
          else targetGroup = 'prevention';
        }
        facts.ghs.precautionaryStatements[targetGroup].push(item);
      }
    } else if (currentPGroup && line && !/^(?:防范说明|GHS标签要素|2\.\d)/i.test(line)) {
      prosePrecautionary[currentPGroup].push(line);
    }
  }

  // 若未检测到任何 P 编码，则激活散文后备解析器将收集到的中文句子分流填入四大组
  const totalPCoded = Object.values(facts.ghs.precautionaryStatements).reduce((sum, arr) => sum + arr.length, 0);
  if (totalPCoded === 0) {
    for (const group of ['prevention', 'response', 'storage', 'disposal']) {
      const groupLines = prosePrecautionary[group];
      for (const rawL of groupLines) {
        const sentences = rawL.split(/(?<=[。；;])\s*/).map(s => s.trim()).filter(Boolean);
        for (const sent of sentences) {
          if (sent && !facts.ghs.precautionaryStatements[group].some(it => it.text === sent)) {
            facts.ghs.precautionaryStatements[group].push({ code: null, text: sent });
          }
        }
      }
    }
  }

  // 严格依据 GHS 标准二分判定是否为危险品
  const hasValidCategories = facts.ghs.categories.length > 0;
  const hasValidHCodes = facts.ghs.hazardStatements.some(h => h.code && /^H\d{3}/i.test(h.code));
  const hasDangerSignal = facts.ghs.signalWord === '危险' || facts.ghs.signalWord === 'Danger';
  const hasPictograms = facts.ghs.hasPictograms;

  facts.ghs.isHazardous = Boolean(hasValidCategories || hasValidHCodes || hasDangerSignal || hasPictograms);
}

function parseSection3(record, facts) {
  const rows = record.rows || [];
  for (const row of rows) {
    const cells = row.cells.map(c => (c.text || '').trim());
    const full = cells.join(' ');

    // 检查成分表下方的特殊附注（如成盐中和剂说明），即使为单列或合并单元格也必须抽取
    if (/(?:请注意以下物质|中和剂|已键合为盐|键合为盐)/i.test(full)) {
      if (!facts.componentsNotes) facts.componentsNotes = [];
      if (!facts.componentsNotes.includes(full)) {
        facts.componentsNotes.push(full);
      }
      continue;
    }

    if (cells.length < 2) continue;
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
    const c0 = (row.cells[0]?.text || '').trim();
    const c1 = (row.cells[1]?.text || '').trim();
    const full = row.cells.map(c => (c.text || '').trim()).join(' ');
    const val = c1 || full.replace(/^[^：:]{2,20}[：:]/, '').trim();

    if (/^(?:4\.\s*)?急救措施$/i.test(c0)) continue;

    if (/(?:一般措施|一般的建议|常规建议|4\.1)/i.test(c0) && !facts.firstAid.general) facts.firstAid.general = val;
    if (/(?:接触皮肤|皮肤接触|皮肤|4\.4)/i.test(c0) && !facts.firstAid.skin) facts.firstAid.skin = val;
    if (/(?:接触眼睛|眼睛接触|眼睛|4\.3)/i.test(c0) && !facts.firstAid.eyes) facts.firstAid.eyes = val;
    if (/(?:吸入|4\.5)/i.test(c0) && !facts.firstAid.inhalation) facts.firstAid.inhalation = val;
    if (/(?:食入|误服|4\.2)/i.test(c0) && !facts.firstAid.ingestion) facts.firstAid.ingestion = val;
  }
}

function parseSection5(record, facts) {
  for (const row of record.rows || []) {
    const c0 = (row.cells[0]?.text || '').trim();
    const c1 = (row.cells[1]?.text || '').trim();
    const full = row.cells.map(c => (c.text || '').trim()).join(' ');
    const val = c1 || full.replace(/^[^：:]{2,20}[：:]/, '').trim();

    if (/^(?:5\.\s*)?消防措施$/i.test(c0)) continue;

    if (/(?:不合适的灭火[介剂]|不适用的灭火[介剂]|不适合的灭火剂|5\.2)/i.test(c0)) {
      facts.fireFighting.unsuitableExtinguishMedia = val;
    } else if (/(?:合适的灭火[介剂]|合适灭火剂|5\.1)/i.test(c0)) {
      facts.fireFighting.suitableExtinguishMedia = val;
      if (!facts.fireFighting.media) facts.fireFighting.media = val;
    } else if (/(?:灭火介质|灭火剂)/i.test(c0) && !facts.fireFighting.media) {
      facts.fireFighting.media = val;
    }

    if (/(?:特殊危害|特别危险性|5\.3)/i.test(c0)) {
      facts.fireFighting.specialHazards = val;
      facts.fireFighting.hazards = val;
    } else if (!c0 && c1 && facts.fireFighting.specialHazards) {
      facts.fireFighting.specialHazards += ' ' + c1;
      facts.fireFighting.hazards = facts.fireFighting.specialHazards;
    }
    if (/(?:消防人员防护装备|防护装备|消防员特殊防护装备|5\.4)/i.test(c0)) {
      facts.fireFighting.protectiveEquipment = val;
    }
  }
}

function parseSection6(record, facts) {
  const allText = record.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  facts.accidentalRelease.rawText = allText;
}

function parseSection7(record, facts) {
  for (const row of record.rows || []) {
    const c0 = (row.cells[0]?.text || '').trim();
    const c1 = (row.cells[1]?.text || '').trim();
    const full = row.cells.map(c => (c.text || '').trim()).join(' ');
    const val = c1 || full.replace(/^[^：:]{2,20}[：:]/, '').trim();

    if (/^(?:7\.\s*)?操作和储存$/i.test(c0)) continue;

    if (/(?:安全操作(?:的)?(?:防范|注意事项)|操作处置注意事项|操作注意事项|7\.1\s*安全操作)/i.test(c0)) {
      facts.handlingStorage.handling = val;
    }
    if (/(?:安全储存(?:的)?条件|储存注意事项|安全储存条件|7\.2\s*安全储存)/i.test(c0)) {
      facts.handlingStorage.storage = val;
    }
  }
}

function parseSection8(record, facts) {
  for (const row of record.rows || []) {
    // 1. 递归检查单元格挂载的嵌套子表格 (如 PA-4914 嵌套限值表)
    for (const cell of row.cells || []) {
      if (cell.nestedTables && cell.nestedTables.length > 0) {
        for (const nTbl of cell.nestedTables) {
          for (let rIdx = 0; rIdx < nTbl.rows.length; rIdx++) {
            const nRow = nTbl.rows[rIdx];
            const nCells = nRow.cells.map(c => (c.text || '').trim());
            if (rIdx === 0 && nCells.some(c => /物质|Substance/i.test(c)) && nCells.some(c => /标准|来源|Basis/i.test(c))) {
              continue;
            }
            if (nCells.length >= 4) {
              const last = facts.exposureControls.limits[facts.exposureControls.limits.length - 1];
              facts.exposureControls.limits.push({
                substance: nCells[0] || last?.substance || '',
                basis: nCells[1] || last?.basis || 'ACGIH',
                mac_twa: nCells[2],
                stel: nCells[3],
                type: nCells[2],
                value: nCells[3]
              });
            } else if (nCells.length === 3) {
              facts.exposureControls.limits.push({
                substance: nCells[0],
                basis: 'OEL',
                mac_twa: nCells[1],
                stel: nCells[2],
                type: nCells[1],
                value: nCells[2]
              });
            } else if (nCells.length === 2 && facts.exposureControls.limits.length > 0) {
              const last = facts.exposureControls.limits[facts.exposureControls.limits.length - 1];
              facts.exposureControls.limits.push({
                substance: last.substance,
                basis: last.basis || 'ACGIH',
                mac_twa: nCells[0],
                stel: nCells[1],
                type: nCells[0],
                value: nCells[1]
              });
            }
          }
        }
      }
    }

    // 2. 检查顶层表格多列限值行
    const cells = row.cells.map(c => (c.text || '').trim());
    if (cells.length >= 4 && !/物质|Substance|序号/i.test(cells[0])) {
      facts.exposureControls.limits.push({
        substance: cells[0],
        basis: cells[1],
        mac_twa: cells[2],
        stel: cells[3],
        type: cells[2],
        value: cells[3]
      });
    } else if (cells.length === 3 && !/物质|Substance|序号/i.test(cells[0]) && !/呼吸|眼睛|手部|身体/i.test(cells[0])) {
      facts.exposureControls.limits.push({
        substance: cells[0],
        basis: 'OEL',
        mac_twa: cells[1],
        stel: cells[2],
        type: cells[1],
        value: cells[2]
      });
    }

    const full = cells.join(' ');
    if (/呼吸系统防护[：:]/i.test(full)) facts.exposureControls.ppe.respiratory = full.replace(/.*呼吸系统防护[：:]/i, '').trim();
    if (/眼睛防护[：:]/i.test(full)) facts.exposureControls.ppe.eyes = full.replace(/.*眼睛防护[：:]/i, '').trim();
    if (/身体防护[：:]/i.test(full)) facts.exposureControls.ppe.body = full.replace(/.*身体防护[：:]/i, '').trim();
  }

  // 3. 多行手部防护规格聚合状态机
  let inHandProtection = false;
  const handSpecs = [];
  for (const row of record.rows || []) {
    const c0 = (row.cells[0]?.text || '').trim();
    const c1 = (row.cells[1]?.text || '').trim();
    const full = row.cells.map(c => (c.text || '').trim()).filter(Boolean).join(' ');

    if (/手部防护[：:]/i.test(c0)) {
      inHandProtection = true;
      if (c1) handSpecs.push(c1);
      continue;
    }

    if (inHandProtection) {
      if (/眼睛防护|身体防护|呼吸系统防护|工程控制|8\.\d/i.test(c0)) {
        inHandProtection = false;
      } else {
        if (full && full.length > 2 && !/手部防护/i.test(full)) {
          handSpecs.push(full);
        }
      }
    }
  }
  if (handSpecs.length > 0) {
    facts.exposureControls.ppe.hands = handSpecs.join('；');
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
    const c0 = (row.cells[0]?.text || '').trim();
    const c1 = (row.cells[1]?.text || '').trim();
    const full = row.cells.map(c => (c.text || '').trim()).join(' ');
    const val = c1 || full.replace(/^[^：:]{2,20}[：:]/, '').trim();

    if (/^(?:10\.\s*)?稳定性和反应性$/i.test(c0)) continue;

    if (/(?:10\.1\s*)?反应性/i.test(c0) && !/稳定性和反应性/i.test(c0)) facts.stabilityReactivity.reactivity = val;
    if (/(?:10\.1\s*)?(?:化学)?稳定性|稳定性/i.test(c0) && !/稳定性和反应性/i.test(c0)) facts.stabilityReactivity.stability = val;
    if (/(?:10\.[23]\s*)?(?:危险|危害)反应/i.test(c0)) facts.stabilityReactivity.hazardousReactions = val;
    if (/(?:10\.[34]\s*)?应避免的条件/i.test(c0)) facts.stabilityReactivity.conditionsToAvoid = val;
    if (/(?:10\.[45]\s*)?(?:不相容的材料|禁配物)/i.test(c0)) facts.stabilityReactivity.incompatibleMaterials = val;
    if (/(?:10\.[26]\s*)?(?:危险|危害)?(?:的)?分解产物/i.test(c0)) {
      facts.stabilityReactivity.decompositionProducts = val;
      facts.stabilityReactivity.decomposition = val;
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
    } else if (/粘膜刺激/i.test(label)) {
      facts.toxicology.mucousMembraneIrritation = val;
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

    if (/无可用的毒理学研究|风险评估数据|无可用的数据/i.test(label)) {
      facts.toxicology.clinicalAssessment = (facts.toxicology.clinicalAssessment ? facts.toxicology.clinicalAssessment + '\n' : '') + label;
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

    // 先行语义判定：非危险品运输方式 (公路/陆运/铁路/海上/空运)
    if (/公路|陆运|铁路|海上|海运|空运/i.test(lbl)) {
      if (!facts.transport.transportModes) facts.transport.transportModes = [];
      facts.transport.transportModes.push({ mode: lbl, description: val });
      continue;
    }

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
    // 包装类型（严禁按 14.4 序号盲目强绑，仅凭语义关键词匹配）
    if (/包装[组类]型?|packing\s*group/i.test(lbl) && !/特殊|注意|非危险|温度|高于|低于/i.test(lbl + ' ' + val)) {
      const m = val.match(/([I|V]+)/i);
      facts.transport.packingGroup = m ? m[1] : val;
    }
    // 14.5 环境危险
    if (/14\.5|环境危|海洋污染物|marine pollutant|environmental hazard/i.test(lbl)) {
      facts.transport.marinePollutant = val;
    }
    // 特殊防范措施 / 用户特殊注意事项 (支持 14.4 与 14.6 等不同编号源模板；Context 1 仅保留源事实)
    if (/特殊防范|特殊注意事项|用户特殊注意事项|special precautions/i.test(lbl)) {
      facts.transport.specialPrecautions.primaryCn = val;
      facts.transport.specialPrecautions.primaryEn = null;
      facts.transport.specialPrecautions.hasPrecautions = true;
    }
    // 附加信息 (子标签；Context 1 仅保留源事实)
    if (/附加信息|additional information/i.test(lbl)) {
      facts.transport.additionalInfo.rawCn = val;
      facts.transport.additionalInfo.itemsCn = val.split('\n').map(l => l.trim()).filter(Boolean);
      facts.transport.additionalInfo.itemsEn = [];
    }
    // 14.7 MARPOL
    if (/14\.7|MARPOL|IBC/i.test(lbl)) {
      facts.transport.marpol.valCn = val;
      facts.transport.marpol.valEn = null;
    }
  }
}

function parseSection15(record, facts) {
  const allText = record.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  facts.regulations.rawText = allText;
  const lines = allText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  facts.regulations.catalogs = [];
  for (const line of lines) {
    if (/(?:危险化学品|GB|令|条例|规定|规范|法)/i.test(line) && !/法规信息|下列法规|法律法规/i.test(line)) {
      facts.regulations.catalogs.push({ name: line, raw: line });
    }
  }
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
  const hazBasis = facts.ghs?.isHazardous
    ? 'Section 2 载明 GHS 危险性分类/警示信息'
    : 'Section 2 明示非危险品，无象形图/信号词';
  md += '| **产品型号 (Model Code)** | `' + model + '` | Section 1 行 1 匹配提取 |\n';
  md += '| **产品中文品名 (Product Name)** | `' + prodName + '` | Section 1 行 2 匹配提取 |\n';
  md += '| **化学品分类 (Chemical Category)** | `' + category + '` | Section 1 匹配提取 |\n';
  md += '| **GHS 危害性分类** | **' + isHaz + '** | ' + hazBasis + ' |\n';
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

/**
 * 将通用全量识别结果 (recognizeDocumentUniversal) 原样序列化为 1:1 排版对齐的 Markdown
 * 严格保留每个单元格的原始段落数组、colspan/rowspan 与对齐方式，不做 <br/> 拼接或额外列注入
 */
export function serializeUniversalToMarkdown(universal) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = [];
  lines.push(`# ${esc(universal?.sourceName || 'document.docx')} 原样识别结果`, '');

  if (universal?.headerFooter?.headers?.some((h) => h.text?.trim())) {
    lines.push('## 页眉', '');
    for (const h of universal.headerFooter.headers) {
      for (const p of h.paragraphs || []) {
        if (p.text?.trim()) lines.push(esc(p.text.trim()), '');
      }
    }
  }

  for (const tbl of universal?.tables || []) {
    lines.push(`### 表格 ${tbl.tableIndex + 1}`, '', '<table>');
    for (let r = 0; r < (tbl.rows || []).length; r++) {
      const row = tbl.rows[r];
      lines.push('  <tr>');
      for (const cell of row.cells || []) {
        const attrs = [];
        if (cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`);
        if (cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`);
        if (cell.typography?.alignment && cell.typography.alignment !== 'left') {
          const al = cell.typography.alignment === 'both' ? 'left' : cell.typography.alignment;
          attrs.push(`align="${al}"`);
        }
        const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';
        const paraItems = (Array.isArray(cell.paragraphs) && cell.paragraphs.length > 0)
          ? cell.paragraphs
          : (cell.text || '').split(/\r?\n/).map((t) => ({ text: t.trimEnd(), isBold: false })).filter((p) => p.text.trim().length > 0);

        if (paraItems.length === 0) {
          lines.push(`    <td${attrStr}>&nbsp;</td>`);
        } else if (paraItems.length === 1) {
          const txt = esc(paraItems[0].text.trim());
          const isBold = r === 0 || paraItems[0].isBold || cell.typography?.isBold;
          lines.push(`    <td${attrStr}>${isBold ? `<strong>${txt}</strong>` : txt}</td>`);
        } else {
          lines.push(`    <td${attrStr}>`);
          for (const pItem of paraItems) {
            const txt = esc(pItem.text.trim()) || '&nbsp;';
            const isBold = r === 0 || pItem.isBold || cell.typography?.isBold;
            lines.push(`      <div>${isBold ? `<strong>${txt}</strong>` : txt}</div>`);
          }
          lines.push('    </td>');
        }
      }
      lines.push('  </tr>');
    }
    lines.push('</table>', '');
  }

  if (universal?.headerFooter?.footers?.some((f) => f.text?.trim())) {
    lines.push('## 页脚', '');
    for (const f of universal.headerFooter.footers) {
      for (const p of f.paragraphs || []) {
        if (p.text?.trim()) lines.push(esc(p.text.trim()), '');
      }
    }
  }

  return lines.join('\n');
}
