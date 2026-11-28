/**
 * MSDS-Engine: 全维度纯结构与样式拓扑识别及构建层 (Template Topology Recognizer & Constructor)
 *
 * 覆盖 9 大层面全部纯结构/样式/媒体/约束事实（零用户业务数据）：
 * 1. OPC/Theme/Styles/Settings/Numbering 继承基准
 * 2. 多节 PageFormat (sectPr[], titlePg, pgNumType, pgBorders)
 * 3. Header/Footer 全插槽 (tabs, pBdr, drawings/media, fldChar)
 * 4. 正文流 (preambleBlocks, trailingBlocks, 分页/空行, 多表聚合, 单表分节, 纯段落节)
 * 5. 表格级 (tblW/type, jc, tblInd, tblStyle, tblLayout, tblGrid, tblBorders, tblCellMar)
 * 6. 行与单元格级 (hRule, cantSplit, tblHeader, vMergeGroups, textDirection, noWrap, tcBorders, tcMar)
 * 7. 段落与列表级 (tabs[], lineRule, pBdr, keepNext/keepLines, numPr, 多段 outlineLevels[])
 * 8. 文本与富文本级 (rFonts 4槽, szCs/bCs/iCs, u/strike/vertAlign/highlight/caps, hasMixedRuns)
 * 9. 编辑约束与自检 (rowTemplates, lockedRowIndices, lineBreakMode, verifyTopologyCompleteness)
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
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';

export function buildStructuralSlotKey(sectionNumber, rowIndex, cellIndex) {
  return `sec${sectionNumber}_r${rowIndex}_c${cellIndex}`;
}

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

export function electModeStylePrototype(samples, docDefaults = null) {
  const valid = (samples || []).filter(Boolean);
  if (valid.length === 0) return null;
  const pick = (prop, fallback = null) => electModeValue(valid.map(s => s[prop]), fallback);
  return {
    rowHeightDxa: pick('rowHeightDxa', null),
    hRule: pick('hRule', null),
    cantSplit: pick('cantSplit', false),
    tblHeader: pick('tblHeader', false),
    widthTwips: pick('widthTwips', null),
    widthType: pick('widthType', null),
    vAlign: pick('vAlign', null),
    textDirection: pick('textDirection', null),
    noWrap: pick('noWrap', false),
    shadingFill: pick('shadingFill', null),
    tcBorders: pick('tcBorders', null),
    tcMar: pick('tcMar', null),
    align: pick('align', null),
    indentLeft: pick('indentLeft', 0),
    indentFirstLine: pick('indentFirstLine', 0),
    indentHanging: pick('indentHanging', 0),
    tabs: pick('tabs', []),
    lineSpacing: pick('lineSpacing', docDefaults?.lineSpacing ?? null),
    lineRule: pick('lineRule', docDefaults?.lineRule ?? null),
    spaceBefore: pick('spaceBefore', docDefaults?.spaceBefore ?? null),
    spaceAfter: pick('spaceAfter', docDefaults?.spaceAfter ?? null),
    keepNext: pick('keepNext', false),
    keepLines: pick('keepLines', false),
    pBdr: pick('pBdr', null),
    numPr: pick('numPr', null),
    font: pick('font', docDefaults?.font ?? null),
    asciiFont: pick('asciiFont', docDefaults?.asciiFont ?? null),
    hAnsiFont: pick('hAnsiFont', docDefaults?.hAnsiFont ?? null),
    csFont: pick('csFont', docDefaults?.csFont ?? null),
    sz: pick('sz', docDefaults?.sz ?? null),
    szCs: pick('szCs', docDefaults?.szCs ?? null),
    bold: pick('bold', false),
    bCs: pick('bCs', false),
    italic: pick('italic', false),
    iCs: pick('iCs', false),
    u: pick('u', null),
    strike: pick('strike', false),
    vertAlign: pick('vertAlign', null),
    color: pick('color', null),
    highlight: pick('highlight', null),
    charSpacing: pick('charSpacing', null),
    hasMixedRuns: pick('hasMixedRuns', false),
    lineBreakMode: pick('lineBreakMode', 'single'),
    separator: pick('separator', 'none')
  };
}

function getAttr(node, localName) {
  if (!node) return null;
  return node.getAttributeNS(W_NS, localName) || node.getAttribute(`w:${localName}`) || node.getAttribute(localName) || null;
}

function readBorderNode(borderNode) {
  if (!borderNode) return null;
  const val = getAttr(borderNode, 'val');
  if (!val) return null;
  return {
    val,
    sz: Number(getAttr(borderNode, 'sz')) || null,
    color: getAttr(borderNode, 'color')
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
    const w = n ? Number(getAttr(n, 'w')) : NaN;
    return Number.isFinite(w) ? w : null;
  };
  return { top: side('top'), bottom: side('bottom'), left: side('left'), right: side('right') };
}

function readTabs(pPrNode) {
  const tabsNode = pPrNode?.getElementsByTagNameNS(W_NS, 'tabs')?.[0];
  if (!tabsNode) return [];
  return Array.from(tabsNode.getElementsByTagNameNS(W_NS, 'tab')).map(t => ({
    val: getAttr(t, 'val') || 'left',
    pos: Number(getAttr(t, 'pos')) || 0,
    leader: getAttr(t, 'leader') || null
  }));
}

function readRelsMap(zip, relsPath, parser) {
  const map = {};
  const f = zip?.file(relsPath);
  if (!f) return map;
  return f.async('text').then(xml => {
    const rDoc = parser.parseFromString(xml, 'application/xml');
    for (const r of Array.from(rDoc.getElementsByTagName('Relationship'))) {
      map[r.getAttribute('Id')] = { type: r.getAttribute('Type'), target: r.getAttribute('Target') };
    }
    return map;
  }).catch(() => map);
}

/**
 * Layer 1: 提取 theme1.xml、styles.xml (docDefaults + basedOn 继承 + tblStylePr)、settings.xml、numbering.xml
 */
export async function extractDocumentStyleDefaults(zip, parser = new DOMParser()) {
  const defaults = {
    font: null,
    asciiFont: null,
    hAnsiFont: null,
    csFont: null,
    sz: null,
    szCs: null,
    lineSpacing: null,
    lineRule: null,
    spaceBefore: null,
    spaceAfter: null,
    theme: { majorFont: null, minorFont: null, colors: {} },
    settings: { evenAndOddHeaders: false, defaultTabStopDxa: null, characterSpacingControl: null },
    numbering: {},
    stylesMap: {},
    tableStylesMap: {}
  };

  // 1.1 word/theme/theme1.xml
  const themeFile = zip?.file('word/theme/theme1.xml');
  if (themeFile) {
    try {
      const tXml = await themeFile.async('text');
      const tDoc = parser.parseFromString(tXml, 'application/xml');
      const major = tDoc.getElementsByTagNameNS(A_NS, 'majorFont')?.[0]?.getElementsByTagNameNS(A_NS, 'latin')?.[0]?.getAttribute('typeface') || null;
      const minor = tDoc.getElementsByTagNameNS(A_NS, 'minorFont')?.[0]?.getElementsByTagNameNS(A_NS, 'latin')?.[0]?.getAttribute('typeface') || null;
      defaults.theme.majorFont = major;
      defaults.theme.minorFont = minor;
      const clrScheme = tDoc.getElementsByTagNameNS(A_NS, 'clrScheme')?.[0];
      if (clrScheme) {
        for (const child of Array.from(clrScheme.childNodes).filter(n => n.nodeType === 1)) {
          const srgb = child.getElementsByTagNameNS(A_NS, 'srgbClr')?.[0]?.getAttribute('val');
          const sysClr = child.getElementsByTagNameNS(A_NS, 'sysClr')?.[0]?.getAttribute('lastClr');
          if (srgb || sysClr) defaults.theme.colors[child.localName] = srgb || sysClr;
        }
      }
    } catch {}
  }

  // 1.2 word/settings.xml
  const settingsFile = zip?.file('word/settings.xml');
  if (settingsFile) {
    try {
      const stXml = await settingsFile.async('text');
      const stDoc = parser.parseFromString(stXml, 'application/xml');
      defaults.settings.evenAndOddHeaders = stDoc.getElementsByTagNameNS(W_NS, 'evenAndOddHeaders').length > 0;
      const defTab = stDoc.getElementsByTagNameNS(W_NS, 'defaultTabStop')?.[0];
      if (defTab) defaults.settings.defaultTabStopDxa = Number(getAttr(defTab, 'val')) || null;
      const charSp = stDoc.getElementsByTagNameNS(W_NS, 'characterSpacingControl')?.[0];
      if (charSp) defaults.settings.characterSpacingControl = getAttr(charSp, 'val');
    } catch {}
  }

  // 1.3 word/numbering.xml
  const numFile = zip?.file('word/numbering.xml');
  if (numFile) {
    try {
      const nXml = await numFile.async('text');
      const nDoc = parser.parseFromString(nXml, 'application/xml');
      const abstractMap = {};
      for (const ab of Array.from(nDoc.getElementsByTagNameNS(W_NS, 'abstractNum'))) {
        const abId = getAttr(ab, 'abstractNumId');
        const lvls = {};
        for (const lvl of Array.from(ab.getElementsByTagNameNS(W_NS, 'lvl'))) {
          const ilvl = getAttr(lvl, 'ilvl') || '0';
          const ind = lvl.getElementsByTagNameNS(W_NS, 'pPr')?.[0]?.getElementsByTagNameNS(W_NS, 'ind')?.[0];
          lvls[ilvl] = {
            numFmt: getAttr(lvl.getElementsByTagNameNS(W_NS, 'numFmt')?.[0], 'val'),
            lvlText: getAttr(lvl.getElementsByTagNameNS(W_NS, 'lvlText')?.[0], 'val'),
            indentLeft: ind ? Number(getAttr(ind, 'left')) || 0 : 0,
            indentHanging: ind ? Number(getAttr(ind, 'hanging')) || 0 : 0
          };
        }
        if (abId) abstractMap[abId] = lvls;
      }
      for (const num of Array.from(nDoc.getElementsByTagNameNS(W_NS, 'num'))) {
        const numId = getAttr(num, 'numId');
        const abRef = getAttr(num.getElementsByTagNameNS(W_NS, 'abstractNumId')?.[0], 'val');
        if (numId && abRef && abstractMap[abRef]) {
          defaults.numbering[numId] = abstractMap[abRef];
        }
      }
    } catch {}
  }

  // 1.4 word/styles.xml (docDefaults + basedOn 继承 + tblStylePr)
  const stylesFile = zip?.file('word/styles.xml');
  if (stylesFile) {
    try {
      const xml = await stylesFile.async('text');
      const sDoc = parser.parseFromString(xml, 'application/xml');
      const docDefaults = sDoc.getElementsByTagNameNS(W_NS, 'docDefaults')?.[0];
      if (docDefaults) {
        const rPr = docDefaults.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
        if (rPr) {
          const rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
          defaults.font = getAttr(rFonts, 'eastAsia') || getAttr(rFonts, 'ascii') || null;
          defaults.asciiFont = getAttr(rFonts, 'ascii') || defaults.font;
          defaults.hAnsiFont = getAttr(rFonts, 'hAnsi') || defaults.asciiFont;
          defaults.csFont = getAttr(rFonts, 'cs') || defaults.asciiFont;
          defaults.sz = getAttr(rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0], 'val');
          defaults.szCs = getAttr(rPr.getElementsByTagNameNS(W_NS, 'szCs')?.[0], 'val');
        }
        const pPr = docDefaults.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
        if (pPr) {
          const spacing = pPr.getElementsByTagNameNS(W_NS, 'spacing')?.[0];
          if (spacing) {
            const line = Number(getAttr(spacing, 'line'));
            const before = Number(getAttr(spacing, 'before'));
            const after = Number(getAttr(spacing, 'after'));
            if (Number.isFinite(line) && line > 0) defaults.lineSpacing = line;
            defaults.lineRule = getAttr(spacing, 'lineRule');
            if (Number.isFinite(before) && before >= 0) defaults.spaceBefore = before;
            if (Number.isFinite(after) && after >= 0) defaults.spaceAfter = after;
          }
        }
      }

      const rawStyles = {};
      for (const stNode of Array.from(sDoc.getElementsByTagNameNS(W_NS, 'style'))) {
        const styleId = getAttr(stNode, 'styleId');
        const styleType = getAttr(stNode, 'type');
        if (!styleId) continue;
        const basedOn = getAttr(stNode.getElementsByTagNameNS(W_NS, 'basedOn')?.[0], 'val');
        const rPr = stNode.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
        const pPr = stNode.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
        const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
        rawStyles[styleId] = {
          styleId,
          styleType,
          basedOn,
          font: getAttr(rFonts, 'eastAsia') || getAttr(rFonts, 'ascii'),
          asciiFont: getAttr(rFonts, 'ascii'),
          hAnsiFont: getAttr(rFonts, 'hAnsi'),
          csFont: getAttr(rFonts, 'cs'),
          sz: getAttr(rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0], 'val'),
          szCs: getAttr(rPr?.getElementsByTagNameNS(W_NS, 'szCs')?.[0], 'val'),
          align: getAttr(pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0], 'val')
        };

        if (styleType === 'table') {
          const tblBorders = readBordersBlock(stNode.getElementsByTagNameNS(W_NS, 'tblBorders')?.[0]);
          const tblStylePrs = {};
          for (const tsp of Array.from(stNode.getElementsByTagNameNS(W_NS, 'tblStylePr'))) {
            const cond = getAttr(tsp, 'type');
            const shd = getAttr(tsp.getElementsByTagNameNS(W_NS, 'shd')?.[0], 'fill');
            if (cond) tblStylePrs[cond] = { shadingFill: shd };
          }
          defaults.tableStylesMap[styleId] = { basedOn, tblBorders, conditionalFormats: tblStylePrs };
        }
      }

      // 解析 basedOn 多级继承链
      const resolveChain = (id, visited = new Set()) => {
        const s = rawStyles[id];
        if (!s || visited.has(id)) return {};
        visited.add(id);
        const parent = s.basedOn ? resolveChain(s.basedOn, visited) : {};
        return {
          font: s.font || parent.font || null,
          asciiFont: s.asciiFont || parent.asciiFont || null,
          hAnsiFont: s.hAnsiFont || parent.hAnsiFont || null,
          csFont: s.csFont || parent.csFont || null,
          sz: s.sz || parent.sz || null,
          szCs: s.szCs || parent.szCs || null,
          align: s.align || parent.align || null
        };
      };
      for (const id of Object.keys(rawStyles)) {
        defaults.stylesMap[id] = resolveChain(id);
      }
    } catch {}
  }

  return defaults;
}

function extractParagraphStyle(pNode, docDefaults) {
  const pPr = pNode?.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
  const pStyleId = getAttr(pPr?.getElementsByTagNameNS(W_NS, 'pStyle')?.[0], 'val');
  const namedStyle = pStyleId ? docDefaults?.stylesMap?.[pStyleId] : null;
  const align = getAttr(pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0], 'val') || namedStyle?.align || null;
  const indNode = pPr?.getElementsByTagNameNS(W_NS, 'ind')?.[0];
  const indentLeft = indNode ? Number(getAttr(indNode, 'left')) || 0 : 0;
  const indentFirstLine = indNode ? Number(getAttr(indNode, 'firstLine')) || 0 : 0;
  const indentHanging = indNode ? Number(getAttr(indNode, 'hanging')) || 0 : 0;
  const tabs = readTabs(pPr);

  const spacingNode = pPr?.getElementsByTagNameNS(W_NS, 'spacing')?.[0];
  const lineSpacing = spacingNode ? Number(getAttr(spacingNode, 'line')) || null : docDefaults?.lineSpacing ?? null;
  const lineRule = getAttr(spacingNode, 'lineRule') || docDefaults?.lineRule || null;
  const spaceBefore = spacingNode ? Number(getAttr(spacingNode, 'before')) || null : docDefaults?.spaceBefore ?? null;
  const spaceAfter = spacingNode ? Number(getAttr(spacingNode, 'after')) || null : docDefaults?.spaceAfter ?? null;

  const keepNext = Boolean(pPr?.getElementsByTagNameNS(W_NS, 'keepNext')?.length);
  const keepLines = Boolean(pPr?.getElementsByTagNameNS(W_NS, 'keepLines')?.length);
  const pBdr = readBordersBlock(pPr?.getElementsByTagNameNS(W_NS, 'pBdr')?.[0]);
  const numPrNode = pPr?.getElementsByTagNameNS(W_NS, 'numPr')?.[0];
  const numPr = numPrNode
    ? { numId: getAttr(numPrNode.getElementsByTagNameNS(W_NS, 'numId')?.[0], 'val'), ilvl: getAttr(numPrNode.getElementsByTagNameNS(W_NS, 'ilvl')?.[0], 'val') || '0' }
    : null;

  const runs = pNode ? Array.from(pNode.getElementsByTagNameNS(W_NS, 'r')) : [];
  const hasTabNode = Boolean(pNode && pNode.getElementsByTagNameNS(W_NS, 'tab')?.length > 0);
  const pText = (pNode?.textContent || '').trim();
  const separator = hasTabNode ? 'tab' : (/^\d+(?:\.\d+)*\s+\S/.test(pText) ? 'space' : 'none');

  const extractRunProps = (rPr) => {
    if (!rPr) return null;
    const rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
    const eastAsia = getAttr(rFonts, 'eastAsia') || getAttr(rFonts, 'ascii') || namedStyle?.font || docDefaults?.font || null;
    const ascii = getAttr(rFonts, 'ascii') || eastAsia || namedStyle?.asciiFont || docDefaults?.asciiFont || null;
    const hAnsi = getAttr(rFonts, 'hAnsi') || ascii || namedStyle?.hAnsiFont || docDefaults?.hAnsiFont || null;
    const cs = getAttr(rFonts, 'cs') || ascii || namedStyle?.csFont || docDefaults?.csFont || null;
    const sz = getAttr(rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0], 'val') || namedStyle?.sz || docDefaults?.sz || null;
    const szCs = getAttr(rPr.getElementsByTagNameNS(W_NS, 'szCs')?.[0], 'val') || namedStyle?.szCs || docDefaults?.szCs || null;
    const bNode = rPr.getElementsByTagNameNS(W_NS, 'b')?.[0];
    const bold = Boolean(bNode && getAttr(bNode, 'val') !== '0');
    const bCsNode = rPr.getElementsByTagNameNS(W_NS, 'bCs')?.[0];
    const bCs = Boolean(bCsNode && getAttr(bCsNode, 'val') !== '0');
    const iNode = rPr.getElementsByTagNameNS(W_NS, 'i')?.[0];
    const italic = Boolean(iNode && getAttr(iNode, 'val') !== '0');
    const iCsNode = rPr.getElementsByTagNameNS(W_NS, 'iCs')?.[0];
    const iCs = Boolean(iCsNode && getAttr(iCsNode, 'val') !== '0');
    const u = getAttr(rPr.getElementsByTagNameNS(W_NS, 'u')?.[0], 'val');
    const strike = Boolean(rPr.getElementsByTagNameNS(W_NS, 'strike')?.length);
    const vertAlign = getAttr(rPr.getElementsByTagNameNS(W_NS, 'vertAlign')?.[0], 'val');
    const color = getAttr(rPr.getElementsByTagNameNS(W_NS, 'color')?.[0], 'val');
    const highlight = getAttr(rPr.getElementsByTagNameNS(W_NS, 'highlight')?.[0], 'val');
    const charSpacing = Number(getAttr(rPr.getElementsByTagNameNS(W_NS, 'spacing')?.[0], 'val')) || null;
    return { font: eastAsia, asciiFont: ascii, hAnsiFont: hAnsi, csFont: cs, sz, szCs, bold, bCs, italic, iCs, u, strike, vertAlign, color, highlight, charSpacing };
  };

  const runStyles = runs.map(r => extractRunProps(r.getElementsByTagNameNS(W_NS, 'rPr')?.[0])).filter(Boolean);
  const firstR = runStyles[0] || extractRunProps(pPr?.getElementsByTagNameNS(W_NS, 'rPr')?.[0]) || {
    font: namedStyle?.font || docDefaults?.font || null,
    asciiFont: namedStyle?.asciiFont || docDefaults?.asciiFont || null,
    hAnsiFont: namedStyle?.hAnsiFont || docDefaults?.hAnsiFont || null,
    csFont: namedStyle?.csFont || docDefaults?.csFont || null,
    sz: namedStyle?.sz || docDefaults?.sz || null,
    szCs: namedStyle?.szCs || docDefaults?.szCs || null,
    bold: false, bCs: false, italic: false, iCs: false, u: null, strike: false, vertAlign: null, color: null, highlight: null, charSpacing: null
  };
  const hasMixedRuns = new Set(runStyles.map(rs => `${rs.bold}|${rs.sz}|${rs.color}|${rs.vertAlign}`)).size > 1;

  return {
    align,
    indentLeft,
    indentFirstLine,
    indentHanging,
    tabs,
    lineSpacing,
    lineRule,
    spaceBefore,
    spaceAfter,
    keepNext,
    keepLines,
    pBdr,
    numPr,
    separator,
    hasMixedRuns,
    ...firstR
  };
}

/**
 * Layer 6-8: 从单元格 OOXML 节点提取完整样式原型（含多段 outlineLevels、富文本、表格行属性）
 */
export function extractCellStylePrototype(tcNode, trNode = null, docDefaults = null) {
  if (!tcNode) return null;
  const trPr = trNode?.getElementsByTagNameNS(W_NS, 'trPr')?.[0];
  const trHeightNode = trPr?.getElementsByTagNameNS(W_NS, 'trHeight')?.[0];
  const rowHeightDxa = trHeightNode ? Number(getAttr(trHeightNode, 'val')) || null : null;
  const hRule = trHeightNode ? getAttr(trHeightNode, 'hRule') : null;
  const cantSplit = Boolean(trPr?.getElementsByTagNameNS(W_NS, 'cantSplit')?.length);
  const tblHeader = Boolean(trPr?.getElementsByTagNameNS(W_NS, 'tblHeader')?.length);

  const tcPr = tcNode.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
  const tcWNode = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
  const widthTwips = tcWNode ? Number(getAttr(tcWNode, 'w')) || null : null;
  const widthType = tcWNode ? getAttr(tcWNode, 'type') : null;
  const gridSpan = Number(getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0], 'val') || 1);
  const vMergeNode = tcPr?.getElementsByTagNameNS(W_NS, 'vMerge')?.[0];
  const vMerge = vMergeNode ? (getAttr(vMergeNode, 'val') || 'continue') : null;
  const vAlign = getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0], 'val');
  const textDirection = getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'textDirection')?.[0], 'val');
  const noWrap = Boolean(tcPr?.getElementsByTagNameNS(W_NS, 'noWrap')?.length);
  const shadingFill = getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'shd')?.[0], 'fill');
  const tcBorders = readBordersBlock(tcPr?.getElementsByTagNameNS(W_NS, 'tcBorders')?.[0]);
  const tcMar = readMarginsBlock(tcPr?.getElementsByTagNameNS(W_NS, 'tcMar')?.[0]);

  const ps = Array.from(tcNode.getElementsByTagNameNS(W_NS, 'p'));
  const paragraphs = ps.map(p => extractParagraphStyle(p, docDefaults));
  const firstP = paragraphs[0] || {};
  const hasSoftBr = Boolean(tcNode.getElementsByTagNameNS(W_NS, 'br')?.length);
  const lineBreakMode = ps.length > 1 ? 'multi_p' : (hasSoftBr ? 'soft_br' : 'single');

  return {
    rowHeightDxa,
    hRule,
    cantSplit,
    tblHeader,
    widthTwips,
    widthType,
    gridSpan,
    vMerge,
    vAlign,
    textDirection,
    noWrap,
    shadingFill,
    tcBorders,
    tcMar,
    lineBreakMode,
    paragraphsCount: ps.length,
    paragraphs,
    ...firstP
  };
}

export function inferCellSemanticRole(cellNode, rowIndex, cellIndex, totalRows, totalCols, _sectionNumber, styleProto = null, hasExternalTitle = false, isInterleavedKv = false) {
  if (rowIndex === 0 && !hasExternalTitle && (totalCols === 1 || styleProto?.gridSpan > 1 || (styleProto?.shadingFill && styleProto.shadingFill !== 'auto'))) {
    return 'SECTION_HEADER';
  }

  if (totalCols === 1) return 'EXPLANATION';

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
    if (styleProto?.bold || styleProto?.tblHeader || (styleProto?.shadingFill && styleProto.shadingFill !== 'auto')) {
      return 'TABLE_HEADER';
    }
    return 'DATA_ROW';
  }

  return 'VALUE';
}

export function extractTypographyProfileFromPrototypes(stylePrototypes, indentValues, docDefaults) {
  const sortedIndents = Array.from(indentValues || []).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  const roles = {};
  for (const [role, proto] of Object.entries(stylePrototypes || {})) {
    if (!proto) continue;
    roles[role] = {
      font: proto.font,
      asciiFont: proto.asciiFont,
      hAnsiFont: proto.hAnsiFont,
      csFont: proto.csFont,
      sz: proto.sz,
      szCs: proto.szCs,
      bold: proto.bold,
      italic: proto.italic,
      color: proto.color,
      align: proto.align,
      indentDxa: proto.indentLeft,
      hangingDxa: proto.indentHanging,
      tabs: proto.tabs || [],
      lineSpacing: proto.lineSpacing,
      lineRule: proto.lineRule,
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
        if (proto?.indentLeft >= 100 && proto?.indentLeft <= 2000) indentValues.add(proto.indentLeft);
        const role = inferCellSemanticRole(tc, rIdx, cIdx, trs.length, tcs.length, 1, proto, false, false);
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

function parseSectPr(sectPr) {
  const pgSzNode = sectPr.getElementsByTagNameNS(W_NS, 'pgSz')?.[0];
  const widthDxa = Number(getAttr(pgSzNode, 'w')) || null;
  const heightDxa = Number(getAttr(pgSzNode, 'h')) || null;
  const orient = getAttr(pgSzNode, 'orient') || 'portrait';

  const pgMarNode = sectPr.getElementsByTagNameNS(W_NS, 'pgMar')?.[0];
  const readMar = (attr) => {
    const v = Number(getAttr(pgMarNode, attr));
    return Number.isFinite(v) ? v : null;
  };
  const docGridNode = sectPr.getElementsByTagNameNS(W_NS, 'docGrid')?.[0];
  const colsNode = sectPr.getElementsByTagNameNS(W_NS, 'cols')?.[0];
  const pgNumNode = sectPr.getElementsByTagNameNS(W_NS, 'pgNumType')?.[0];

  return {
    titlePg: sectPr.getElementsByTagNameNS(W_NS, 'titlePg').length > 0,
    vAlign: getAttr(sectPr.getElementsByTagNameNS(W_NS, 'vAlign')?.[0], 'val'),
    pgNumType: pgNumNode ? { fmt: getAttr(pgNumNode, 'fmt'), start: Number(getAttr(pgNumNode, 'start')) || null } : null,
    pgBorders: readBordersBlock(sectPr.getElementsByTagNameNS(W_NS, 'pgBorders')?.[0]),
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
      topDxa: readMar('top'),
      bottomDxa: readMar('bottom'),
      leftDxa: readMar('left'),
      rightDxa: readMar('right'),
      headerDxa: readMar('header'),
      footerDxa: readMar('footer'),
      gutterDxa: readMar('gutter') ?? 0
    },
    docGrid: {
      linePitchDxa: Number(getAttr(docGridNode, 'linePitch')) || null,
      charSpaceDxa: Number(getAttr(docGridNode, 'charSpace')) || 0,
      type: getAttr(docGridNode, 'type')
    },
    cols: {
      num: Number(getAttr(colsNode, 'num')) || 1,
      spaceDxa: Number(getAttr(colsNode, 'space')) || null
    }
  };
}

/**
 * Layer 2: 提取全部文档节几何 (sectPr[] + 主节兼容)
 */
export function recognizePageFormatting(doc) {
  if (!doc) return null;
  const sectPrNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'sectPr'));
  if (sectPrNodes.length === 0) return null;
  const sectionsPageFormat = sectPrNodes.map(parseSectPr);
  const primary = sectionsPageFormat[sectionsPageFormat.length - 1];
  return {
    sectionBreaksCount: sectPrNodes.length,
    sectionsPageFormat,
    ...primary
  };
}

function extractDrawingsFromNode(node, relsMap) {
  const drawings = Array.from(node.getElementsByTagNameNS(W_NS, 'drawing'));
  return drawings.map(d => {
    const inline = d.getElementsByTagNameNS(WP_NS, 'inline')?.[0];
    const anchor = d.getElementsByTagNameNS(WP_NS, 'anchor')?.[0];
    const box = inline || anchor;
    const extent = box?.getElementsByTagNameNS(WP_NS, 'extent')?.[0];
    const blip = d.getElementsByTagNameNS(A_NS, 'blip')?.[0];
    const rId = blip?.getAttributeNS(R_NS, 'embed') || blip?.getAttribute('r:embed') || null;
    return {
      wrapMode: inline ? 'inline' : 'anchor',
      cxEmu: extent ? Number(extent.getAttribute('cx')) || null : null,
      cyEmu: extent ? Number(extent.getAttribute('cy')) || null : null,
      rId,
      mediaTarget: rId ? relsMap?.[rId]?.target || null : null
    };
  });
}

function scanHeaderOrFooterPart(xmlText, partName, refType, kind, parser, docDefaults, partRelsMap) {
  const fdoc = parser.parseFromString(xmlText, 'application/xml');
  const tblNodes = Array.from(fdoc.getElementsByTagNameNS(W_NS, 'tbl'));
  const slots = [];
  let containerType = 'NONE';
  let tableMetrics = null;

  const readPara = (p) => {
    const pStyleMeta = extractParagraphStyle(p, docDefaults);
    const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
    const fldSimples = Array.from(p.getElementsByTagNameNS(W_NS, 'fldSimple'));
    const instrTexts = runs.map(r => r.getElementsByTagNameNS(W_NS, 'instrText')?.[0]?.textContent || '').join(' ');
    const allInstr = `${fldSimples.map(fs => getAttr(fs, 'instr') || '').join(' ')} ${instrTexts}`.trim();
    const fieldTypes = [];
    if (/PAGE/i.test(allInstr)) fieldTypes.push('PAGE');
    if (/NUMPAGES/i.test(allInstr)) fieldTypes.push('NUMPAGES');
    if (/DATE/i.test(allInstr)) fieldTypes.push('DATE');
    if (/FILENAME/i.test(allInstr)) fieldTypes.push('FILENAME');
    const drawings = extractDrawingsFromNode(p, partRelsMap);

    return {
      align: pStyleMeta.align,
      tabs: pStyleMeta.tabs,
      pBdr: pStyleMeta.pBdr,
      lineSpacing: pStyleMeta.lineSpacing,
      hasPageField: fieldTypes.includes('PAGE'),
      fieldTypes,
      drawings,
      style: {
        font: pStyleMeta.font,
        asciiFont: pStyleMeta.asciiFont,
        sz: pStyleMeta.sz,
        szCs: pStyleMeta.szCs,
        bold: pStyleMeta.bold,
        color: pStyleMeta.color
      }
    };
  };

  if (tblNodes.length > 0) {
    containerType = 'table';
    const mainTbl = tblNodes[0];
    const trNodes = Array.from(mainTbl.getElementsByTagNameNS(W_NS, 'tr'));
    const tblPr = mainTbl.getElementsByTagNameNS(W_NS, 'tblPr')?.[0];
    const tblW = getAttr(tblPr?.getElementsByTagNameNS(W_NS, 'tblW')?.[0], 'w');
    tableMetrics = {
      totalRows: trNodes.length,
      totalCols: trNodes[0] ? Array.from(trNodes[0].getElementsByTagNameNS(W_NS, 'tc')).length : 0,
      tableWidthDxa: tblW ? Number(tblW) : null,
      borders: readBordersBlock(tblPr?.getElementsByTagNameNS(W_NS, 'tblBorders')?.[0])
    };
    trNodes.forEach((tr, rIdx) => {
      const trH = getAttr(tr.getElementsByTagNameNS(W_NS, 'trPr')?.[0]?.getElementsByTagNameNS(W_NS, 'trHeight')?.[0], 'val');
      const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      tcNodes.forEach((tc, cIdx) => {
        const tcPr = tc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
        const tcW = getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0], 'w');
        const vAlign = getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0], 'val');
        const shadingFill = getAttr(tcPr?.getElementsByTagNameNS(W_NS, 'shd')?.[0], 'fill');
        const tcBorders = readBordersBlock(tcPr?.getElementsByTagNameNS(W_NS, 'tcBorders')?.[0]);
        const ps = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
        ps.forEach((p, pIdx) => {
          const pMeta = readPara(p);
          const slotRole = pMeta.drawings.length > 0 ? 'MEDIA_SLOT' : (pMeta.hasPageField ? 'PAGE_NUMBER_FIELD' : 'TEXT_SLOT');
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
            shadingFill,
            tcBorders,
            slotRole,
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
        const pMeta = readPara(p);
        const slotRole = pMeta.drawings.length > 0 ? 'MEDIA_SLOT' : (pMeta.hasPageField ? 'PAGE_NUMBER_FIELD' : 'TEXT_SLOT');
        slots.push({
          slotId: `${kind}_p${pIdx}`,
          kind,
          container: 'paragraph',
          paragraphIndex: pIdx,
          slotRole,
          ...pMeta
        });
      });
    }
  }

  return { found: true, kind, partName, refType, containerType, tableMetrics, slots };
}

/**
 * Layer 3: 纯结构化识别母版所有页眉与页脚物理插槽（含 tabs、pBdr、drawing 媒体与 fldChar）
 */
export async function recognizeHeaderFooterTopology(zip, doc, parser = new DOMParser(), docDefaults = null) {
  const empty = { headers: [], footers: [], found: false, containerType: 'NONE', slots: [] };
  if (!zip || !doc) return empty;

  const relsMap = await readRelsMap(zip, 'word/_rels/document.xml.rels', parser);
  const sectPrNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'sectPr'));
  const sectPr = sectPrNodes[sectPrNodes.length - 1];
  const collectParts = (refTag, kind, fallbackRe) => {
    const refs = sectPr ? Array.from(sectPr.getElementsByTagNameNS(W_NS, refTag)) : [];
    const seen = new Set();
    const out = [];
    for (const ref of refs) {
      const rId = ref.getAttributeNS(R_NS, 'id') || ref.getAttribute('r:id');
      const refType = getAttr(ref, 'type') || 'default';
      const target = relsMap[rId]?.target;
      const partName = target ? (target.startsWith('word/') ? target : `word/${target}`) : null;
      if (partName && zip.file(partName) && !seen.has(partName)) {
        seen.add(partName);
        out.push({ partName, refType, kind });
      }
    }
    if (out.length === 0) {
      Object.keys(zip.files).filter(k => fallbackRe.test(k)).sort().forEach(partName => out.push({ partName, refType: 'default', kind }));
    }
    return out;
  };

  const headers = [];
  for (const h of collectParts('headerReference', 'header', /^word\/header\d+\.xml$/)) {
    const xml = await zip.file(h.partName).async('text');
    const partRels = await readRelsMap(zip, h.partName.replace(/^word\//, 'word/_rels/') + '.rels', parser);
    headers.push(scanHeaderOrFooterPart(xml, h.partName, h.refType, 'header', parser, docDefaults, partRels));
  }
  const footers = [];
  for (const f of collectParts('footerReference', 'footer', /^word\/footer\d+\.xml$/)) {
    const xml = await zip.file(f.partName).async('text');
    const partRels = await readRelsMap(zip, f.partName.replace(/^word\//, 'word/_rels/') + '.rels', parser);
    footers.push(scanHeaderOrFooterPart(xml, f.partName, f.refType, 'footer', parser, docDefaults, partRels));
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

export async function recognizeFooterTopology(zip, doc, parser = new DOMParser()) {
  return recognizeHeaderFooterTopology(zip, doc, parser, null);
}

/**
 * Layer 4: 正文流全量分析（含前置标题区、后置落款区、分页符/空行、表内/表外标题、一节多表）
 */
function discoverBodyFlow(doc, docDefaults) {
  const body = doc.getElementsByTagNameNS(W_NS, 'body')?.[0];
  if (!body) return { preambleBlocks: [], trailingBlocks: [], sectionGroups: [], pageBreakBetweenTablesCount: 0 };

  const children = Array.from(body.childNodes).filter(
    n => n.nodeType === 1 && n.namespaceURI === W_NS && (n.localName === 'p' || n.localName === 'tbl')
  );

  const isHeadingParagraph = (pNode) => {
    const text = (pNode.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return false;
    const pPr = pNode.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
    const hasOutlineLvl = Boolean(pPr?.getElementsByTagNameNS(W_NS, 'outlineLvl')?.[0]);
    const pStyle = getAttr(pPr?.getElementsByTagNameNS(W_NS, 'pStyle')?.[0], 'val') || '';
    const hasHeadingStyle = /heading|标题/i.test(pStyle);
    const hasSeqHeading = /^\s*(?:第\s*\d+\s*部分|Section\s*\d+\b|\d+\s*[.、:：\s]|[IVX]+\s*\.)/i.test(text);
    const firstRunBold = Boolean(pNode.getElementsByTagNameNS(W_NS, 'r')?.[0]?.getElementsByTagNameNS(W_NS, 'rPr')?.[0]?.getElementsByTagNameNS(W_NS, 'b')?.length);
    return hasOutlineLvl || hasHeadingStyle || (hasSeqHeading && (firstRunBold || text.length <= 80));
  };

  const firstTblIdx = children.findIndex(n => n.localName === 'tbl');
  const lastTblIdx = children.map(n => n.localName).lastIndexOf('tbl');

  const preambleBlocks = [];
  const trailingBlocks = [];
  const sectionGroups = [];
  let pendingHeading = null;
  let globalTblIdx = 0;
  let pageBreakBetweenTablesCount = 0;

  children.forEach((node, idx) => {
    if (node.localName === 'p') {
      const hasPageBreak = Array.from(node.getElementsByTagNameNS(W_NS, 'br')).some(b => getAttr(b, 'type') === 'page');
      if (hasPageBreak && firstTblIdx !== -1 && idx > firstTblIdx && idx < lastTblIdx) {
        pageBreakBetweenTablesCount += 1;
      }
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      const pStyle = extractParagraphStyle(node, docDefaults);

      if (firstTblIdx === -1 || idx < firstTblIdx) {
        if (text && !isHeadingParagraph(node)) {
          preambleBlocks.push({ blockIndex: idx, ...pStyle });
          return;
        }
      } else if (idx > lastTblIdx) {
        if (text) trailingBlocks.push({ blockIndex: idx, ...pStyle });
        return;
      }

      if (isHeadingParagraph(node)) {
        pendingHeading = { text, node, style: pStyle };
      }
      return;
    }

    if (node.localName === 'tbl') {
      const trs = Array.from(node.getElementsByTagNameNS(W_NS, 'tr'));
      if (trs.length === 0) {
        globalTblIdx++;
        return;
      }
      if (pendingHeading) {
        sectionGroups.push({
          externalHeading: pendingHeading.text,
          externalHeadingStyle: pendingHeading.style,
          hasExternalTitle: true,
          tables: [{ tblNode: node, tableIndex: globalTblIdx }]
        });
        pendingHeading = null;
      } else {
        sectionGroups.push({
          externalHeading: null,
          externalHeadingStyle: null,
          hasExternalTitle: false,
          tables: [{ tblNode: node, tableIndex: globalTblIdx }]
        });
      }
      globalTblIdx++;
    }
  });

  return { preambleBlocks, trailingBlocks, sectionGroups, pageBreakBetweenTablesCount };
}

/**
 * Layer 9: 依据 9 大层面清单核查构建后的拓扑完整性
 */
export function verifyTopologyCompleteness(topology) {
  const checks = [
    { id: 'L1_DOC_DEFAULTS', label: 'Layer 1: styles/theme/settings/numbering 基准', ok: Boolean(topology?.docDefaults && topology.docDefaults.theme && topology.docDefaults.settings) },
    { id: 'L2_PAGE_FORMAT', label: 'Layer 2: 多节页面几何与分页开关 (sectPr[])', ok: Boolean(topology?.pageFormat?.sectionsPageFormat?.length > 0 && 'titlePg' in topology.pageFormat) },
    { id: 'L3_HEADER_FOOTER', label: 'Layer 3: 页眉页脚全插槽 (含 tabs/drawings/fields)', ok: Boolean(topology?.headerFooterTopology && Array.isArray(topology.headerFooterTopology.headers) && Array.isArray(topology.headerFooterTopology.footers)) },
    { id: 'L4_BODY_FLOW', label: 'Layer 4: 正文流 (前置/后置区/分页与章节)', ok: Boolean(topology?.bodyFlow && Array.isArray(topology?.sections)) },
    { id: 'L5_TABLE_GRID', label: 'Layer 5: 表格网格/边框/边距/布局', ok: Boolean((topology?.sections || []).every(s => Array.isArray(s.columnWidths) && 'borders' in s && 'cellMargins' in s && 'tableLayout' in s)) },
    { id: 'L6_ROW_CELL_GEOM', label: 'Layer 6: 行高规则/跨页/纵向合并组 (vMergeGroups)', ok: Boolean((topology?.sections || []).every(s => Array.isArray(s.vMergeGroups))) },
    { id: 'L7_PARA_OUTLINE', label: 'Layer 7: 段落缩进档位/制表位/多段大纲原型', ok: Boolean(topology?.typographyProfile && Array.isArray(topology.typographyProfile.tiers)) },
    { id: 'L8_RUN_RICHTEXT', label: 'Layer 8: 字体4槽/复合字号/富文本样式原型', ok: Boolean(topology?.stylePrototypes && Object.keys(topology.stylePrototypes).length > 0) },
    { id: 'L9_EDITOR_CONTRACT', label: 'Layer 9: 编辑器可复用行模板与约束契约', ok: Boolean((topology?.sections || []).every(s => s.rowTemplates && Array.isArray(s.rowTemplates.lockedRowIndices))) }
  ];
  const missingItems = checks.filter(c => !c.ok);
  return {
    ok: missingItems.length === 0,
    passedCount: checks.length - missingItems.length,
    totalChecks: checks.length,
    coverageRatio: Number(((checks.length - missingItems.length) / checks.length).toFixed(2)),
    checkedItems: checks,
    missingItems
  };
}

/**
 * 动态识别 DOCX 母版全维度结构与样式拓扑蓝图（零用户数据硬编码）
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
  const bodyRelsMap = await readRelsMap(zip, 'word/_rels/document.xml.rels', parser);

  const pageFormat = recognizePageFormatting(doc);
  const headerFooterTopology = await recognizeHeaderFooterTopology(zip, doc, parser, docDefaults);

  const { preambleBlocks, trailingBlocks, sectionGroups, pageBreakBetweenTablesCount } = discoverBodyFlow(doc, docDefaults);
  const sectionsTopology = [];
  const globalRoleSamples = {};
  const indentCounts = new Map();
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
    const vMergeGroups = [];
    const activeVMergeByCol = {};
    const mediaSlots = [];

    const tblPr = primaryTbl.getElementsByTagNameNS(W_NS, 'tblPr')?.[0];
    const tblWNode = tblPr?.getElementsByTagNameNS(W_NS, 'tblW')?.[0];
    const tblIndNode = tblPr?.getElementsByTagNameNS(W_NS, 'tblInd')?.[0];
    const tblStyleId = getAttr(tblPr?.getElementsByTagNameNS(W_NS, 'tblStyle')?.[0], 'val');
    const borderConfig = readBordersBlock(tblPr?.getElementsByTagNameNS(W_NS, 'tblBorders')?.[0]);
    const cellMargins = readMarginsBlock(tblPr?.getElementsByTagNameNS(W_NS, 'tblCellMar')?.[0]);
    const tableLayout = getAttr(tblPr?.getElementsByTagNameNS(W_NS, 'tblLayout')?.[0], 'type');
    const tableAlign = getAttr(tblPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0], 'val');
    const tableWidth = tblWNode ? { w: Number(getAttr(tblWNode, 'w')) || null, type: getAttr(tblWNode, 'type') } : null;
    const tableIndentDxa = tblIndNode ? Number(getAttr(tblIndNode, 'w')) || 0 : 0;

    const tblGridNode = primaryTbl.getElementsByTagNameNS(W_NS, 'tblGrid')?.[0];
    const tableGridWidths = tblGridNode
      ? Array.from(tblGridNode.getElementsByTagNameNS(W_NS, 'gridCol')).map(gc => Number(getAttr(gc, 'w')) || null)
      : [];

    trNodes.forEach((tr, rIdx) => {
      const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      const cellsInRow = [];
      const rowProtos = tcNodes.map(tc => extractCellStylePrototype(tc, tr, docDefaults));
      const isInterleavedKv = tcNodes.length === 4 && (group.hasExternalTitle || rIdx > 0) &&
        Boolean(rowProtos[0]?.bold) && Boolean(rowProtos[2]?.bold) && !rowProtos[1]?.bold;

      tcNodes.forEach((tc, cIdx) => {
        const styleProto = rowProtos[cIdx];
        if (styleProto?.vMerge === 'restart') {
          activeVMergeByCol[cIdx] = { colIndex: cIdx, startRow: rIdx, endRow: rIdx };
        } else if (styleProto?.vMerge === 'continue' && activeVMergeByCol[cIdx]) {
          activeVMergeByCol[cIdx].endRow = rIdx;
        } else if (activeVMergeByCol[cIdx]) {
          if (activeVMergeByCol[cIdx].endRow > activeVMergeByCol[cIdx].startRow) {
            vMergeGroups.push(activeVMergeByCol[cIdx]);
          }
          delete activeVMergeByCol[cIdx];
        }

        const drawings = extractDrawingsFromNode(tc, bodyRelsMap);
        if (drawings.length > 0) {
          mediaSlots.push({ rowIndex: rIdx, cellIndex: cIdx, drawings });
        }

        const role = inferCellSemanticRole(tc, rIdx, cIdx, trNodes.length, tcNodes.length, sNum, styleProto, group.hasExternalTitle, isInterleavedKv);
        if ((role === 'CHILD_LABEL' || role === 'PARENT_LABEL' || role === 'EXPLANATION') && styleProto?.indentLeft >= 100 && styleProto?.indentLeft <= 2000) {
          indentCounts.set(styleProto.indentLeft, (indentCounts.get(styleProto.indentLeft) || 0) + 1);
        }

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
        cantSplit: Boolean(rowProtos[0]?.cantSplit),
        tblHeader: Boolean(rowProtos[0]?.tblHeader),
        cells: cellsInRow
      });
    });

    for (const grp of Object.values(activeVMergeByCol)) {
      if (grp.endRow > grp.startRow) vMergeGroups.push(grp);
    }

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

    // 针对多段落大纲行提取 outlineLevels[]
    const outlineLevels = [];
    if (layoutType === 'FULL_WIDTH_OUTLINE' || hasFullWidth) {
      const levelMap = new Map();
      for (const r of bodyRows) {
        if (r.cellsCount !== 1) continue;
        for (const pMeta of r.cells[0]?.styleProto?.paragraphs || []) {
          const key = `${pMeta.indentLeft}|${pMeta.bold}`;
          if (!levelMap.has(key)) {
            levelMap.set(key, {
              indentLeft: pMeta.indentLeft,
              indentHanging: pMeta.indentHanging,
              bold: pMeta.bold,
              font: pMeta.font,
              sz: pMeta.sz
            });
          }
        }
      }
      outlineLevels.push(...Array.from(levelMap.values()).sort((a, b) => a.indentLeft - b.indentLeft));
    }

    const kvCloneRow = bodyRows.find(r => r.cellsCount === 2);
    const dataCloneRow = bodyRows.find(r => r.cellsCount >= 3 && r.cells.every(c => c.role === 'DATA_ROW')) || bodyRows.find(r => r.cellsCount >= 3);
    const lockedRowIndices = rowsTopology
      .filter(r => r.cells.some(c => c.role === 'SECTION_HEADER' || c.role === 'TABLE_HEADER'))
      .map(r => r.rowIndex);

    sectionsTopology.push({
      sectionNumber: sNum,
      sectionKey: `section_${sNum}`,
      sectionTitle: titleText,
      hasExternalTitle: group.hasExternalTitle,
      externalHeadingStyle: group.externalHeadingStyle,
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
      tableLayout,
      tableAlign,
      tableWidth,
      tableIndentDxa,
      tableStyleId: tblStyleId || null,
      columnWidths: tableGridWidths.length > 0 ? tableGridWidths : (bodyRows[0]?.cells.map(c => c.widthTwips).filter(Boolean) || []),
      borders: borderConfig,
      cellMargins,
      vMergeGroups,
      mediaSlots,
      outlineLevels,
      rowTemplates: {
        kvCloneRowIndex: kvCloneRow ? kvCloneRow.rowIndex : null,
        dataCloneRowIndex: dataCloneRow ? dataCloneRow.rowIndex : null,
        headerRowCount: group.hasExternalTitle ? 0 : 1,
        lockedRowIndices,
        lineBreakMode: bodyRows[0]?.cells[0]?.styleProto?.lineBreakMode || 'single'
      },
      stylePrototypes: sectionStylePrototypes,
      slots,
      rows: rowsTopology
    });
  });

  if (sectionsTopology.length === 0) {
    diagnostics.push({ level: 'WARNING', code: 'NO_TABLE_SECTIONS', message: '未在文档正文发现任何表格章节' });
  }

  const stylePrototypes = {};
  for (const [role, samples] of Object.entries(globalRoleSamples)) {
    stylePrototypes[role] = electModeStylePrototype(samples, docDefaults);
  }
  const filteredIndents = Array.from(indentCounts.entries())
    .filter(([, cnt]) => cnt >= 2 || indentCounts.size <= 3)
    .map(([val]) => val);
  const typographyProfile = extractTypographyProfileFromPrototypes(stylePrototypes, filteredIndents, docDefaults);

  const result = {
    templateKey,
    recognizedAt: new Date().toISOString(),
    isTopologyDynamic: true,
    docDefaults,
    pageFormat,
    typographyProfile,
    stylePrototypes,
    headerFooterTopology,
    footerTopology: headerFooterTopology,
    bodyFlow: {
      preambleBlocksCount: preambleBlocks.length,
      preambleBlocks,
      trailingBlocksCount: trailingBlocks.length,
      trailingBlocks,
      pageBreakBetweenTablesCount
    },
    sectionsCount: sectionsTopology.length,
    sections: sectionsTopology,
    diagnostics
  };
  result.completenessCheck = verifyTopologyCompleteness(result);
  return result;
}

/**
 * 构建面向结构化编辑器的 StandardTopology / TemplateProfile 契约
 */
export function buildTemplateProfile(blueprint) {
  if (!blueprint) return null;
  const profile = {
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
    bodyFlow: blueprint.bodyFlow || null,
    diagnostics: blueprint.diagnostics || [],
    sections: (blueprint.sections || []).map(sec => ({
      sectionNumber: sec.sectionNumber,
      sectionKey: sec.sectionKey || `section_${sec.sectionNumber}`,
      sectionTitle: sec.sectionTitle,
      hasExternalTitle: Boolean(sec.hasExternalTitle),
      externalHeadingStyle: sec.externalHeadingStyle || null,
      layoutType: sec.layoutType,
      capabilities: sec.capabilities || {},
      rowsCount: sec.rowsCount,
      tableLayout: sec.tableLayout || null,
      tableAlign: sec.tableAlign || null,
      tableWidth: sec.tableWidth || null,
      tableIndentDxa: sec.tableIndentDxa || 0,
      tableStyleId: sec.tableStyleId || null,
      columnWidths: sec.columnWidths || [],
      borders: sec.borders || null,
      cellMargins: sec.cellMargins || null,
      vMergeGroups: sec.vMergeGroups || [],
      mediaSlots: sec.mediaSlots || [],
      outlineLevels: sec.outlineLevels || [],
      rowTemplates: sec.rowTemplates || null,
      stylePrototypes: sec.stylePrototypes || {}
    }))
  };
  profile.completenessCheck = verifyTopologyCompleteness(profile);
  return profile;
}
