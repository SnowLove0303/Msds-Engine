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
 * 从单元格文本推断标准化 Slot Key
 */
export function inferSlotKeyFromLabel(labelText, sectionNumber, rowIndex, cellIndex) {
  const clean = (labelText || '').replace(/[\s\t:：\.\(\)（）_]/g, '').toLowerCase();

  // 常见槽位语义映射
  const SEMANTIC_KEY_MAP = {
    '产品名称': 'product_name',
    'productname': 'product_name',
    '中文名称': 'product_chinese_name',
    '产品型号': 'model_code',
    'modelcode': 'model_code',
    '推荐用途': 'recommended_use',
    'recommendeduse': 'recommended_use',
    '制造商供应商名称': 'company_name',
    'manufacturersupplier': 'company_name',
    '供应商名称': 'company_name',
    '应急咨询电话': 'emergency_phone',
    'emergencytelephone': 'emergency_phone',
    '应急电话': 'emergency_phone',
    '产品类型': 'chemical_nature',
    'producttype': 'chemical_nature',
    '成分': 'ingredients_header',
    '化学品名称': 'chemical_name_header',
    'cas编号': 'cas_no_header',
    'casno': 'cas_no_header',
    '含量': 'concentration_header',
    'concentration': 'concentration_header',
    '外观': 'appearance',
    'appearance': 'appearance',
    'ph值': 'ph_value',
    'ph': 'ph_value',
    '熔点凝固点': 'melting_point',
    '初沸点和沸程': 'boiling_point',
    '闪点': 'flash_point',
    '相对密度': 'relative_density',
    '溶解性': 'solubility',
    '黏度': 'viscosity',
    '粘度': 'viscosity',
    '固含量': 'solid_content',
    '离子性': 'ionic_charge',
    '联合国编号': 'un_number',
    'unnumber': 'un_number',
    '联合国运输名称': 'shipping_name',
    '运输危险类别': 'transport_hazard_class',
    '包装类别': 'packing_group',
    'packinggroup': 'packing_group',
    '海洋污染物': 'marine_pollutant'
  };

  for (const [pattern, key] of Object.entries(SEMANTIC_KEY_MAP)) {
    if (clean.includes(pattern)) return key;
  }

  return `sec${sectionNumber}_r${rowIndex}_c${cellIndex}`;
}

/**
 * 推断单元格在母版中的语义角色
 */
export function inferCellSemanticRole(cellNode, rowIndex, cellIndex, totalRows, totalCols, sectionNumber) {
  const text = (cellNode.textContent || '').trim();

  // 首行且跨通栏或包含章节名 -> SECTION_HEADER
  if (rowIndex === 0) return 'SECTION_HEADER';

  // Section 3 成分表表头 -> TABLE_HEADER
  if (sectionNumber === 3 && (text.includes('CAS') || text.includes('化学品名称') || text.includes('Chemical name'))) {
    return 'TABLE_HEADER';
  }

  // 单列通栏行 -> EXPLANATION
  if (totalCols === 1) return 'EXPLANATION';

  // 双列网格
  if (totalCols === 2) {
    if (cellIndex === 0) {
      if (text.endsWith('：') || text.endsWith(':') || /^\d+\.\d+/.test(text)) {
        return 'CHILD_LABEL';
      }
      return 'PARENT_LABEL';
    }
    return 'VALUE';
  }

  // 多列数据行
  if (totalCols >= 3) {
    return 'VALUE';
  }

  return 'VALUE';
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
      const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      tcNodes.forEach((tc, cIdx) => {
        const tcW = tc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttributeNS(W_NS, 'w');
        const ps = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
        
        ps.forEach((p, pIdx) => {
          const text = (p.textContent || '').trim();
          const jc = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0]?.getElementsByTagNameNS(W_NS, 'jc')?.[0]?.getAttributeNS(W_NS, 'val') || 'left';
          
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

const STANDARD_TEMPLATES = {
  'CN_Guanzhi': 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx',
  'CN_Guocai': 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx',
  'EN_Guanzhi': 'web/public/templates/正式模板_MSDS_EN_冠志(1).docx',
  'EN_Guocai': 'web/public/templates/正式模板_MSDS_EN_冠志(1).docx'
};

/**
 * 动态识别 DOCX 母版几何与语义拓扑蓝图
 * 包含通用页面格式 (pageFormat)、页脚插槽 (footerTopology) 及 16 章节表格几何
 * 
 * @param {Buffer|string} templateSource - 母版 DOCX Buffer 或文件物理路径
 * @param {Object} [options={}] - 配置项
 * @returns {Promise<Object>} 模板动态拓扑蓝图 (Template Topology Blueprint)
 */
export async function recognizeTemplateTopology(templateSource, options = {}) {
  let docxBuffer = null;
  let templateKey = options.templateKey || 'CUSTOM_TEMPLATE';

  if (Buffer.isBuffer(templateSource)) {
    docxBuffer = templateSource;
  } else if (typeof templateSource === 'string') {
    let resolvedPath = path.resolve(templateSource);
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.resolve(REPO_ROOT, templateSource);
      if (!fs.existsSync(resolvedPath)) {
        if (STANDARD_TEMPLATES[templateSource]) {
          resolvedPath = path.resolve(REPO_ROOT, STANDARD_TEMPLATES[templateSource]);
          templateKey = templateSource;
        } else {
          resolvedPath = path.resolve(REPO_ROOT, 'web/public/templates', `${templateSource}.docx`);
          templateKey = path.basename(resolvedPath, '.docx');
        }
      }
    }
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[TEMPLATE-RECOGNIZER FATAL] 找不到指定的母版文件: ${templateSource}`);
    }
    docxBuffer = fs.readFileSync(resolvedPath);
    if (!options.templateKey && !STANDARD_TEMPLATES[templateSource]) {
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

  // 2. 识别通用页面格式几何 (Page Formatting)
  const pageFormat = recognizePageFormatting(doc);

  // 3. 识别通用页脚拓扑几何与插槽 (Footer Topology)
  const footerTopology = await recognizeFooterTopology(zip, doc, parser);

  // 4. 提取表格并建立拓扑
  const tblNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const sectionsTopology = [];

  // 标准 16 章节序数与通用正则
  for (let sNum = 1; sNum <= 16; sNum++) {
    let matchedTbl = null;
    let tableIndex = -1;

    // 若正好 16 个表格，直接一一映射；否则按标题模式探测
    if (tblNodes.length === 16) {
      tableIndex = sNum - 1;
      matchedTbl = tblNodes[tableIndex];
    } else {
      const secRegex = new RegExp(`^\\s*(?:第\\s*${sNum}\\s*部分|Section\\s*${sNum}\\b|${sNum}\\s*\\.|Identification|Hazards)`, 'i');
      tableIndex = tblNodes.findIndex(tbl => {
        const firstRow = tbl.getElementsByTagNameNS(W_NS, 'tr')?.[0];
        const firstCellText = (firstRow?.getElementsByTagNameNS(W_NS, 'tc')?.[0]?.textContent || '').trim();
        return secRegex.test(firstCellText);
      });
      if (tableIndex !== -1) matchedTbl = tblNodes[tableIndex];
    }

    if (!matchedTbl) {
      sectionsTopology.push({
        sectionNumber: sNum,
        found: false,
        layoutType: 'UNKNOWN',
        slots: []
      });
      continue;
    }

    const trNodes = Array.from(matchedTbl.getElementsByTagNameNS(W_NS, 'tr'));
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
      let rowLabelKey = null;

      // 如果是双列行，先看第 0 列推断本行的语义 key
      if (tcNodes.length === 2) {
        const c0Text = (tcNodes[0].textContent || '').replace(/\s+/g, ' ').trim();
        rowLabelKey = inferSlotKeyFromLabel(c0Text, sNum, rIdx, 0);
      }

      tcNodes.forEach((tc, cIdx) => {
        const tcPr = tc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
        const tcW = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttributeNS(W_NS, 'w');
        const gridSpan = parseInt(tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0]?.getAttributeNS(W_NS, 'val') || '1', 10);
        const text = (tc.textContent || '').replace(/\s+/g, ' ').trim();

        if (rIdx === 1 && tcW) {
          columnWidthsSet.push(parseInt(tcW, 10));
        }

        const role = inferCellSemanticRole(tc, rIdx, cIdx, trNodes.length, tcNodes.length, sNum);
        let slotKey = inferSlotKeyFromLabel(text, sNum, rIdx, cIdx);

        // 双列网格下，值格继承标签格推导出的语义 slotKey
        if (tcNodes.length === 2 && rowLabelKey && !rowLabelKey.startsWith('sec')) {
          if (cIdx === 0) {
            slotKey = `${rowLabelKey}_label`;
          } else if (cIdx === 1) {
            slotKey = rowLabelKey;
          }
        }

        const slot = {
          slotKey,
          sectionNumber: sNum,
          rowIndex: rIdx,
          cellIndex: cIdx,
          gridSpan,
          widthTwips: tcW ? parseInt(tcW, 10) : null,
          role,
          templateText: text,
          isEditable: role === 'VALUE' || (role === 'EXPLANATION' && rIdx > 0)
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

    // 判定主布局形态
    let layoutType = 'TWO_COLUMN';
    const dataRow = rowsTopology[1] || rowsTopology[0];
    if (dataRow) {
      if (dataRow.cellsCount === 1) layoutType = 'FULL_WIDTH';
      else if (dataRow.cellsCount === 2) layoutType = 'TWO_COLUMN';
      else layoutType = 'MULTI_COLUMN';
    }

    const titleText = (trNodes[0]?.textContent || '').trim();

    sectionsTopology.push({
      sectionNumber: sNum,
      sectionTitle: titleText,
      found: true,
      tableIndex,
      layoutType,
      rowsCount: trNodes.length,
      columnWidths: columnWidthsSet,
      borders: borderConfig,
      slots,
      rows: rowsTopology
    });
  }

  return {
    templateKey,
    recognizedAt: new Date().toISOString(),
    isTopologyDynamic: true,
    pageFormat,
    footerTopology,
    sectionsCount: sectionsTopology.filter(s => s.found).length,
    sections: sectionsTopology
  };
}
