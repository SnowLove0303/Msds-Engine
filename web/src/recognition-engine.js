import fs from 'fs';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { DOMParser as XmlDomParser } from '@xmldom/xmldom';
import { loadDocx } from './docx-engine.js';

// Ensure DOMParser and XMLSerializer are polyfilled in Node.js runtime
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

/**
 * 通用全量无损文档识别器 (L2 Universal Document Recognizer)
 *
 * 严格零行业硬编码、零章节数上限（1..N 任意节数）、零用户/企业数据词典：
 * 1. 全量提取页眉/页脚、表外正文段落、全部表格（行结构、合并关系、段落数组、排版属性与纯结构候选字段）；
 * 2. 原样保留所有 word/*.xml 部件至 sourceOoxml；
 * 3. 输出 coverage 覆盖率核验与未标准化元素 recognitionWarnings；
 * 4. 提供 1:1 忠实于原文档表格合并与段落结构的 serializeUniversalToMarkdown。
 */

export const STRUCTURE_TYPES = Object.freeze({
  TWO_COLUMN: 'TWO_COLUMN',
  EXPLANATION_ROW: 'EXPLANATION_ROW',
  FULL_WIDTH: 'FULL_WIDTH',
  MULTI_COLUMN: 'MULTI_COLUMN'
});

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
 * 提取单元格主导的字体与排版样式 (纯数据对象)
 */
export function extractCellTypography(cell) {
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

  const runs = cell.paragraphs.flatMap((p) => p.runs || []);
  if (runs.length > 0) {
    typography.isBold = runs.some((r) => r.bold || r.format?.bold);
    typography.isItalic = runs.some((r) => r.format?.italic);

    const firstRun = runs.find((r) => r.format?.font || r.format?.sizeHalfPoints);
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
export function classifyRowStructure(row) {
  const cells = row?.cells || [];
  const cellCount = cells.length;

  if (cellCount === 0) {
    return { type: STRUCTURE_TYPES.EXPLANATION_ROW, gridSpan: 1 };
  }

  if (cellCount === 1) {
    const c = cells[0];
    const span = c.properties?.gridSpan || 1;
    const txt = (c.text || '').trim();
    const isExplanation = txt.length > 0 && txt.length < 80 && /[：:]$/.test(txt);
    return {
      type: isExplanation ? STRUCTURE_TYPES.EXPLANATION_ROW : STRUCTURE_TYPES.FULL_WIDTH,
      gridSpan: span
    };
  }

  if (cellCount === 2) {
    const txt0 = (cells[0]?.text || '').trim();
    const txt1 = (cells[1]?.text || '').trim();
    if (!txt0 && txt1) {
      return { type: STRUCTURE_TYPES.EXPLANATION_ROW, gridSpan: 2 };
    }
    return { type: STRUCTURE_TYPES.TWO_COLUMN, gridSpan: 1 };
  }

  return { type: STRUCTURE_TYPES.MULTI_COLUMN, columnCount: cellCount };
}

/**
 * 纯结构化候选字段抽取（依据加粗或冒号特征，无任何行业词典）
 */
export function extractStructuralFieldCandidates(rows, tableIndex) {
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
    const text = Array.from(p.getElementsByTagNameNS(W_NS, 't')).map((t) => t.textContent || '').join('').trim();
    return { index: idx, text };
  }).filter((p) => p.text.length > 0);
  const tablesCount = doc.getElementsByTagNameNS(W_NS, 'tbl').length;
  const drawingsCount = doc.getElementsByTagNameNS(W_NS, 'drawing').length;
  return {
    partName,
    text: paragraphs.map((p) => p.text).join('\n'),
    paragraphs,
    tablesCount,
    drawingsCount
  };
}

/**
 * 通用全量无损文档识别器 (L2 Universal Document Recognizer)
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

  const sourceOoxml = {};
  const headerFooter = { headers: [], footers: [], tables: [] };
  const xmlFiles = Object.keys(zip.files).filter((name) => /^word\/.*\.xml$/i.test(name) && !zip.files[name].dir).sort();
  for (const partName of xmlFiles) {
    const xmlText = await zip.files[partName].async('string');
    sourceOoxml[partName] = xmlText;
    if (/^word\/header\d*\.xml$/i.test(partName)) {
      headerFooter.headers.push(parseHeaderFooterXmlPart(xmlText, partName));
    } else if (/^word\/footer\d*\.xml$/i.test(partName)) {
      headerFooter.footers.push(parseHeaderFooterXmlPart(xmlText, partName));
    }
  }

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

  const docXml = engine.documentXml || parsedXmlDocs['word/document.xml'];
  const bodyNode = docXml?.getElementsByTagNameNS(W_NS, 'body')?.[0];
  const bodyParagraphs = [];
  let topLevelBodyTblCount = 0;
  if (bodyNode) {
    let pIdx = 0;
    for (const child of Array.from(bodyNode.childNodes || [])) {
      if (child.nodeType !== 1) continue;
      if (child.localName === 'p') {
        const text = Array.from(child.getElementsByTagNameNS(W_NS, 't')).map((t) => t.textContent || '').join('').trim();
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

  const records = [];
  const tables = [];
  const dynamicSectionsMap = new Map();
  const fieldCandidates = [];
  let normalizedCellCount = 0;

  const engineTableRecords = (engine.records || []).filter((r) => r.kind === 'table' && !/^word\/(?:header|footer)/i.test(r.part || ''));
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
          isBold: Boolean((p.runs || []).some((r) => r.bold || r.format?.bold))
        })).filter((p) => p.text.trim().length > 0);
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

  for (const rec of (engine.records || []).filter((r) => r.kind === 'table' && /^word\/(?:header|footer)/i.test(r.part || ''))) {
    headerFooter.tables.push({
      part: rec.part,
      rowsCount: (rec.rows || []).length,
      text: (rec.rows || []).flatMap((r) => (r.cells || []).map((c) => (c.text || '').trim())).filter(Boolean).join(' | ')
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
 * 将通用全量识别结果 (recognizeDocumentUniversal) 原样序列化为 1:1 排版对齐的 Markdown
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
