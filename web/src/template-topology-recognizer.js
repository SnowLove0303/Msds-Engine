/**
 * MSDS-Engine: 纯结构与样式拓扑识别及构建层 (Template Topology Recognizer & Constructor)
 *
 * 核心公理:
 * 1. 一切以用户上传的模板识别与构建结果为事实，模板只提供结构与样式，绝不提供内容；
 * 2. 零用户数据、零内容词典、零固定章节数(1..16)/固定缩进(420/560)/固定字体兜底；
 * 3. 不标准模板采用“出现最多即标准 (Mode Election)”选举各角色样式原型，未显式声明时回退至文档自身 styles.xml docDefaults；
 * 4. 输出面向结构化编辑器的可编辑 StandardTopology 契约，支持 1:1 表格与段落样式复用。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

export function buildStructuralSlotKey(sectionNumber, rowIndex, cellIndex) {
  return `sec${sectionNumber}_r${rowIndex}_c${cellIndex}`;
}

/**
 * 众数选举器：从样本数组中选出出现频次最高的值（用于不标准模板的样式归一化）
 */
export function electModeValue(values, fallback = null) {
  const counts = new Map();
  let best = fallback;
  let max = 0;
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
    const entry = counts.get(key) || { count: 0, value: v };
    entry.count += 1;
    counts.set(key, entry);
    if (entry.count > max) {
      max = entry.count;
      best = v;
    }
  }
  return best;
}

/**
 * 从多个样式原型样本中按属性维度逐项众数选举出标准样式原型
 */
export function electModeStylePrototype(samples, docDefaults = null) {
  const valid = (samples || []).filter(Boolean);
  if (valid.length === 0) return null;
  const pick = (prop, fallback = null) => electModeValue(valid.map(s => s[prop]), fallback);
  return {
    rowHeightDxa: pick('rowHeightDxa', null),
    widthTwips: pick('widthTwips', null),
    vAlign: pick('vAlign', null),
    shadingFill: pick('shadingFill', null),
    tcBorders: pick('tcBorders', null),
    tcMar: pick('tcMar', null),
    align: pick('align', null),
    indentLeft: pick('indentLeft', 0),
    indentFirstLine: pick('indentFirstLine', 0),
    indentHanging: pick('indentHanging', 0),
    lineSpacing: pick('lineSpacing', docDefaults?.lineSpacing ?? null),
    spaceBefore: pick('spaceBefore', docDefaults?.spaceBefore ?? null),
    spaceAfter: pick('spaceAfter', docDefaults?.spaceAfter ?? null),
    font: pick('font', docDefaults?.font ?? null),
    asciiFont: pick('asciiFont', docDefaults?.asciiFont ?? null),
    sz: pick('sz', docDefaults?.sz ?? null),
    bold: pick('bold', false),
    italic: pick('italic', false),
    color: pick('color', null),
    separator: pick('separator', 'none')
  };
}

/**
 * 从 word/styles.xml 提取文档自身 docDefaults（作为未显式声明 rPr/pPr 时的真实基准）
 */
export async function extractDocumentStyleDefaults(zip, parser = new DOMParser()) {
  const defaults = { font: null, asciiFont: null, sz: null, lineSpacing: null, spaceBefore: null, spaceAfter: null };
  const stylesFile = zip?.file('word/styles.xml');
  if (!stylesFile) return defaults;
  try {
    const xml = await stylesFile.async('text');
    const sDoc = parser.parseFromString(xml, 'application/xml');
    const docDefaults = sDoc.getElementsByTagNameNS(W_NS, 'docDefaults')?.[0];
    if (!docDefaults) return defaults;

    const rPr = docDefaults.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
    if (rPr) {
      const rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
      defaults.font = rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia') || rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || null;
      defaults.asciiFont = rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || defaults.font;
      const szNode = rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0];
      defaults.sz = szNode?.getAttributeNS(W_NS, 'val') || szNode?.getAttribute('w:val') || null;
    }

    const pPr = docDefaults.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
    if (pPr) {
      const spacing = pPr.getElementsByTagNameNS(W_NS, 'spacing')?.[0];
      if (spacing) {
        const line = Number(spacing.getAttributeNS(W_NS, 'line') || spacing.getAttribute('w:line'));
        const before = Number(spacing.getAttributeNS(W_NS, 'before') || spacing.getAttribute('w:before'));
        const after = Number(spacing.getAttributeNS(W_NS, 'after') || spacing.getAttribute('w:after'));
        if (Number.isFinite(line) && line > 0) defaults.lineSpacing = line;
        if (Number.isFinite(before) && before >= 0) defaults.spaceBefore = before;
        if (Number.isFinite(after) && after >= 0) defaults.spaceAfter = after;
      }
    }
  } catch {
    // 忽略损坏的 styles.xml
  }
  return defaults;
}

function readBorderNode(borderNode) {
  if (!borderNode) return null;
  const val = borderNode.getAttributeNS(W_NS, 'val') || borderNode.getAttribute('w:val') || null;
  if (!val) return null;
  return {
    val,
    sz: Number(borderNode.getAttributeNS(W_NS, 'sz') || borderNode.getAttribute('w:sz')) || null,
    color: borderNode.getAttributeNS(W_NS, 'color') || borderNode.getAttribute('w:color') || null
  };
}

function readBordersBlock(bordersNode) {
  if (!bordersNode) return null;
  return {
    top: readBorderNode(bordersNode.getElementsByTagNameNS(W_NS, 'top')?.[0]),
    bottom: readBorderNode(bordersNode.getElementsByTagNameNS(W_NS, 'bottom')?.[0]),
    left: readBorderNode(bordersNode.getElementsByTagNameNS(W_NS, 'left')?.[0]),
    right: readBorderNode(bordersNode.getElementsByTagNameNS(W_NS, 'right')?.[0]),
    insideH: readBorderNode(bordersNode.getElementsByTagNameNS(W_NS, 'insideH')?.[0]),
    insideV: readBorderNode(bordersNode.getElementsByTagNameNS(W_NS, 'insideV')?.[0])
  };
}

function readMarginsBlock(marNode) {
  if (!marNode) return null;
  const side = (tag) => {
    const n = marNode.getElementsByTagNameNS(W_NS, tag)?.[0];
    const w = n ? Number(n.getAttributeNS(W_NS, 'w') || n.getAttribute('w:w')) : NaN;
    return Number.isFinite(w) ? w : null;
  };
  return { top: side('top'), bottom: side('bottom'), left: side('left'), right: side('right') };
}

/**
 * 从单元格 OOXML 节点提取完整样式原型 (Style Prototype)，用于下游编辑器 1:1 样式复用
 */
export function extractCellStylePrototype(tcNode, trNode = null, docDefaults = null) {
  if (!tcNode) return null;
  const trPr = trNode?.getElementsByTagNameNS(W_NS, 'trPr')?.[0];
  const trHeightNode = trPr?.getElementsByTagNameNS(W_NS, 'trHeight')?.[0];
  const rowHeightDxa = trHeightNode ? Number(trHeightNode.getAttributeNS(W_NS, 'val') || trHeightNode.getAttribute('w:val')) || null : null;

  const tcPr = tcNode.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
  const tcWNode = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
  const widthTwips = tcWNode ? Number(tcWNode.getAttributeNS(W_NS, 'w') || tcWNode.getAttribute('w:w')) || null : null;
  const gridSpanNode = tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0];
  const gridSpan = Number(gridSpanNode?.getAttributeNS(W_NS, 'val') || gridSpanNode?.getAttribute('w:val') || 1);
  const vMergeNode = tcPr?.getElementsByTagNameNS(W_NS, 'vMerge')?.[0];
  const vMerge = vMergeNode ? (vMergeNode.getAttributeNS(W_NS, 'val') || vMergeNode.getAttribute('w:val') || 'continue') : null;
  const vAlignNode = tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0];
  const vAlign = vAlignNode?.getAttributeNS(W_NS, 'val') || vAlignNode?.getAttribute('w:val') || null;
  const shdNode = tcPr?.getElementsByTagNameNS(W_NS, 'shd')?.[0];
  const shadingFill = shdNode?.getAttributeNS(W_NS, 'fill') || shdNode?.getAttribute('w:fill') || null;
  const tcBorders = readBordersBlock(tcPr?.getElementsByTagNameNS(W_NS, 'tcBorders')?.[0]);
  const tcMar = readMarginsBlock(tcPr?.getElementsByTagNameNS(W_NS, 'tcMar')?.[0]);

  const pNode = tcNode.getElementsByTagNameNS(W_NS, 'p')?.[0];
  const pPr = pNode?.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
  const jcNode = pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0];
  const align = jcNode?.getAttributeNS(W_NS, 'val') || jcNode?.getAttribute('w:val') || null;
  const indNode = pPr?.getElementsByTagNameNS(W_NS, 'ind')?.[0];
  const indentLeft = indNode ? Number(indNode.getAttributeNS(W_NS, 'left') || indNode.getAttribute('w:left')) || 0 : 0;
  const indentFirstLine = indNode ? Number(indNode.getAttributeNS(W_NS, 'firstLine') || indNode.getAttribute('w:firstLine')) || 0 : 0;
  const indentHanging = indNode ? Number(indNode.getAttributeNS(W_NS, 'hanging') || indNode.getAttribute('w:hanging')) || 0 : 0;
  const spacingNode = pPr?.getElementsByTagNameNS(W_NS, 'spacing')?.[0];
  const lineSpacing = spacingNode ? Number(spacingNode.getAttributeNS(W_NS, 'line') || spacingNode.getAttribute('w:line')) || null : docDefaults?.lineSpacing ?? null;
  const spaceBefore = spacingNode ? Number(spacingNode.getAttributeNS(W_NS, 'before') || spacingNode.getAttribute('w:before')) || null : docDefaults?.spaceBefore ?? null;
  const spaceAfter = spacingNode ? Number(spacingNode.getAttributeNS(W_NS, 'after') || spacingNode.getAttribute('w:after')) || null : docDefaults?.spaceAfter ?? null;

  const hasTabNode = Boolean(pNode && pNode.getElementsByTagNameNS(W_NS, 'tab')?.length > 0);
  const pText = (pNode?.textContent || '').trim();
  const separator = hasTabNode ? 'tab' : (/^\d+(?:\.\d+)*\s+\S/.test(pText) ? 'space' : 'none');

  const rNode = pNode?.getElementsByTagNameNS(W_NS, 'r')?.[0];
  const rPr = rNode?.getElementsByTagNameNS(W_NS, 'rPr')?.[0] || pPr?.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
  const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
  const font = rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia') || rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || docDefaults?.font || null;
  const asciiFont = rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || font || docDefaults?.asciiFont || null;
  const szNode = rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0];
  const sz = szNode?.getAttributeNS(W_NS, 'val') || szNode?.getAttribute('w:val') || docDefaults?.sz || null;
  const bNodes = rPr?.getElementsByTagNameNS(W_NS, 'b');
  const bold = Boolean(bNodes && bNodes.length > 0 && bNodes[0].getAttributeNS(W_NS, 'val') !== '0' && bNodes[0].getAttribute('w:val') !== '0');
  const iNodes = rPr?.getElementsByTagNameNS(W_NS, 'i');
  const italic = Boolean(iNodes && iNodes.length > 0 && iNodes[0].getAttributeNS(W_NS, 'val') !== '0' && iNodes[0].getAttribute('w:val') !== '0');
  const colorNode = rPr?.getElementsByTagNameNS(W_NS, 'color')?.[0];
  const color = colorNode?.getAttributeNS(W_NS, 'val') || colorNode?.getAttribute('w:val') || null;

  return {
    rowHeightDxa,
    widthTwips,
    gridSpan,
    vMerge,
    vAlign,
    shadingFill,
    tcBorders,
    tcMar,
    align,
    indentLeft,
    indentFirstLine,
    indentHanging,
    lineSpacing,
    spaceBefore,
    spaceAfter,
    font,
    asciiFont,
    sz,
    bold,
    italic,
    color,
    separator
  };
}

/**
 * 纯结构/视觉特征推断单元格语义角色（支持 1 列、2 列 KV、4 列交错 KV、多列数据网格；不依赖任何内容词典或固定行号）
 */
export function inferCellSemanticRole(cellNode, rowIndex, cellIndex, totalRows, totalCols, _sectionNumber, styleProto = null, hasExternalTitle = false, isInterleavedKv = false) {
  if (rowIndex === 0 && !hasExternalTitle && (totalCols === 1 || styleProto?.gridSpan > 1 || (styleProto?.shadingFill && styleProto.shadingFill !== 'auto'))) {
    return 'SECTION_HEADER';
  }

  if (totalCols === 1) return 'EXPLANATION';

  // 2 列 KV 或 4 列交错 KV ([Label, Value, Label, Value])
  if (totalCols === 2 || isInterleavedKv) {
    if (cellIndex % 2 === 0) {
      const text = (cellNode.textContent || '').trim();
      const hasIndent = Number(styleProto?.indentLeft || 0) > 0 || Number(styleProto?.indentHanging || 0) > 0;
      const hasSep = styleProto?.separator === 'tab' || /[：:]$/.test(text);
      if (hasIndent || hasSep || /^\d+\.\d+/.test(text)) {
        return 'CHILD_LABEL';
      }
      return styleProto?.bold ? 'PARENT_LABEL' : 'CHILD_LABEL';
    }
    return 'VALUE';
  }

  if (totalCols >= 3) {
    if (styleProto?.bold || (styleProto?.shadingFill && styleProto.shadingFill !== 'auto')) {
      return 'TABLE_HEADER';
    }
    return 'DATA_ROW';
  }

  return 'VALUE';
}

/**
 * 从已提取的各角色样式原型聚合文档级 Typography Profile（完全基于模板众数，零硬编码兜底）
 */
export function extractTypographyProfileFromPrototypes(stylePrototypes, indentValues, docDefaults) {
  const sortedIndents = Array.from(indentValues || []).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  const roles = {};
  for (const [role, proto] of Object.entries(stylePrototypes || {})) {
    if (!proto) continue;
    roles[role] = {
      font: proto.font,
      asciiFont: proto.asciiFont,
      sz: proto.sz,
      bold: proto.bold,
      italic: proto.italic,
      color: proto.color,
      align: proto.align,
      indentDxa: proto.indentLeft,
      hangingDxa: proto.indentHanging,
      lineSpacing: proto.lineSpacing,
      separator: proto.separator
    };
  }

  const refProto = stylePrototypes?.VALUE || stylePrototypes?.CHILD_LABEL || stylePrototypes?.DATA_ROW || stylePrototypes?.EXPLANATION || null;
  const hdrProto = stylePrototypes?.SECTION_HEADER || stylePrototypes?.TABLE_HEADER || refProto;

  return {
    fontFamily: refProto?.font || docDefaults?.font || null,
    asciiFontFamily: refProto?.asciiFont || docDefaults?.asciiFont || null,
    valueFontSize: refProto?.sz || docDefaults?.sz || null,
    labelFontSize: stylePrototypes?.CHILD_LABEL?.sz || refProto?.sz || docDefaults?.sz || null,
    headerFontFamily: hdrProto?.font || docDefaults?.font || null,
    headerFontSize: hdrProto?.sz || docDefaults?.sz || null,
    tiers: sortedIndents,
    tabStops: sortedIndents.length > 0
      ? { tierA: sortedIndents[0], tierB: sortedIndents.find(v => v > sortedIndents[0]) || sortedIndents[0] }
      : { tierA: 0, tierB: 0 },
    roles
  };
}

/**
 * 保留旧签名兼容包装：从 DOM 直接提取 Typography Profile
 */
export function extractTypographyProfile(doc, docDefaults = null) {
  if (!doc) return null;
  const tblNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const roleSamples = {};
  const indentValues = new Set();

  for (const tbl of tblNodes) {
    const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    trs.forEach((tr, rIdx) => {
      const tcs = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      tcs.forEach((tc, cIdx) => {
        const proto = extractCellStylePrototype(tc, tr, docDefaults);
        if (proto?.indentLeft > 0) indentValues.add(proto.indentLeft);
        const role = inferCellSemanticRole(tc, rIdx, cIdx, trs.length, tcs.length, 1, proto, false);
        if (!roleSamples[role]) roleSamples[role] = [];
        roleSamples[role].push(proto);
      });
    });
  }

  const elected = {};
  for (const [role, samples] of Object.entries(roleSamples)) {
    elected[role] = electModeStylePrototype(samples, docDefaults);
  }
  return extractTypographyProfileFromPrototypes(elected, indentValues, docDefaults);
}

/**
 * 从 Word document DOM 识别通用页面格式几何参数 (Page Formatting)
 */
export function recognizePageFormatting(doc) {
  if (!doc) return null;
  const sectPrNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'sectPr'));
  if (sectPrNodes.length === 0) return null;
  const sectPr = sectPrNodes[sectPrNodes.length - 1];

  const pgSzNode = sectPr.getElementsByTagNameNS(W_NS, 'pgSz')?.[0];
  const widthDxa = Number(pgSzNode?.getAttributeNS(W_NS, 'w') || pgSzNode?.getAttribute('w:w')) || null;
  const heightDxa = Number(pgSzNode?.getAttributeNS(W_NS, 'h') || pgSzNode?.getAttribute('w:h')) || null;
  const orient = pgSzNode?.getAttributeNS(W_NS, 'orient') || pgSzNode?.getAttribute('w:orient') || 'portrait';

  const pgMarNode = sectPr.getElementsByTagNameNS(W_NS, 'pgMar')?.[0];
  const readMar = (attr) => {
    const v = Number(pgMarNode?.getAttributeNS(W_NS, attr) || pgMarNode?.getAttribute(`w:${attr}`));
    return Number.isFinite(v) ? v : null;
  };
  const topDxa = readMar('top');
  const bottomDxa = readMar('bottom');
  const leftDxa = readMar('left');
  const rightDxa = readMar('right');
  const headerDxa = readMar('header');
  const footerDxa = readMar('footer');
  const gutterDxa = readMar('gutter') ?? 0;

  const docGridNode = sectPr.getElementsByTagNameNS(W_NS, 'docGrid')?.[0];
  const linePitchDxa = Number(docGridNode?.getAttributeNS(W_NS, 'linePitch') || docGridNode?.getAttribute('w:linePitch')) || null;
  const charSpaceDxa = Number(docGridNode?.getAttributeNS(W_NS, 'charSpace') || docGridNode?.getAttribute('w:charSpace')) || 0;
  const gridType = docGridNode?.getAttributeNS(W_NS, 'type') || docGridNode?.getAttribute('w:type') || null;

  const colsNode = sectPr.getElementsByTagNameNS(W_NS, 'cols')?.[0];
  const colsNum = Number(colsNode?.getAttributeNS(W_NS, 'num') || colsNode?.getAttribute('w:num')) || 1;
  const colsSpaceDxa = Number(colsNode?.getAttributeNS(W_NS, 'space') || colsNode?.getAttribute('w:space')) || null;

  return {
    sectionBreaksCount: sectPrNodes.length,
    pageSize: {
      widthDxa,
      heightDxa,
      orientation: orient,
      widthMm: widthDxa ? Number((widthDxa / 56.7).toFixed(1)) : null,
      heightMm: heightDxa ? Number((heightDxa / 56.7).toFixed(1)) : null,
      widthPt: widthDxa ? Number((widthDxa / 20).toFixed(1)) : null,
      heightPt: heightDxa ? Number((heightDxa / 20).toFixed(1)) : null
    },
    margins: {
      topDxa,
      bottomDxa,
      leftDxa,
      rightDxa,
      headerDxa,
      footerDxa,
      gutterDxa
    },
    docGrid: { linePitchDxa, charSpaceDxa, type: gridType },
    cols: { num: colsNum, spaceDxa: colsSpaceDxa }
  };
}

function scanHeaderOrFooterPart(xmlText, partName, refType, kind, parser, docDefaults) {
  const fdoc = parser.parseFromString(xmlText, 'application/xml');
  const tblNodes = Array.from(fdoc.getElementsByTagNameNS(W_NS, 'tbl'));
  const slots = [];
  let containerType = 'NONE';
  let tableMetrics = null;

  const readParaStyle = (p) => {
    const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
    const jc = pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0]?.getAttributeNS(W_NS, 'val') || null;
    const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
    const fldSimples = Array.from(p.getElementsByTagNameNS(W_NS, 'fldSimple'));
    const instrTexts = runs.map(r => r.getElementsByTagNameNS(W_NS, 'instrText')?.[0]?.textContent || '').join(' ');
    const hasPageField = fldSimples.some(fs => /PAGE/i.test(fs.getAttributeNS(W_NS, 'instr') || '')) || /PAGE/i.test(instrTexts);
    let rStyle = { font: docDefaults?.font || null, asciiFont: docDefaults?.asciiFont || null, sz: docDefaults?.sz || null, bold: false, color: null };
    for (const r of runs) {
      const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
      if (!rPr) continue;
      const rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
      const szVal = rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val');
      const colorVal = rPr.getElementsByTagNameNS(W_NS, 'color')?.[0]?.getAttributeNS(W_NS, 'val');
      const bNode = rPr.getElementsByTagNameNS(W_NS, 'b')?.[0];
      rStyle = {
        font: rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia') || rStyle.font,
        asciiFont: rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || rStyle.asciiFont,
        sz: szVal || rStyle.sz,
        bold: Boolean(bNode && bNode.getAttributeNS(W_NS, 'val') !== '0'),
        color: colorVal || rStyle.color
      };
      break;
    }
    return { align: jc, hasPageField, style: rStyle };
  };

  if (tblNodes.length > 0) {
    containerType = 'table';
    const mainTbl = tblNodes[0];
    const trNodes = Array.from(mainTbl.getElementsByTagNameNS(W_NS, 'tr'));
    const tblW = mainTbl.getElementsByTagNameNS(W_NS, 'tblPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tblW')?.[0]?.getAttributeNS(W_NS, 'w');
    tableMetrics = {
      totalRows: trNodes.length,
      totalCols: trNodes[0] ? Array.from(trNodes[0].getElementsByTagNameNS(W_NS, 'tc')).length : 0,
      tableWidthDxa: tblW ? Number(tblW) : null
    };
    trNodes.forEach((tr, rIdx) => {
      const trH = tr.getElementsByTagNameNS(W_NS, 'trPr')?.[0]?.getElementsByTagNameNS(W_NS, 'trHeight')?.[0]?.getAttributeNS(W_NS, 'val');
      const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      tcNodes.forEach((tc, cIdx) => {
        const tcPr = tc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
        const tcW = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttributeNS(W_NS, 'w');
        const vAlign = tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0]?.getAttributeNS(W_NS, 'val') || null;
        const ps = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
        ps.forEach((p, pIdx) => {
          const pMeta = readParaStyle(p);
          slots.push({
            slotId: `${kind}_r${rIdx}_c${cIdx}_p${pIdx}`,
            kind,
            container: 'table',
            tableIndex: 0,
            rowIndex: rIdx,
            cellIndex: cIdx,
            paragraphIndex: pIdx,
            widthDxa: tcW ? Number(tcW) : null,
            rowHeightDxa: trH ? Number(trH) : null,
            vAlign,
            slotRole: pMeta.hasPageField ? 'PAGE_NUMBER_FIELD' : 'TEXT_SLOT',
            ...pMeta
          });
        });
      });
    });
  } else {
    const rootPs = Array.from(fdoc.getElementsByTagNameNS(W_NS, 'p'));
    if (rootPs.length > 0) {
      containerType = 'paragraph';
      rootPs.forEach((p, pIdx) => {
        const pMeta = readParaStyle(p);
        slots.push({
          slotId: `${kind}_p${pIdx}`,
          kind,
          container: 'paragraph',
          paragraphIndex: pIdx,
          slotRole: pMeta.hasPageField ? 'PAGE_NUMBER_FIELD' : 'TEXT_SLOT',
          ...pMeta
        });
      });
    }
  }

  return { found: true, kind, partName, refType, containerType, tableMetrics, slots };
}

/**
 * 纯结构化识别母版所有页眉与页脚物理插槽（零业务关键词与内容文本泄漏）
 */
export async function recognizeHeaderFooterTopology(zip, doc, parser = new DOMParser(), docDefaults = null) {
  const empty = { headers: [], footers: [], found: false, containerType: 'NONE', slots: [] };
  if (!zip || !doc) return empty;

  const relsMap = {};
  if (zip.file('word/_rels/document.xml.rels')) {
    try {
      const relsXml = await zip.file('word/_rels/document.xml.rels').async('text');
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      for (const r of Array.from(relsDoc.getElementsByTagName('Relationship'))) {
        relsMap[r.getAttribute('Id')] = { type: r.getAttribute('Type'), target: r.getAttribute('Target') };
      }
    } catch {}
  }

  const sectPrNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'sectPr'));
  const sectPr = sectPrNodes[sectPrNodes.length - 1];
  const collectParts = (refTag, kind, fallbackRe) => {
    const refs = sectPr ? Array.from(sectPr.getElementsByTagNameNS(W_NS, refTag)) : [];
    const seen = new Set();
    const out = [];
    for (const ref of refs) {
      const rId = ref.getAttributeNS(R_NS, 'id') || ref.getAttribute('r:id');
      const refType = ref.getAttributeNS(W_NS, 'type') || ref.getAttribute('w:type') || 'default';
      const target = relsMap[rId]?.target;
      const partName = target ? (target.startsWith('word/') ? target : `word/${target}`) : null;
      if (partName && zip.file(partName) && !seen.has(partName)) {
        seen.add(partName);
        out.push({ partName, refType, kind });
      }
    }
    if (out.length === 0) {
      Object.keys(zip.files)
        .filter(k => fallbackRe.test(k))
        .sort()
        .forEach(partName => out.push({ partName, refType: 'default', kind }));
    }
    return out;
  };

  const headers = [];
  for (const h of collectParts('headerReference', 'header', /^word\/header\d+\.xml$/)) {
    const xml = await zip.file(h.partName).async('text');
    headers.push(scanHeaderOrFooterPart(xml, h.partName, h.refType, 'header', parser, docDefaults));
  }
  const footers = [];
  for (const f of collectParts('footerReference', 'footer', /^word\/footer\d+\.xml$/)) {
    const xml = await zip.file(f.partName).async('text');
    footers.push(scanHeaderOrFooterPart(xml, f.partName, f.refType, 'footer', parser, docDefaults));
  }

  const primaryFooter = footers[0] || null;
  return {
    found: headers.length > 0 || footers.length > 0,
    headers,
    footers,
    partName: primaryFooter?.partName || null,
    containerType: primaryFooter?.containerType || 'NONE',
    tableMetrics: primaryFooter?.tableMetrics || null,
    slots: primaryFooter?.slots || []
  };
}

/**
 * 兼容旧函数名 export
 */
export async function recognizeFooterTopology(zip, doc, parser = new DOMParser()) {
  return recognizeHeaderFooterTopology(zip, doc, parser, null);
}

/**
 * 正文流混合切分：同时兼容“表内首行标题”、“表外段落标题+紧随表格”与“一节多表”
 */
function discoverBodySections(doc) {
  const body = doc.getElementsByTagNameNS(W_NS, 'body')?.[0];
  if (!body) return [];

  const children = Array.from(body.childNodes).filter(
    n => n.nodeType === 1 && n.namespaceURI === W_NS && (n.localName === 'p' || n.localName === 'tbl')
  );

  const isHeadingParagraph = (pNode) => {
    const text = (pNode.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return false;
    const pPr = pNode.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
    const pStyle = pPr?.getElementsByTagNameNS(W_NS, 'pStyle')?.[0]?.getAttributeNS(W_NS, 'val') || '';
    const hasHeadingStyle = /heading|标题/i.test(pStyle);
    const hasSeqHeading = /^\s*(?:第\s*\d+\s*部分|Section\s*\d+\b|\d+\s*[.、:：\s]|[IVX]+\s*\.)/i.test(text);
    const firstRunBold = Boolean(pNode.getElementsByTagNameNS(W_NS, 'r')?.[0]?.getElementsByTagNameNS(W_NS, 'rPr')?.[0]?.getElementsByTagNameNS(W_NS, 'b')?.length);
    return hasHeadingStyle || (hasSeqHeading && (firstRunBold || text.length <= 80));
  };

  const groups = [];
  let pendingHeading = null;
  let globalTblIdx = 0;

  for (const node of children) {
    if (node.localName === 'p') {
      if (isHeadingParagraph(node)) {
        pendingHeading = {
          text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
          node
        };
      }
      continue;
    }

    if (node.localName === 'tbl') {
      const trs = Array.from(node.getElementsByTagNameNS(W_NS, 'tr'));
      if (trs.length === 0) {
        globalTblIdx++;
        continue;
      }

      if (pendingHeading) {
        groups.push({
          externalHeading: pendingHeading.text,
          hasExternalTitle: true,
          tables: [{ tblNode: node, tableIndex: globalTblIdx }]
        });
        pendingHeading = null;
      } else {
        groups.push({
          externalHeading: null,
          hasExternalTitle: false,
          tables: [{ tblNode: node, tableIndex: globalTblIdx }]
        });
      }
      globalTblIdx++;
    }
  }

  return groups;
}

/**
 * 动态识别 DOCX 母版结构与样式拓扑蓝图（零用户数据硬编码）
 */
export async function recognizeTemplateTopology(templateSource, options = {}) {
  let docxBuffer = null;
  let templateKey = options.templateKey || 'CUSTOM_TEMPLATE';

  if (Buffer.isBuffer(templateSource)) {
    docxBuffer = templateSource;
  } else if (typeof templateSource === 'string') {
    const candidates = [
      path.resolve(templateSource),
      path.resolve(REPO_ROOT, templateSource),
      path.resolve(REPO_ROOT, 'web/public/templates', templateSource),
      path.resolve(REPO_ROOT, 'web/public/templates', `${templateSource}.docx`)
    ];
    const resolvedPath = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!resolvedPath) {
      throw new Error(`[TEMPLATE-RECOGNIZER FATAL] 找不到指定的母版文件: ${templateSource}`);
    }
    docxBuffer = fs.readFileSync(resolvedPath);
    if (!options.templateKey) {
      templateKey = path.basename(resolvedPath, '.docx');
    }
  } else {
    throw new Error('[TEMPLATE-RECOGNIZER FATAL] 非法的母版输入源，必须为 Buffer 或路径字符串！');
  }

  const zip = await JSZip.loadAsync(docxBuffer);
  const parser = new DOMParser();

  const docDefaults = await extractDocumentStyleDefaults(zip, parser);
  const docXmlText = await zip.file('word/document.xml').async('text');
  const doc = parser.parseFromString(docXmlText, 'application/xml');

  const pageFormat = recognizePageFormatting(doc);
  const headerFooterTopology = await recognizeHeaderFooterTopology(zip, doc, parser, docDefaults);

  const sectionGroups = discoverBodySections(doc);
  const sectionsTopology = [];
  const globalRoleSamples = {};
  const indentValues = new Set();
  const diagnostics = [];

  const extractSectionNumber = (titleText, fallbackNum) => {
    const m = String(titleText || '').trim().match(/^\s*(?:第\s*(\d+)\s*部分|Section\s*(\d+)\b|(\d+)\s*[.、:：\s])/i);
    const num = m ? Number(m[1] || m[2] || m[3]) : NaN;
    return Number.isFinite(num) && num > 0 ? num : fallbackNum;
  };

  sectionGroups.forEach((group, groupIdx) => {
    const primaryTbl = group.tables[0].tblNode;
    const primaryTblIdx = group.tables[0].tableIndex;
    const trNodes = Array.from(primaryTbl.getElementsByTagNameNS(W_NS, 'tr'));

    const titleText = group.externalHeading || (trNodes[0]?.textContent || '').replace(/\s+/g, ' ').trim();
    const sNum = extractSectionNumber(titleText, groupIdx + 1);
    const rowsTopology = [];
    const slots = [];
    const secRoleSamples = {};

    const tblPr = primaryTbl.getElementsByTagNameNS(W_NS, 'tblPr')?.[0];
    const borderConfig = readBordersBlock(tblPr?.getElementsByTagNameNS(W_NS, 'tblBorders')?.[0]);
    const cellMargins = readMarginsBlock(tblPr?.getElementsByTagNameNS(W_NS, 'tblCellMar')?.[0]);
    const tblGridNode = primaryTbl.getElementsByTagNameNS(W_NS, 'tblGrid')?.[0];
    const tableGridWidths = tblGridNode
      ? Array.from(tblGridNode.getElementsByTagNameNS(W_NS, 'gridCol')).map(gc => Number(gc.getAttributeNS(W_NS, 'w') || gc.getAttribute('w:w')) || null)
      : [];

    trNodes.forEach((tr, rIdx) => {
      const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      const cellsInRow = [];
      const rowProtos = tcNodes.map(tc => extractCellStylePrototype(tc, tr, docDefaults));
      const isInterleavedKv = tcNodes.length === 4 && (group.hasExternalTitle || rIdx > 0) &&
        Boolean(rowProtos[0]?.bold) && Boolean(rowProtos[2]?.bold) && !rowProtos[1]?.bold;

      tcNodes.forEach((tc, cIdx) => {
        const styleProto = rowProtos[cIdx];
        if (styleProto?.indentLeft > 0) indentValues.add(styleProto.indentLeft);

        const role = inferCellSemanticRole(tc, rIdx, cIdx, trNodes.length, tcNodes.length, sNum, styleProto, group.hasExternalTitle, isInterleavedKv);
        if (role && styleProto) {
          if (!globalRoleSamples[role]) globalRoleSamples[role] = [];
          globalRoleSamples[role].push(styleProto);
          if (!secRoleSamples[role]) secRoleSamples[role] = [];
          secRoleSamples[role].push(styleProto);
        }

        const slot = {
          slotKey: buildStructuralSlotKey(sNum, rIdx, cIdx),
          sectionNumber: sNum,
          rowIndex: rIdx,
          cellIndex: cIdx,
          gridSpan: styleProto?.gridSpan || 1,
          widthTwips: styleProto?.widthTwips || null,
          role,
          styleProto,
          isEditable: role === 'VALUE' || role === 'DATA_ROW' || (role === 'EXPLANATION' && (group.hasExternalTitle || rIdx > 0))
        };

        cellsInRow.push(slot);
        slots.push(slot);
      });

      rowsTopology.push({
        rowIndex: rIdx,
        cellsCount: tcNodes.length,
        cells: cellsInRow
      });
    });

    const bodyRows = group.hasExternalTitle ? rowsTopology : rowsTopology.slice(1);
    const hasMultiCol = bodyRows.some(r => r.cellsCount >= 3);
    const hasTwoCol = bodyRows.some(r => r.cellsCount === 2);
    const hasFullWidth = bodyRows.some(r => r.cellsCount === 1);

    let layoutType = 'KV_TWO_COL';
    if (bodyRows.length > 0 && bodyRows.every(r => r.cellsCount === 1)) {
      layoutType = 'FULL_WIDTH_OUTLINE';
    } else if (hasMultiCol) {
      layoutType = 'MULTI_COL_GRID';
    } else if (hasTwoCol && hasFullWidth) {
      layoutType = 'HYBRID';
    }

    const sectionStylePrototypes = {};
    for (const [role, samples] of Object.entries(secRoleSamples)) {
      sectionStylePrototypes[role] = electModeStylePrototype(samples, docDefaults);
    }

    const kvCloneRow = bodyRows.find(r => r.cellsCount === 2);
    const dataCloneRow = bodyRows.find(r => r.cellsCount >= 3 && r.cells.every(c => c.role === 'DATA_ROW')) || bodyRows.find(r => r.cellsCount >= 3);

    sectionsTopology.push({
      sectionNumber: sNum,
      sectionKey: `section_${sNum}`,
      sectionTitle: titleText,
      hasExternalTitle: group.hasExternalTitle,
      found: true,
      tableIndex: primaryTblIdx,
      tablesCount: group.tables.length,
      layoutType,
      capabilities: {
        isFullWidthOutline: layoutType === 'FULL_WIDTH_OUTLINE',
        hasMultiColGrid: hasMultiCol,
        hasTwoColKv: hasTwoCol,
        hasFullWidthRows: hasFullWidth
      },
      rowsCount: trNodes.length,
      columnWidths: tableGridWidths.length > 0 ? tableGridWidths : (bodyRows[0]?.cells.map(c => c.widthTwips).filter(Boolean) || []),
      borders: borderConfig,
      cellMargins,
      rowTemplates: {
        kvCloneRowIndex: kvCloneRow ? kvCloneRow.rowIndex : null,
        dataCloneRowIndex: dataCloneRow ? dataCloneRow.rowIndex : null,
        headerRowCount: group.hasExternalTitle ? 0 : 1
      },
      stylePrototypes: sectionStylePrototypes,
      slots,
      rows: rowsTopology
    });
  });

  if (sectionsTopology.length === 0) {
    diagnostics.push({ level: 'WARNING', code: 'NO_TABLE_SECTIONS', message: '未在文档正文发现任何表格章节' });
  }

  // 对每一类语义角色执行众数选举，生成模板全局标准样式原型
  const stylePrototypes = {};
  for (const [role, samples] of Object.entries(globalRoleSamples)) {
    stylePrototypes[role] = electModeStylePrototype(samples, docDefaults);
  }
  const typographyProfile = extractTypographyProfileFromPrototypes(stylePrototypes, indentValues, docDefaults);

  return {
    templateKey,
    recognizedAt: new Date().toISOString(),
    isTopologyDynamic: true,
    docDefaults,
    pageFormat,
    typographyProfile,
    stylePrototypes,
    headerFooterTopology,
    footerTopology: headerFooterTopology,
    sectionsCount: sectionsTopology.length,
    sections: sectionsTopology,
    diagnostics
  };
}

/**
 * 构建面向结构化编辑器的 StandardTopology / TemplateProfile 契约
 */
export function buildTemplateProfile(blueprint) {
  if (!blueprint) return null;
  return {
    schemaVersion: '2.0.0',
    templateKey: blueprint.templateKey,
    recognizedAt: blueprint.recognizedAt,
    sectionsCount: blueprint.sectionsCount,
    docDefaults: blueprint.docDefaults || null,
    pageFormat: blueprint.pageFormat,
    typographyProfile: blueprint.typographyProfile || null,
    stylePrototypes: blueprint.stylePrototypes || {},
    headerFooterTopology: blueprint.headerFooterTopology || blueprint.footerTopology || null,
    footerTopology: blueprint.footerTopology || null,
    diagnostics: blueprint.diagnostics || [],
    sections: (blueprint.sections || []).map(sec => ({
      sectionNumber: sec.sectionNumber,
      sectionKey: sec.sectionKey || `section_${sec.sectionNumber}`,
      sectionTitle: sec.sectionTitle,
      hasExternalTitle: Boolean(sec.hasExternalTitle),
      layoutType: sec.layoutType,
      capabilities: sec.capabilities || {},
      rowsCount: sec.rowsCount,
      columnWidths: sec.columnWidths || [],
      borders: sec.borders || null,
      cellMargins: sec.cellMargins || null,
      rowTemplates: sec.rowTemplates || null,
      stylePrototypes: sec.stylePrototypes || {}
    }))
  };
}
