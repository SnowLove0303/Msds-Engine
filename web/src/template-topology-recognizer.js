/**
 * MSDS-Engine: 通用母版拓扑识别层 (Template Topology Recognizer)
 * 
 * 核心公理与使命 (REQ-TOPO-02 & REQ-TOPO-03 & REQ-GEN-03):
 * 1. 彻底解耦: 废除上层代码对特定母版网格、行数、列宽的死硬编码假设；
 * 2. 动态认知: 自动解析任意 DOCX 母版，提取页面几何 (w:sectPr)、页脚插槽 (slots) 及 16 章节表格几何；
 * 3. 拓扑随动: 当底模版式调整或更换时，拓扑识别层输出新拓扑蓝图，下游覆写管线随新母版几何自动同构适配！
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

/**
 * 纯结构化 Slot 标识生成（不依赖任何模板文本内容映射）
 */
export function buildStructuralSlotKey(sectionNumber, rowIndex, cellIndex) {
  return `sec${sectionNumber}_r${rowIndex}_c${cellIndex}`;
}

/**
 * 从单元格 OOXML 节点提取完整样式原型 (Style Prototype)，用于下游编辑器 1:1 样式复用
 */
export function extractCellStylePrototype(tcNode, trNode = null) {
  if (!tcNode) return null;
  const trPr = trNode?.getElementsByTagNameNS(W_NS, 'trPr')?.[0];
  const trHeightNode = trPr?.getElementsByTagNameNS(W_NS, 'trHeight')?.[0];
  const rowHeightDxa = trHeightNode ? Number(trHeightNode.getAttributeNS(W_NS, 'val') || trHeightNode.getAttribute('w:val')) || null : null;

  const tcPr = tcNode.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
  const tcWNode = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
  const widthTwips = tcWNode ? Number(tcWNode.getAttributeNS(W_NS, 'w') || tcWNode.getAttribute('w:w')) || null : null;
  const gridSpanNode = tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0];
  const gridSpan = Number(gridSpanNode?.getAttributeNS(W_NS, 'val') || gridSpanNode?.getAttribute('w:val') || 1);
  const vAlignNode = tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0];
  const vAlign = vAlignNode?.getAttributeNS(W_NS, 'val') || vAlignNode?.getAttribute('w:val') || null;
  const shdNode = tcPr?.getElementsByTagNameNS(W_NS, 'shd')?.[0];
  const shadingFill = shdNode?.getAttributeNS(W_NS, 'fill') || shdNode?.getAttribute('w:fill') || null;

  const pNode = tcNode.getElementsByTagNameNS(W_NS, 'p')?.[0];
  const pPr = pNode?.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
  const jcNode = pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0];
  const align = jcNode?.getAttributeNS(W_NS, 'val') || jcNode?.getAttribute('w:val') || null;
  const indNode = pPr?.getElementsByTagNameNS(W_NS, 'ind')?.[0];
  const indentLeft = indNode ? Number(indNode.getAttributeNS(W_NS, 'left') || indNode.getAttribute('w:left')) || 0 : 0;
  const indentHanging = indNode ? Number(indNode.getAttributeNS(W_NS, 'hanging') || indNode.getAttribute('w:hanging')) || 0 : 0;
  const spacingNode = pPr?.getElementsByTagNameNS(W_NS, 'spacing')?.[0];
  const lineSpacing = spacingNode ? Number(spacingNode.getAttributeNS(W_NS, 'line') || spacingNode.getAttribute('w:line')) || null : null;

  const rNode = pNode?.getElementsByTagNameNS(W_NS, 'r')?.[0];
  const rPr = rNode?.getElementsByTagNameNS(W_NS, 'rPr')?.[0] || pPr?.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
  const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
  const font = rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia') || rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || null;
  const asciiFont = rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii') || font || null;
  const szNode = rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0];
  const sz = szNode?.getAttributeNS(W_NS, 'val') || szNode?.getAttribute('w:val') || null;
  const bNodes = rPr?.getElementsByTagNameNS(W_NS, 'b');
  const bold = Boolean(bNodes && bNodes.length > 0 && bNodes[0].getAttributeNS(W_NS, 'val') !== '0' && bNodes[0].getAttribute('w:val') !== '0');
  const colorNode = rPr?.getElementsByTagNameNS(W_NS, 'color')?.[0];
  const color = colorNode?.getAttributeNS(W_NS, 'val') || colorNode?.getAttribute('w:val') || null;

  return {
    rowHeightDxa,
    widthTwips,
    gridSpan,
    vAlign,
    shadingFill,
    align,
    indentLeft,
    indentHanging,
    lineSpacing,
    font,
    asciiFont,
    sz,
    bold,
    color
  };
}

/**
 * 纯结构/视觉特征推断单元格语义角色（不依赖任何特定行业词表或固定章节号）
 */
export function inferCellSemanticRole(cellNode, rowIndex, cellIndex, totalRows, totalCols, _sectionNumber, styleProto = null) {
  if (rowIndex === 0) return 'SECTION_HEADER';

  if (totalCols === 1) return 'EXPLANATION';

  if (totalCols === 2) {
    if (cellIndex === 0) {
      const text = (cellNode.textContent || '').trim();
      const isBold = Boolean(styleProto?.bold);
      if (/^\d+\.\d+/.test(text) || /[：:]$/.test(text)) {
        return 'CHILD_LABEL';
      }
      return isBold ? 'PARENT_LABEL' : 'CHILD_LABEL';
    }
    return 'VALUE';
  }

  if (totalCols >= 3) {
    if (rowIndex === 1 && styleProto?.bold) {
      return 'TABLE_HEADER';
    }
    return 'DATA_ROW';
  }

  return 'VALUE';
}

/**
 * 从 Word document DOM 实测提取模板排版与缩进参数 (Typography Profile)
 * 彻底废除写死 420/560 dxa、宋体/Arial 或特定字号的假设
 */
export function extractTypographyProfile(doc) {
  if (!doc) return null;
  const tblNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const fontCounts = new Map();
  const asciiFontCounts = new Map();
  const szCounts = new Map();
  const headerFontCounts = new Map();
  const headerSzCounts = new Map();
  const indentValues = new Set();

  const bump = (map, val) => {
    if (!val) return;
    map.set(val, (map.get(val) || 0) + 1);
  };
  const pickMode = (map, fallback) => {
    let best = fallback;
    let max = 0;
    for (const [k, v] of map.entries()) {
      if (v > max) {
        max = v;
        best = k;
      }
    }
    return best;
  };

  for (const tbl of tblNodes) {
    const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    trs.forEach((tr, rIdx) => {
      const ps = Array.from(tr.getElementsByTagNameNS(W_NS, 'p'));
      for (const p of ps) {
        const ind = p.getElementsByTagNameNS(W_NS, 'ind')?.[0];
        const leftAttr = ind?.getAttributeNS(W_NS, 'left') || ind?.getAttribute('w:left');
        const leftNum = Number(leftAttr);
        if (Number.isFinite(leftNum) && leftNum > 0) {
          indentValues.add(leftNum);
        }
      }
      const rPrs = Array.from(tr.getElementsByTagNameNS(W_NS, 'rPr'));
      for (const rPr of rPrs) {
        const rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
        const eastAsia = rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia');
        const ascii = rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii');
        const szNode = rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0];
        const szVal = szNode?.getAttributeNS(W_NS, 'val') || szNode?.getAttribute('w:val');
        if (rIdx === 0) {
          bump(headerFontCounts, eastAsia || ascii);
          bump(headerSzCounts, szVal);
        } else {
          bump(fontCounts, eastAsia || ascii);
          bump(asciiFontCounts, ascii || eastAsia);
          bump(szCounts, szVal);
        }
      }
    });
  }

  const sortedIndents = Array.from(indentValues).sort((a, b) => a - b);
  const tierA = sortedIndents[0] || 420;
  const tierB = sortedIndents.find(v => v > tierA) || tierA;
  const bodyFont = pickMode(fontCounts, '宋体');
  const bodyAscii = pickMode(asciiFontCounts, bodyFont);
  const bodySz = pickMode(szCounts, '24');
  const hdrFont = pickMode(headerFontCounts, bodyFont);
  const hdrSz = pickMode(headerSzCounts, bodySz);

  return {
    fontFamily: bodyFont,
    asciiFontFamily: bodyAscii,
    valueFontSize: bodySz,
    labelFontSize: bodySz,
    headerFontFamily: hdrFont,
    headerFontSize: hdrSz,
    tabStops: { tierA, tierB },
    roles: {
      SECTION_HEADER: { font: hdrFont, asciiFont: hdrFont, sz: hdrSz, bold: true },
      PARENT_LABEL: { font: bodyFont, asciiFont: bodyAscii, sz: bodySz, bold: true, indentDxa: 0 },
      CHILD_LABEL: { font: bodyFont, asciiFont: bodyAscii, sz: bodySz, bold: true, indentDxa: tierA, hangingDxa: tierA },
      VALUE: { font: bodyFont, asciiFont: bodyAscii, sz: bodySz, bold: false },
      EXPLANATION: { font: bodyFont, asciiFont: bodyAscii, sz: bodySz, bold: false }
    }
  };
}

/**
 * 从 Word document DOM 识别通用页面格式几何参数 (Page Formatting)
 * 提取 w:sectPr 中的尺寸、边距与网格，解耦特定模板几何假设
 */
export function recognizePageFormatting(doc) {
  if (!doc) return null;
  const sectPrNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'sectPr'));
  if (sectPrNodes.length === 0) return null;

  // 使用生效的节属性（通常为正文最底部的 sectPr）
  const sectPr = sectPrNodes[sectPrNodes.length - 1];

  // 1. 纸张尺寸
  const pgSzNode = sectPr.getElementsByTagNameNS(W_NS, 'pgSz')?.[0];
  const widthDxa = Number(pgSzNode?.getAttributeNS(W_NS, 'w') || pgSzNode?.getAttribute('w:w') || 11906);
  const heightDxa = Number(pgSzNode?.getAttributeNS(W_NS, 'h') || pgSzNode?.getAttribute('w:h') || 16838);
  const orient = pgSzNode?.getAttributeNS(W_NS, 'orient') || pgSzNode?.getAttribute('w:orient') || 'portrait';

  // 2. 页边距标尺
  const pgMarNode = sectPr.getElementsByTagNameNS(W_NS, 'pgMar')?.[0];
  const topDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'top') || pgMarNode?.getAttribute('w:top') || 1440);
  const bottomDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'bottom') || pgMarNode?.getAttribute('w:bottom') || 1440);
  const leftDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'left') || pgMarNode?.getAttribute('w:left') || 1440);
  const rightDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'right') || pgMarNode?.getAttribute('w:right') || 1440);
  const headerDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'header') || pgMarNode?.getAttribute('w:header') || 720);
  const footerDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'footer') || pgMarNode?.getAttribute('w:footer') || 720);
  const gutterDxa = Number(pgMarNode?.getAttributeNS(W_NS, 'gutter') || pgMarNode?.getAttribute('w:gutter') || 0);

  // 3. 文档网格
  const docGridNode = sectPr.getElementsByTagNameNS(W_NS, 'docGrid')?.[0];
  const linePitchDxa = Number(docGridNode?.getAttributeNS(W_NS, 'linePitch') || docGridNode?.getAttribute('w:linePitch') || 312);
  const charSpaceDxa = Number(docGridNode?.getAttributeNS(W_NS, 'charSpace') || docGridNode?.getAttribute('w:charSpace') || 0);
  const gridType = docGridNode?.getAttributeNS(W_NS, 'type') || docGridNode?.getAttribute('w:type') || 'lines';

  // 4. 分栏
  const colsNode = sectPr.getElementsByTagNameNS(W_NS, 'cols')?.[0];
  const colsNum = Number(colsNode?.getAttributeNS(W_NS, 'num') || colsNode?.getAttribute('w:num') || 1);
  const colsSpaceDxa = Number(colsNode?.getAttributeNS(W_NS, 'space') || colsNode?.getAttribute('w:space') || 425);

  return {
    pageSize: {
      widthDxa,
      heightDxa,
      orientation: orient,
      widthMm: Number((widthDxa / 56.7).toFixed(1)),
      heightMm: Number((heightDxa / 56.7).toFixed(1)),
      widthPt: Number((widthDxa / 20).toFixed(1)),
      heightPt: Number((heightDxa / 20).toFixed(1))
    },
    margins: {
      topDxa,
      bottomDxa,
      leftDxa,
      rightDxa,
      headerDxa,
      footerDxa,
      gutterDxa,
      topMm: Number((topDxa / 56.7).toFixed(1)),
      bottomMm: Number((bottomDxa / 56.7).toFixed(1)),
      leftMm: Number((leftDxa / 56.7).toFixed(1)),
      rightMm: Number((rightDxa / 56.7).toFixed(1)),
      headerMm: Number((headerDxa / 56.7).toFixed(1)),
      footerMm: Number((footerDxa / 56.7).toFixed(1))
    },
    docGrid: {
      linePitchDxa,
      charSpaceDxa,
      type: gridType
    },
    cols: {
      num: colsNum,
      spaceDxa: colsSpaceDxa
    }
  };
}

/**
 * 动态识别母版页脚几何结构与插槽角色 (Footer Topology)
 * 能够穿透表格或纯段落，自适应识别修订日期槽、企业型号槽及页码槽
 */
export async function recognizeFooterTopology(zip, doc, parser = new DOMParser()) {
  if (!zip || !doc) {
    return { found: false, partName: null, containerType: 'NONE', slots: {} };
  }

  // 1. 扫描 document.xml.rels
  const relsMap = {};
  if (zip.file('word/_rels/document.xml.rels')) {
    try {
      const relsXml = await zip.file('word/_rels/document.xml.rels').async('text');
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      const relNodes = Array.from(relsDoc.getElementsByTagName('Relationship'));
      for (const r of relNodes) {
        relsMap[r.getAttribute('Id')] = {
          type: r.getAttribute('Type'),
          target: r.getAttribute('Target')
        };
      }
    } catch (e) {}
  }

  // 2. 从 sectPr 获取生效的页脚引用
  const sectPrNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'sectPr'));
  const sectPr = sectPrNodes[sectPrNodes.length - 1];
  let targetFooterPart = null;
  let footerRefType = 'default';

  if (sectPr) {
    const footerRefs = Array.from(sectPr.getElementsByTagNameNS(W_NS, 'footerReference'));
    let chosenRef = footerRefs.find(fr => (fr.getAttributeNS(W_NS, 'type') || fr.getAttribute('w:type')) === 'default');
    if (!chosenRef && footerRefs.length > 0) chosenRef = footerRefs[0];

    if (chosenRef) {
      const rId = chosenRef.getAttributeNS(R_NS, 'id') || chosenRef.getAttribute('r:id');
      footerRefType = chosenRef.getAttributeNS(W_NS, 'type') || chosenRef.getAttribute('w:type') || 'default';
      const target = relsMap[rId]?.target;
      if (target) {
        targetFooterPart = target.startsWith('word/') ? target : `word/${target}`;
      }
    }
  }

  // 兜底：若 sectPr 未指定有效目标，探测 zip 中的 word/footer*.xml
  if (!targetFooterPart || !zip.file(targetFooterPart)) {
    const footerFiles = Object.keys(zip.files).filter(k => /^word\/footer\d+\.xml$/.test(k));
    targetFooterPart = footerFiles.find(f => f === 'word/footer1.xml') || footerFiles[0] || null;
  }

  if (!targetFooterPart || !zip.file(targetFooterPart)) {
    return {
      found: false,
      partName: null,
      containerType: 'NONE',
      slots: {}
    };
  }

  let footerXml = '';
  try {
    footerXml = await zip.file(targetFooterPart).async('text');
  } catch (e) {
    return { found: false, partName: targetFooterPart, containerType: 'NONE', slots: {} };
  }

  const fdoc = parser.parseFromString(footerXml, 'application/xml');
  const tblNodes = Array.from(fdoc.getElementsByTagNameNS(W_NS, 'tbl'));

  const slots = {};
  let containerType = 'NONE';
  let tableMetrics = null;

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
        const tcVAlign = tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0]?.getAttributeNS(W_NS, 'val') || null;
        const ps = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
        
        ps.forEach((p, pIdx) => {
          const text = (p.textContent || '').trim();
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
          const jc = pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0]?.getAttributeNS(W_NS, 'val') || 'left';
          const pStyle = pPr?.getElementsByTagNameNS(W_NS, 'pStyle')?.[0]?.getAttributeNS(W_NS, 'val') || null;
          const pPrSz = pPr?.getElementsByTagNameNS(W_NS, 'rPr')?.[0]?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val') || null;
          const spacingNode = pPr?.getElementsByTagNameNS(W_NS, 'spacing')?.[0];
          const spacingLine = spacingNode?.getAttributeNS(W_NS, 'line') || null;
          
          // 提取 run 的格式属性
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          let runProps = { fontSizePt: null, color: null, fontFamily: {} };
          for (const r of runs) {
            const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
            if (rPr) {
              const szVal = rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val');
              const colorVal = rPr.getElementsByTagNameNS(W_NS, 'color')?.[0]?.getAttributeNS(W_NS, 'val');
              const rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
              if (szVal) runProps.fontSizePt = Number(szVal) / 2;
              if (colorVal) runProps.color = colorVal;
              if (rFonts) {
                runProps.fontFamily = {
                  eastAsia: rFonts.getAttributeNS(W_NS, 'eastAsia') || '',
                  ascii: rFonts.getAttributeNS(W_NS, 'ascii') || ''
                };
              }
              if (runProps.fontSizePt) break;
            }
          }

          // 模式探测: 1. 修订日期
          if (!slots.revisionDate && (/(?:修订日期|生效日期|编制日期|发布日期|Revision\s*Date|Date)/i.test(text) || /\d{4}[年\-\/.]\d{1,2}[月\-\/.]\d{1,2}/.test(text))) {
            slots.revisionDate = {
              found: true,
              container: 'table',
              tableIndex: 0,
              rowIndex: rIdx,
              cellIndex: cIdx,
              paragraphIndex: pIdx,
              widthDxa: tcW ? Number(tcW) : null,
              alignment: jc,
              vAlign: tcVAlign,
              rowHeightDxa: trH ? Number(trH) : null,
              pStyle,
              spacingLine,
              style: runProps,
              templateText: text
            };
          }

          // 模式探测: 2. 企业与型号
          if (!slots.entityModel && (/-MSDS|有限公司|Company|Technology|Co\.,\s*Ltd/i.test(text))) {
            slots.entityModel = {
              found: true,
              container: 'table',
              tableIndex: 0,
              rowIndex: rIdx,
              cellIndex: cIdx,
              paragraphIndex: pIdx,
              widthDxa: tcW ? Number(tcW) : null,
              alignment: jc,
              vAlign: tcVAlign,
              rowHeightDxa: trH ? Number(trH) : null,
              pStyle,
              spacingLine,
              style: runProps,
              templateText: text
            };
          }

          // 模式探测: 3. 动态页码
          const fldSimples = Array.from(p.getElementsByTagNameNS(W_NS, 'fldSimple'));
          const instrTexts = runs.map(r => r.getElementsByTagNameNS(W_NS, 'instrText')?.[0]?.textContent || '').join(' ');
          const hasPageField = fldSimples.some(fs => /PAGE/i.test(fs.getAttributeNS(W_NS, 'instr') || '')) || /PAGE/i.test(instrTexts);
          if (!slots.pageNumber && (hasPageField || /PAGE\s*\d+\s*\/\s*NUMPAGES/i.test(text))) {
            slots.pageNumber = {
              found: true,
              container: 'table',
              tableIndex: 0,
              rowIndex: rIdx,
              cellIndex: cIdx,
              paragraphIndex: pIdx,
              widthDxa: tcW ? Number(tcW) : null,
              alignment: jc,
              vAlign: tcVAlign,
              pStyle,
              paragraphFontSizePt: pPrSz ? Number(pPrSz) / 2 : null,
              style: runProps,
              templateText: text
            };
          }
        });
      });
    });
  } else {
    // 纯段落容器
    const rootPs = Array.from(fdoc.getElementsByTagNameNS(W_NS, 'p'));
    if (rootPs.length > 0) {
      containerType = 'paragraph';
      rootPs.forEach((p, pIdx) => {
        const text = (p.textContent || '').trim();
        const jc = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0]?.getElementsByTagNameNS(W_NS, 'jc')?.[0]?.getAttributeNS(W_NS, 'val') || 'left';
        
        if (!slots.revisionDate && (/(?:修订日期|生效日期|编制日期|发布日期|Revision\s*Date|Date)/i.test(text) || /\d{4}[年\-\/.]\d{1,2}[月\-\/.]\d{1,2}/.test(text))) {
          slots.revisionDate = {
            found: true,
            container: 'paragraph',
            paragraphIndex: pIdx,
            alignment: jc,
            templateText: text
          };
        }
        if (!slots.entityModel && (/-MSDS|有限公司|Company|Technology|Co\.,\s*Ltd/i.test(text))) {
          slots.entityModel = {
            found: true,
            container: 'paragraph',
            paragraphIndex: pIdx,
            alignment: jc,
            templateText: text
          };
        }
      });
    }
  }

  return {
    found: true,
    partName: targetFooterPart,
    footerRefType,
    containerType,
    tableMetrics,
    slots
  };
}

/**
 * 动态识别 DOCX 母版结构与样式拓扑蓝图（零用户数据硬编码）
 * 仅提取页面几何 (pageFormat)、排版样式原型 (typographyProfile / stylePrototypes)、页脚插槽 (footerTopology) 与各章节表格结构。
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

  // 1. 解析 Document XML
  const docXmlText = await zip.file('word/document.xml').async('text');
  const doc = parser.parseFromString(docXmlText, 'application/xml');

  // 2. 识别通用页面格式几何 (Page Formatting) 与排版参数 (Typography Profile)
  const pageFormat = recognizePageFormatting(doc);
  const typographyProfile = extractTypographyProfile(doc);

  // 3. 识别通用页脚拓扑几何与插槽 (Footer Topology)
  const footerTopology = await recognizeFooterTopology(zip, doc, parser);

  // 4. 动态发现所有章节表格并建立纯结构拓扑与样式原型库（禁止写入任何模板内容映射）
  const tblNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const sectionsTopology = [];
  const stylePrototypes = {};

  const extractSectionNumber = (titleText, fallbackNum) => {
    const m = String(titleText || '').trim().match(/^\s*(?:第\s*(\d+)\s*部分|Section\s*(\d+)\b|(\d+)\s*[.、:：\s])/i);
    const num = m ? Number(m[1] || m[2] || m[3]) : NaN;
    return Number.isFinite(num) && num > 0 ? num : fallbackNum;
  };

  tblNodes.forEach((matchedTbl, tableIndex) => {
    const trNodes = Array.from(matchedTbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (trNodes.length === 0) return;

    const titleText = (trNodes[0]?.textContent || '').replace(/\s+/g, ' ').trim();
    const sNum = extractSectionNumber(titleText, tableIndex + 1);
    const rowsTopology = [];
    const slots = [];
    const columnWidthsSet = [];

    // 提取表格边框
    const tblPr = matchedTbl.getElementsByTagNameNS(W_NS, 'tblPr')?.[0];
    const tblBorders = tblPr?.getElementsByTagNameNS(W_NS, 'tblBorders')?.[0];
    const borderConfig = {
      top: tblBorders?.getElementsByTagNameNS(W_NS, 'top')?.[0]?.getAttributeNS(W_NS, 'val') || 'single',
      bottom: tblBorders?.getElementsByTagNameNS(W_NS, 'bottom')?.[0]?.getAttributeNS(W_NS, 'val') || 'single',
      insideH: tblBorders?.getElementsByTagNameNS(W_NS, 'insideH')?.[0]?.getAttributeNS(W_NS, 'val') || 'none',
      insideV: tblBorders?.getElementsByTagNameNS(W_NS, 'insideV')?.[0]?.getAttributeNS(W_NS, 'val') || 'none'
    };

    trNodes.forEach((tr, rIdx) => {
      const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      const cellsInRow = [];

      tcNodes.forEach((tc, cIdx) => {
        const styleProto = extractCellStylePrototype(tc, tr);
        if (rIdx === 1 && styleProto?.widthTwips) {
          columnWidthsSet.push(styleProto.widthTwips);
        }

        const role = inferCellSemanticRole(tc, rIdx, cIdx, trNodes.length, tcNodes.length, sNum, styleProto);
        if (role && styleProto && !stylePrototypes[role]) {
          stylePrototypes[role] = styleProto;
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
          isEditable: role === 'VALUE' || role === 'DATA_ROW' || (role === 'EXPLANATION' && rIdx > 0)
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

    // 基于全节数据行形态推断主布局类型与能力标记
    const bodyRows = rowsTopology.slice(1);
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

    sectionsTopology.push({
      sectionNumber: sNum,
      sectionKey: `section_${sNum}`,
      sectionTitle: titleText,
      found: true,
      tableIndex,
      layoutType,
      capabilities: {
        isFullWidthOutline: layoutType === 'FULL_WIDTH_OUTLINE',
        hasMultiColGrid: hasMultiCol,
        hasTwoColKv: hasTwoCol,
        hasFullWidthRows: hasFullWidth
      },
      rowsCount: trNodes.length,
      columnWidths: columnWidthsSet,
      borders: borderConfig,
      slots,
      rows: rowsTopology
    });
  });

  return {
    templateKey,
    recognizedAt: new Date().toISOString(),
    isTopologyDynamic: true,
    pageFormat,
    typographyProfile,
    stylePrototypes,
    footerTopology,
    sectionsCount: sectionsTopology.filter(s => s.found).length,
    sections: sectionsTopology
  };
}

export function buildTemplateProfile(blueprint) {
  if (!blueprint) return null;
  return {
    schemaVersion: '1.0.0',
    templateKey: blueprint.templateKey,
    recognizedAt: blueprint.recognizedAt,
    sectionsCount: blueprint.sectionsCount,
    pageFormat: blueprint.pageFormat,
    typographyProfile: blueprint.typographyProfile || null,
    stylePrototypes: blueprint.stylePrototypes || {},
    footerTopology: blueprint.footerTopology,
    sections: (blueprint.sections || []).map(sec => ({
      sectionNumber: sec.sectionNumber,
      sectionKey: sec.sectionKey || `section_${sec.sectionNumber}`,
      sectionTitle: sec.sectionTitle,
      layoutType: sec.layoutType,
      capabilities: sec.capabilities || {},
      rowsCount: sec.rowsCount,
      columnWidths: sec.columnWidths || []
    }))
  };
}
