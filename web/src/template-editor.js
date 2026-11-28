import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __teFilename = fileURLToPath(import.meta.url);
const __teDirname = path.dirname(__teFilename);
const REPO_ROOT = path.resolve(__teDirname, '../..');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'web/public/templates');
const DEFAULT_PRESETS_PATH = path.join(REPO_ROOT, '标准化流程/MSDS_Studio_Agent_Test_Kit/presets/company_presets.json');

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import {
  loadDocx,
  writeCellValue,
  writeCellLabel,
  clearSectionValues,
  restoreSectionToTemplate,
  deleteRow as deleteDocxRow,
  deleteTableColumn,
  mergeRowCells,
  cloneAndInsertRow,
  writeRichTextToCell,
  parseChemicalFormulaRuns,
  renderFullWidthRow,
  formatSection9LabelCell,
  suppressOversizedRowHeights,
  suppressTrailingDocumentParagraph,
  enableCrossPageBreaksForAllSections,
  healAllTableTopologies,
  enforceTableStandardBorders,
  stampDocumentIdentity,
  updateHeaderFooterData,
  W_NS
} from './docx-engine.js';
import { applyGlobalTypographyProjection, bindEntityPresetToDocument } from './universal-editor-primitives.js';
import { getPresetById, listPresets } from './msds-db.js';
import { enforceStructuralTypographyInvariants } from './pipeline-engine.js';

function resolveTemplateFile(fileName) {
  return path.join(TEMPLATES_DIR, fileName);
}

export const TEMPLATE_LIBRARY = {
  CN_Guanzhi: {
    key: 'CN_Guanzhi',
    name: '正式模板_MSDS_CN_冠志',
    language: 'zh',
    company: 'Guanzhi',
    templatePath: resolveTemplateFile('正式模板_MSDS_CN_冠志(1).docx')
  },
  EN_Guanzhi: {
    key: 'EN_Guanzhi',
    name: '正式模板_MSDS_EN_冠志',
    language: 'en',
    company: 'Guanzhi',
    templatePath: resolveTemplateFile('正式模板_MSDS_EN_冠志(1).docx')
  },
  CN_Guocai: {
    key: 'CN_Guocai',
    name: '正式模板_MSDS_CN_国彩',
    language: 'zh',
    company: 'Guocai',
    templatePath: resolveTemplateFile('正式模板_MSDS_CN_冠志(1).docx')
  },
  EN_Guocai: {
    key: 'EN_Guocai',
    name: '正式模板_MSDS_EN_国彩',
    language: 'en',
    company: 'Guocai',
    templatePath: resolveTemplateFile('正式模板_MSDS_EN_冠志(1).docx')
  },
  PA_Benchmark_CN: {
    key: 'PA_Benchmark_CN',
    name: '正式模板_MSDS_CN_PA基准',
    language: 'zh',
    company: 'Guanzhi',
    templatePath: resolveTemplateFile('正式模板_MSDS_CN_冠志(1).docx')
  },
  PA_Benchmark_EN: {
    key: 'PA_Benchmark_EN',
    name: '正式模板_MSDS_EN_PA基准',
    language: 'en',
    company: 'Guanzhi',
    templatePath: resolveTemplateFile('正式模板_MSDS_EN_冠志(1).docx')
  }
};

function loadDynamicCompanyPresets() {
  if (fs.existsSync(DEFAULT_PRESETS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DEFAULT_PRESETS_PATH, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

const COMPANY_PRESETS = loadDynamicCompanyPresets();

/**
 * 动态注册用户上传的新模板 (Register Custom Template)
 */
export async function registerCustomTemplate(docxPathOrBuffer, meta = {}) {
  let buf = docxPathOrBuffer;
  let tplName = meta.name || 'custom_template.docx';

  if (typeof docxPathOrBuffer === 'string') {
    if (!fs.existsSync(docxPathOrBuffer)) {
      throw new Error(`Template file not found at ${docxPathOrBuffer}`);
    }
    buf = fs.readFileSync(docxPathOrBuffer);
    tplName = path.basename(docxPathOrBuffer);
  }

  const customKey = meta.key || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const targetDir = path.join(process.cwd(), 'web/public/templates/custom');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, `${customKey}_${tplName}`);
  fs.writeFileSync(targetPath, buf);

  const tplEntry = {
    key: customKey,
    name: meta.name || tplName,
    language: meta.language || (/en|english/i.test(tplName) ? 'en' : 'zh'),
    company: meta.company || 'Custom',
    templatePath: targetPath,
    isCustom: true,
    registeredAt: new Date().toISOString()
  };

  TEMPLATE_LIBRARY[customKey] = tplEntry;

  // 立即反射获取其 Schema
  const schema = await inspectTemplateSchema(customKey);
  return {
    success: true,
    templateKey: customKey,
    templateInfo: tplEntry,
    schema
  };
}

/**
 * 模板自发现剖析器 (Template Auto-Profiler)
 * 从任意加载的 .docx 模板真实 XML 中动态提取几何与角色字阶画像，避免硬编码导致换模板崩溃。
 */
export function detectTemplateProfile(engine, isEnTpl = false) {
  const pickMode = (countsMap, fallback) => {
    let best = fallback;
    let maxC = 0;
    for (const [k, c] of countsMap.entries()) {
      if (c > maxC) {
        maxC = c;
        best = k;
      }
    }
    return best;
  };

  // 1. 探测主表宽众数 (5000..15000 dxa 合法区间过滤异常脏表)
  const tblWidthCounts = new Map();
  const twoColCounts = new Map();
  const seqSzCounts = new Map();
  const seqFontCounts = new Map();
  const labelSzCounts = new Map();
  const labelFontCounts = new Map();
  const valueSzCounts = new Map();
  const valueFontCounts = new Map();
  const tabTierACounts = new Map();
  const tabTierBCounts = new Map();

  const CJK_FONT_RE = /宋体|SimSun|微软雅黑|Microsoft YaHei|黑体|SimHei|楷体|仿宋/i;
  for (const record of engine?.records || []) {
    const secNum = record.sectionNumber;
    if (!secNum || secNum < 1 || secNum > 16) continue;
    const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;
    if (tblNode) {
      const tblWEl = tblNode.getElementsByTagNameNS(W_NS, 'tblPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tblW')?.[0];
      const tblW = Number(tblWEl?.getAttributeNS(W_NS, 'w') || tblWEl?.getAttribute('w:w') || 0);
      if (tblW >= 5000 && tblW <= 15000) {
        tblWidthCounts.set(tblW, (tblWidthCounts.get(tblW) || 0) + 1);
      }
      const gcs = Array.from(tblNode.getElementsByTagNameNS(W_NS, 'gridCol'));
      if (gcs.length > 0) {
        const widths = gcs.map(c => Number(c.getAttributeNS(W_NS, 'w') || c.getAttribute('w:w') || 0));
        const gSum = widths.reduce((a, b) => a + b, 0);
        if (gSum >= 5000 && gSum <= 15000) {
          tblWidthCounts.set(gSum, (tblWidthCounts.get(gSum) || 0) + 1);
        }
        if (widths.length === 2 && widths[0] >= 1000 && widths[1] >= 1000 && gSum >= 5000 && gSum <= 15000) {
          const key = `${widths[0]}:${widths[1]}`;
          twoColCounts.set(key, (twoColCounts.get(key) || 0) + 1);
        }
      }
    }

    for (const row of (record.rows || []).slice(1)) {
      const cells = row.cells || [];
      const c0 = cells[0];
      if (c0?.node) {
        const ps = Array.from(c0.node.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          for (const r of runs) {
            const rTxt = (r.textContent || '').trim();
            if (!rTxt) continue;
            const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
            const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val')
              || rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttribute('w:val');
            const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
            const asciiFont = rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii');
            const eaFont = rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia');
            const hasTab = r.getElementsByTagNameNS(W_NS, 'tab').length > 0;
            const isDirtyEnCjkRun = isEnTpl && CJK_FONT_RE.test(asciiFont || '');
            if (isDirtyEnCjkRun) continue;
            const isValidEnSz = !isEnTpl || (sz && sz !== '24') || Boolean(asciiFont && !CJK_FONT_RE.test(asciiFont) && sz !== '24');
            if (/^\d+\.\d+$/.test(rTxt) && hasTab) {
              if (sz && isValidEnSz) seqSzCounts.set(sz, (seqSzCounts.get(sz) || 0) + 1);
              if (asciiFont && (!isEnTpl || !CJK_FONT_RE.test(asciiFont))) seqFontCounts.set(asciiFont, (seqFontCounts.get(asciiFont) || 0) + 1);
            } else if (cells.length === 2) {
              if (sz && isValidEnSz) labelSzCounts.set(sz, (labelSzCounts.get(sz) || 0) + 1);
              const f = isEnTpl ? (asciiFont && !CJK_FONT_RE.test(asciiFont) ? asciiFont : null) : (eaFont || asciiFont);
              if (f) labelFontCounts.set(f, (labelFontCounts.get(f) || 0) + 1);
            }
          }
        }
      }

      const valCell = cells[1];
      if (valCell?.node) {
        const runs = Array.from(valCell.node.getElementsByTagNameNS(W_NS, 'r'));
        for (const r of runs) {
          if (!(r.textContent || '').trim()) continue;
          const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
          const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val')
            || rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttribute('w:val');
          const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
          const asciiFont = rFonts?.getAttributeNS(W_NS, 'ascii') || rFonts?.getAttribute('w:ascii');
          const eaFont = rFonts?.getAttributeNS(W_NS, 'eastAsia') || rFonts?.getAttribute('w:eastAsia');
          const isDirtyEnCjkRun = isEnTpl && CJK_FONT_RE.test(asciiFont || '');
          if (isDirtyEnCjkRun) continue;
          if (sz && (!isEnTpl || sz !== '24')) valueSzCounts.set(sz, (valueSzCounts.get(sz) || 0) + 1);
          const f = isEnTpl ? (asciiFont && !CJK_FONT_RE.test(asciiFont) ? asciiFont : null) : (eaFont || asciiFont);
          if (f) valueFontCounts.set(f, (valueFontCounts.get(f) || 0) + 1);
        }
      }
    }
  }

  const standardTableWidthDxa = Number(pickMode(tblWidthCounts, 9781)) || 9781;
  const twoColStr = pickMode(twoColCounts, `${Math.round(standardTableWidthDxa * 0.3598)}:${standardTableWidthDxa - Math.round(standardTableWidthDxa * 0.3598)}`);
  const [rawC0, rawC1] = twoColStr.split(':').map(Number);
  let col0 = rawC0 || 3519;
  let col1 = rawC1 || (standardTableWidthDxa - col0);
  if (col0 + col1 !== standardTableWidthDxa) {
    if (col0 >= standardTableWidthDxa - 1000) col0 = Math.round(standardTableWidthDxa * 0.3598);
    col1 = standardTableWidthDxa - col0;
  }

  const geometryProfile = {
    standardTableWidthDxa,
    standardTwoColGridDxa: [col0, col1]
  };

  const detectedValSz = isEnTpl ? '19' : pickMode(valueSzCounts, '24');
  const detectedLabelSz = isEnTpl ? detectedValSz : pickMode(labelSzCounts, detectedValSz);
  const detectedSeqSz = isEnTpl ? detectedValSz : pickMode(seqSzCounts, '21');
  const detectedFont = isEnTpl
    ? (valueFontCounts.size > 0 && !valueFontCounts.has('Times New Roman') ? pickMode(valueFontCounts, 'Arial') : 'Arial')
    : pickMode(valueFontCounts, pickMode(labelFontCounts, '宋体'));
  const detectedSeqFont = isEnTpl ? detectedFont : pickMode(seqFontCounts, 'Times New Roman');
  const detectedIndents = [];
  for (const rec of engine.records || []) {
    for (const row of rec.rows || []) {
      const p = row.cells?.[0]?.node?.getElementsByTagNameNS(W_NS, 'p')?.[0];
      const ind = p?.getElementsByTagNameNS(W_NS, 'ind')?.[0];
      const leftVal = Number(ind?.getAttributeNS(W_NS, 'left') || ind?.getAttribute('w:left'));
      if (Number.isFinite(leftVal) && leftVal > 0) detectedIndents.push(leftVal);
    }
  }
  const uniqueIndents = Array.from(new Set(detectedIndents)).sort((a, b) => a - b);
  const tierA = uniqueIndents[0] || 420;
  const tierB = uniqueIndents.find(v => v > tierA) || (tierA === 420 ? 560 : tierA);

  const typographyProfile = {
    isEnglish: isEnTpl,
    fontFamily: detectedFont,
    seqFontFamily: detectedSeqFont,
    labelFontSize: detectedLabelSz,
    seqFontSize: detectedSeqSz,
    valueFontSize: detectedValSz,
    tabStops: { tierA, tierB }
  };

  return { geometryProfile, typographyProfile };
}

/**
 * 检索模板拓扑结构元数据 (Inspect Template Schema)
 */
export async function inspectTemplateSchema(templateKey = 'CN_Guanzhi') {
  const tplInfo = TEMPLATE_LIBRARY[templateKey] || TEMPLATE_LIBRARY.CN_Guanzhi;
  if (!fs.existsSync(tplInfo.templatePath)) {
    throw new Error(`Template not found at ${tplInfo.templatePath}`);
  }

  const buf = fs.readFileSync(tplInfo.templatePath);
  const engine = await loadDocx(buf, path.basename(tplInfo.templatePath));

  const sectionsSchema = {};
  for (const record of engine.records || []) {
    const secNum = record.sectionNumber;
    const tblNode = record.tableNode || record.node;
    const gridCols = tblNode ? Array.from(tblNode.getElementsByTagNameNS(W_NS, 'gridCol')) : [];
    const gridWidths = gridCols.map(c => Number(c.getAttributeNS(W_NS, 'w') || c.getAttribute('w:w') || 0));

    const rowsInfo = (record.rows || []).map((row, rIdx) => {
      const cells = row.cells.map((cell, cIdx) => {
        const pNode = cell.node?.getElementsByTagNameNS?.(W_NS, 'p')?.[0];
        const pPr = pNode?.getElementsByTagNameNS?.(W_NS, 'pPr')?.[0];
        const jcEl = pPr?.getElementsByTagNameNS?.(W_NS, 'jc')?.[0];
        const indEl = pPr?.getElementsByTagNameNS?.(W_NS, 'ind')?.[0];
        const tcPr = cell.node?.getElementsByTagNameNS?.(W_NS, 'tcPr')?.[0];
        const vAlignEl = tcPr?.getElementsByTagNameNS?.(W_NS, 'vAlign')?.[0];
        const jc = jcEl ? (jcEl.getAttributeNS(W_NS, 'val') || jcEl.getAttribute('w:val') || null) : null;
        const vAlign = vAlignEl ? (vAlignEl.getAttributeNS(W_NS, 'val') || vAlignEl.getAttribute('w:val') || null) : null;
        const hasIndent = Boolean(indEl && indEl.attributes && indEl.attributes.length > 0);
        return {
          cellIndex: cIdx,
          text: (cell.text || '').trim(),
          isLabel: cIdx === 0,
          gridSpan: Number(cell.node?.getAttributeNS?.(W_NS, 'gridSpan') || cell.node?.getAttribute?.('w:gridSpan') || '1'),
          jc,
          vAlign,
          hasIndent
        };
      });
      const c0Txt = cells[0]?.text || '';
      let alignmentPolicy = 'KV_TWO_COL';
      if (rIdx === 0) {
        alignmentPolicy = 'SECTION_TITLE';
      } else if (cells.length >= 3 && (secNum === 3 || secNum === 8 || cells.some(c => c.jc === 'center'))) {
        alignmentPolicy = 'MULTI_COL_CENTER';
      } else if (cells.length === 1) {
        alignmentPolicy = 'FULL_WIDTH_LEFT';
      }
      return {
        rowIndex: rIdx,
        cellsCount: row.cells.length,
        alignmentPolicy,
        zeroIndentRequired: alignmentPolicy === 'MULTI_COL_CENTER',
        cells
      };
    });

    sectionsSchema[secNum] = {
      sectionNumber: secNum,
      title: record.title || '',
      columnCount: gridCols.length || (record.rows?.[0]?.cells?.length || 2),
      gridWidthsTwips: gridWidths,
      rowsCount: record.rows?.length || 0,
      rows: rowsInfo
    };
  }

  const isEnTpl = tplInfo.language === 'en';
  const { geometryProfile, typographyProfile } = detectTemplateProfile(engine, isEnTpl);

  return {
    templateKey: tplInfo.key,
    name: tplInfo.name,
    language: tplInfo.language,
    company: tplInfo.company,
    geometryProfile,
    typographyProfile,
    templateProfile: { geometryProfile, typographyProfile },
    sections: sectionsSchema,
    availableChannels: [
      'createWorkSession',
      'clearTemplateValues',
      'clearSectionValues',
      'restoreSection',
      'writeCellValue',
      'writeRichText',
      'writeFullWidthSection',
      'formatSection9LaserTabs',
      'deleteRow',
      'deleteColumn',
      'mergeCells',
      'insertRow',
      'peekCell',
      'peekRow',
      'checkpoint',
      'rollback',
      'applyCompanyPreset',
      'saveSession',
      'getSectionTopology',
      'reshapeTableRows',
      'morphToFullWidth',
      'morphToMultiColumn',
      'insertRowAfter',
      'applyAdaptiveRuler',
      'enforceFlushLeftValues',
      'validateTopologicalInvariants'
    ]
  };
}

/**
 * 创建独立工作会话 (Create Isolated Work Session)
 */
export async function createWorkSession(templateKeyOrOptions = 'CN_Guanzhi', workingDir = null) {
  let templateKey = templateKeyOrOptions;
  let modelCode = null;
  if (typeof templateKeyOrOptions === 'object' && templateKeyOrOptions !== null) {
    templateKey = templateKeyOrOptions.templateKey || 'CN_Guanzhi';
    workingDir = templateKeyOrOptions.workingDir || workingDir;
    modelCode = templateKeyOrOptions.modelCode || null;
  }

  let tplInfo;
  if (typeof templateKey === 'string' && fs.existsSync(templateKey)) {
    const isEn = /_EN|English/i.test(templateKey);
    tplInfo = {
      key: 'custom_path',
      name: path.basename(templateKey, '.docx'),
      language: isEn ? 'en' : 'zh',
      company: templateKeyOrOptions?.company || null,
      templatePath: path.resolve(templateKey)
    };
  } else {
    tplInfo = TEMPLATE_LIBRARY[templateKey] || TEMPLATE_LIBRARY.CN_Guanzhi;
  }
  if (!fs.existsSync(tplInfo.templatePath)) {
    throw new Error(`Template file not found: ${tplInfo.templatePath}`);
  }

  const dir = workingDir || path.join(process.cwd(), 'temp_sessions');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const workingFile = path.join(dir, `${sessionId}_${tplInfo.name}.docx`);

  fs.copyFileSync(tplInfo.templatePath, workingFile);
  const buf = fs.readFileSync(workingFile);
  const engine = await loadDocx(buf, path.basename(workingFile));

  const session = {
    sessionId,
    templateKey: tplInfo.key,
    isEnglish: tplInfo.language === 'en',
    company: tplInfo.company,
    workingPath: workingFile,
    workingDir: dir,
    engine,
    templateProfile: detectTemplateProfile(engine, tplInfo.language === 'en'),
    modelCode,
    modifiedSections: new Set(),
    checkpoints: new Map()
  };

  if (tplInfo.company === 'Guocai') {
    applyCompanyPreset(session, tplInfo.language === 'en' ? 'Guocai_en' : 'Guocai_zh');
  }

  // 英文底模 Section 6 错位消防标签自愈 (底模错印为 6.1 Firefighting precautions，依法规自愈为 6.1 Personal precautions)
  if (session.isEnglish) {
    const s6 = engine.records?.find(r => r.sectionNumber === 6);
    if (s6 && Array.isArray(s6.rows)) {
      for (const row of s6.rows) {
        const c0 = row.cells?.[0];
        if (c0 && /6\.1/i.test(c0.text || '') && /Firefighting precautions/i.test(c0.text || '')) {
          writeCellLabel(c0, '6.1  Personal precautions, protective equipment and emergency procedures：', true);
        }
      }
    }
  }

  return session;
}

/**
 * 事务快照创建 (Checkpoint)
 */
export async function createCheckpoint(session, checkpointId = 'default') {
  const arrayBuf = await session.engine.exportArrayBuffer();
  session.checkpoints.set(checkpointId, Buffer.from(arrayBuf));
  return { success: true, checkpointId };
}

/**
 * 事务回滚撤销 (Rollback)
 */
export async function rollbackSession(session, checkpointId = 'default') {
  const buf = session.checkpoints.get(checkpointId);
  if (!buf) throw new Error(`Checkpoint ${checkpointId} not found`);

  session.engine = await loadDocx(buf, path.basename(session.workingPath));
  return { success: true, rolledBackTo: checkpointId };
}

/**
 * 触觉查询：获取指定单元格快照 (Peek Cell)
 */
export function peekCellInSession(session, { sectionNumber, rowIndex, cellIndex }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);
  const row = record.rows?.[rowIndex];
  if (!row) throw new Error(`Row ${rowIndex} not found in Section ${sectionNumber}`);
  const cell = row.cells?.[cellIndex];
  if (!cell) throw new Error(`Cell ${cellIndex} not found`);

  const spanNode = cell.node?.getElementsByTagNameNS?.(W_NS, 'gridSpan')?.[0]
    || cell.node?.getElementsByTagName?.('w:gridSpan')?.[0];
  const gridSpan = Number(spanNode?.getAttributeNS?.(W_NS, 'val') || spanNode?.getAttribute?.('w:val') || '1');

  const tcWNode = cell.node?.getElementsByTagNameNS?.(W_NS, 'tcW')?.[0]
    || cell.node?.getElementsByTagName?.('w:tcW')?.[0];
  const widthTwips = tcWNode?.getAttributeNS?.(W_NS, 'w') || tcWNode?.getAttribute?.('w:w') || null;

  const runs = (cell.paragraphs || []).flatMap(p => p.runs || []);
  const isBold = cell.bold !== undefined ? Boolean(cell.bold) : runs.some(r => r.bold);

  return {
    sectionNumber,
    rowIndex,
    cellIndex,
    text: cell.text || '',
    bold: isBold,
    gridSpan,
    widthTwips
  };
}

/**
 * 触觉查询：获取指定行快照 (Peek Row)
 */
export function peekRowInSession(session, { sectionNumber, rowIndex }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);
  const row = record.rows?.[rowIndex];
  if (!row) throw new Error(`Row ${rowIndex} not found`);

  return {
    sectionNumber,
    rowIndex,
    cellsCount: row.cells.length,
    cellsText: row.cells.map(c => c.text || '')
  };
}

/**
 * 全表格列物理剔除通道 (Delete Table Column Channel)
 * 核心解决三列结构无法剔除第2列标签的痛点！
 */
export function deleteColumnFromSession(session, { sectionNumber, colIndex }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found in session document`);

  deleteTableColumn(session.engine, record, colIndex);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, deletedColIndex: colIndex };
}

/**
 * 单元格横向合并通道 (Merge Row Cells Channel)
 */
export function mergeCellsInSession(session, { sectionNumber, rowIndex, colStart, colSpan }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);

  mergeRowCells(session.engine, record, rowIndex, colStart, colSpan);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, rowIndex, colStart, colSpan };
}

/**
 * 样式继承克隆插入新行通道 (Insert Row Channel)
 */
export function insertRowIntoSession(session, { sectionNumber, targetRowIndex, cloneFromRowIndex = null }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);

  cloneAndInsertRow(session.engine, record, targetRowIndex, cloneFromRowIndex);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, insertedAt: targetRowIndex };
}

/**
 * Run 级微观高保真富文本与化学式写入通道 (Write Rich Text Channel)
 */
export function writeRichTextToSession(session, { sectionNumber, rowIndex, cellIndex, runs, chemicalFormula = null, options = {} }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);

  const row = record.rows?.[rowIndex];
  if (!row) throw new Error(`Row ${rowIndex} not found in Section ${sectionNumber}`);

  const cell = row.cells?.[cellIndex];
  if (!cell) throw new Error(`Cell ${cellIndex} not found in Section ${sectionNumber} Row ${rowIndex}`);

  let runDescriptors = runs || [];
  if (chemicalFormula) {
    runDescriptors = parseChemicalFormulaRuns(chemicalFormula, options);
  }

  writeRichTextToCell(cell, runDescriptors, options);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, rowIndex, cellIndex };
}

/**
 * 物理行安全剔除通道 (Delete Row Channel)
 */
export function deleteRowFromSession(session, { sectionNumber, rowIndex }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);

  deleteDocxRow(session.engine, record, rowIndex);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, deletedRowIndex: rowIndex };
}

/**
 * 清空模板占位值 (Clear Template Values)
 */
export function clearTemplateValues(session, options = {}) {
  const keepSections = options.keepSections || [];
  for (const record of session.engine.records || []) {
    if (keepSections.includes(record.sectionNumber)) continue;
    clearSectionValues(record);
    session.modifiedSections.add(record.sectionNumber);
  }
  return { success: true, clearedSections: Array.from(session.modifiedSections) };
}

/**
 * 清空指定章节的填写值 (Clear Section Values)
 * 保留所有标签列与几何拓扑，仅将该章节所有值单元格彻底清零
 */
export function clearSectionValuesInSession(session, { sectionNumber }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found in session document`);
  clearSectionValues(record);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber };
}

/**
 * 恢复指定章节至模板原始状态 (Restore Section To Template)
 * 从基准模板中单节还原，绝不破坏或污染其他已编辑章节
 */
export async function restoreSectionInSession(session, { sectionNumber }) {
  const tplInfo = TEMPLATE_LIBRARY[session.templateKey] || TEMPLATE_LIBRARY.CN_Guanzhi;
  if (!fs.existsSync(tplInfo.templatePath)) {
    throw new Error(`Template file not found: ${tplInfo.templatePath}`);
  }
  const baselineBuf = fs.readFileSync(tplInfo.templatePath);
  const baselineEngine = await loadDocx(baselineBuf, path.basename(tplInfo.templatePath));
  restoreSectionToTemplate(session.engine, baselineEngine, sectionNumber);
  session.modifiedSections.delete(sectionNumber);
  return { success: true, sectionNumber };
}

/**
 * 原子写入单元格值 (Write Cell Value)
 */
export function writeCellValueToSession(session, { sectionNumber, rowIndex, cellIndex, text, bold = false }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found in session document`);

  const row = record.rows?.[rowIndex];
  if (!row) throw new Error(`Row ${rowIndex} not found in Section ${sectionNumber}`);

  const cell = row.cells?.[cellIndex];
  if (!cell) throw new Error(`Cell ${cellIndex} not found in Section ${sectionNumber} Row ${rowIndex}`);

  if (!cell.editable) {
    cell.editable = true;
    cell.protectedReason = null;
  }

  // @FIX_TAG(2026-11-23/template-editor/FIX-CELL0-REPLACE): 改写 cellIndex=0 标签格时直接重建单段单 Run，彻底清零原 labelNodes 防新旧标签叠加
  if (cellIndex === 0 && cell.node) {
    const doc = cell.node.ownerDocument;
    const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
    const firstP = ps[0] || cell.node.appendChild(doc.createElementNS(W_NS, 'w:p'));
    for (let pi = ps.length - 1; pi >= 1; pi--) cell.node.removeChild(ps[pi]);
    Array.from(firstP.getElementsByTagNameNS(W_NS, 'r')).forEach(r => firstP.removeChild(r));
    const run = doc.createElementNS(W_NS, 'w:r');
    const t = doc.createElementNS(W_NS, 'w:t');
    t.setAttribute('xml:space', 'preserve');
    t.textContent = String(text ?? '');
    run.appendChild(t);
    firstP.appendChild(run);
    cell.labelNodes = [];
    cell.valueNodes = [run];
    cell.text = String(text ?? '');
    session.modifiedSections.add(sectionNumber);
    return { success: true, sectionNumber, rowIndex, cellIndex };
  }

  writeCellValue(cell, text, {
    bold: Boolean(bold),
    fontSize: session.isEnglish ? '19' : '24',
    fontFamily: session.isEnglish ? 'Arial' : '宋体'
  });

  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, rowIndex, cellIndex };
}

/**
 * 通栏单单元格全量组装 (Write Full Width Section)
 */
export function writeFullWidthSection(session, { sectionNumber, content, options = {} }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found in session document`);

  let effectiveContent = content;
  if (options.isSection2 && session.sourceEngine && typeof content === 'string' && /\[(?:象形图|Pictogram)\]/i.test(content)) {
    const srcSec2 = (session.sourceEngine.records || []).find(r => r.sectionNumber === 2);
    const drawingNodes = [];
    if (srcSec2) {
      for (const row of (srcSec2.rows || [])) {
        for (const cell of (row.cells || [])) {
          for (const p of (cell.paragraphs || [])) {
            const pNode = p.node;
            if (pNode && typeof pNode.getElementsByTagNameNS === 'function') {
              const found = Array.from(pNode.getElementsByTagNameNS('*', 'drawing') || []);
              drawingNodes.push(...found);
            }
          }
        }
      }
    }
    if (drawingNodes.length > 0) {
      let replaced = false;
      effectiveContent = content.split(/\r?\n/).map((line) => {
        if (!replaced && /^\[(?:象形图|Pictogram)\]$/i.test(line.trim())) {
          replaced = true;
          return { isDrawing: true, srcEngine: session.sourceEngine, drawingNodes };
        }
        return line;
      });
    }
  }

  renderFullWidthRow(record, 1, effectiveContent, {
    isEnglish: session.isEnglish,
    targetEngine: session.engine,
    ...options
  });

  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber };
}

/**
 * 注入 Section 9 激光垂线制表符 (G-38 Laser Alignment)
 * 严格按照实际行索引顺序生成单调递增编号 (9.1, 9.2 ... 9.23)，杜绝底模跳号与回填断裂
 */
export function formatSection9LaserTabs(session) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === 9);
  if (!record) return { success: false, reason: 'Section 9 not found' };

  let currentSubIndex = 1;
  const isEn = session.isEnglish;

  for (let rIdx = 0; rIdx < (record.rows || []).length; rIdx++) {
    if (rIdx === 0) continue;
    const row = record.rows[rIdx];
    const firstCell = row?.cells?.[0];
    if (!firstCell) continue;

    const rawText = (firstCell.text || '').trim();
    if (!rawText || /理化特性|Physical\s*and\s*chemical/i.test(rawText)) continue;

    const cleanLabel = rawText.replace(/^(?:9\.)?\.?\d+[\s\u3000.:：]*/, '').replace(/[:：]$/, '').trim();
    if (!cleanLabel) continue;

    formatSection9LabelCell(firstCell, `9.${currentSubIndex}`, cleanLabel, isEn);
    currentSubIndex++;
  }

  session.modifiedSections.add(9);
  return { success: true, formattedRowsCount: currentSubIndex - 1 };
}

/**
 * 注入企业预设覆盖 (Apply Company Preset)
 */
export function applyCompanyPreset(session, presetKey, options = {}) {
  if (options.modelCode) session.modelCode = options.modelCode;
  let preset = null;
  if (typeof presetKey === 'object' && presetKey !== null) {
    preset = presetKey;
  } else if (typeof presetKey === 'string') {
    // 优先从 SQLite 预设库中根据 id 检索
    preset = getPresetById(presetKey);
    if (!preset) {
      const allPresets = listPresets();
      preset = allPresets.find(p => p.id === presetKey || p.name === presetKey || p.entity === presetKey);
    }
    if (!preset) {
      const isEn = session.templateKey?.includes('EN') || session.templateKey?.includes('en') || session.isEnglish;
      const langSuffix = isEn ? '_en' : '_zh';
      const cleanKey = presetKey.toLowerCase();
      if (cleanKey.includes('guanzhi')) {
        preset = COMPANY_PRESETS[`Guanzhi${langSuffix}`];
      } else if (cleanKey.includes('guocai')) {
        preset = COMPANY_PRESETS[`Guocai${langSuffix}`];
      } else if (COMPANY_PRESETS[presetKey]) {
        preset = COMPANY_PRESETS[presetKey];
      }
    }
  }

  if (!preset) return { success: false, reason: `Unknown preset: ${presetKey}` };

  const isEn = session.isEnglish || session.templateKey?.includes('EN') || session.templateKey?.includes('en');
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = isEn ? `${yyyy}-${mm}-${dd}` : `${yyyy}年${mm}月${dd}日`;
  const result = bindEntityPresetToDocument(session.engine, preset, {
    isEnglish: isEn,
    modelCode: session.modelCode,
    revisionDate: todayStr
  });

  stampDocumentIdentity(session.engine, { companyName: result.companyName, shortName: result.shortName });
  session.modifiedSections.add(1);

  // 扩展支持 Preset 全拓扑占位 (REQ-PRE-01: 不局限于 S1.3，支持任意章节 sectionSlots 覆盖)
  const lockedSlots = new Set([
    '供应商名称', '供应商地址', '联系电话', '传真', '应急电话', '应急咨询电话',
    'suppliername', 'supplieraddress', 'tel', 'fax', 'emergencytelephone', 'emergencyphone', 'companyname'
  ]);
  const slots = Array.isArray(preset.sectionSlots) ? preset.sectionSlots : [];
  for (const slot of slots) {
    const secNum = Number(slot.sectionNumber);
    const rec = (session.engine.records || []).find(r => r.sectionNumber === secNum);
    if (!rec || !Array.isArray(rec.rows)) continue;
    const anchorNorm = String(slot.matchAnchor || slot.label || '').replace(/[\s\t:：.．、()（）]/g, '').toLowerCase();
    if (!anchorNorm) continue;
    lockedSlots.add(anchorNorm);

    for (const row of rec.rows) {
      const c0Norm = String(row.cells?.[0]?.text || '').replace(/[\s\t:：.．、()（）]/g, '').toLowerCase();
      if (c0Norm === anchorNorm || c0Norm.includes(anchorNorm)) {
        const targetCell = row.cells?.[slot.cellIndex ?? (row.cells.length > 1 ? 1 : 0)];
        if (targetCell) {
          if (!targetCell.editable) targetCell.editable = true;
          writeCellValue(targetCell, isEn ? (slot.valueEn ?? slot.value ?? '') : (slot.valueCn ?? slot.value ?? ''), {
            bold: false,
            fontSize: isEn ? '19' : '24',
            fontFamily: isEn ? 'Arial' : '宋体'
          });
          session.modifiedSections.add(secNum);
        }
        break;
      }
    }
  }
  session.presetLockedSlots = lockedSlots;

  return { success: true, presetKey, companyName: result.companyName, shortName: result.shortName };
}

/**
 * 保存工作会话到文件 (Save Session)
 */
export async function saveSession(session, outputPath) {
  suppressOversizedRowHeights(session.engine);
  suppressTrailingDocumentParagraph(session.engine);
  enableCrossPageBreaksForAllSections(session.engine);
  healAllTableTopologies(session.engine.documentXml);

  for (const record of session.engine.records || []) {
    if (record.kind === 'table') {
      enforceTableStandardBorders(record);
    }
  }

  const arrayBuf = await session.engine.exportArrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuf));
  return { success: true, outputPath };
}

// =========================================================================
// 拓扑级编辑器变异与内省原语 (Topological Editor Mutation & Introspection Primitives v9.0)
// =========================================================================

/**
 * 结构探测器：返回指定章节的完整网格与行拓扑指纹
 * @param {Object} session
 * @param {number} secNum
 */
export function getSectionTopology(session, secNum) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!record) throw new Error(`Section ${secNum} not found in session`);

  const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;
  const gridCols = tblNode ? Array.from(tblNode.getElementsByTagNameNS(W_NS, 'gridCol')) : [];
  const gridWidths = gridCols.map(c => Number(c.getAttributeNS(W_NS, 'w') || c.getAttribute('w:w') || 0));
  const totalGridWidth = gridWidths.reduce((a, b) => a + b, 0);

  const rows = (record.rows || []).map((row, rIdx) => {
    const cells = (row.cells || []).map((cell, cIdx) => {
      const gsNode = cell.node?.getElementsByTagNameNS?.(W_NS, 'gridSpan')?.[0]
        || cell.node?.getElementsByTagName?.('w:gridSpan')?.[0];
      const gridSpan = Number(gsNode?.getAttributeNS?.(W_NS, 'val') || gsNode?.getAttribute?.('w:val') || 1);

      const tcWNode = cell.node?.getElementsByTagNameNS?.(W_NS, 'tcW')?.[0]
        || cell.node?.getElementsByTagName?.('w:tcW')?.[0];
      const width = Number(tcWNode?.getAttributeNS?.(W_NS, 'w') || tcWNode?.getAttribute?.('w:w') || 0);

      const runs = (cell.paragraphs || []).flatMap(p => p.runs || []);
      const isBold = cell.bold !== undefined ? Boolean(cell.bold) : runs.some(r => r.bold);

      return {
        cellIndex: cIdx,
        text: (cell.text || '').trim(),
        gridSpan,
        widthTwips: width,
        bold: isBold
      };
    });

    let type = 'MULTI_COLUMN';
    if (cells.length === 1 || (cells[0] && cells[0].gridSpan >= (gridCols.length || 2))) {
      type = 'FULL_WIDTH';
    } else if (cells.length === 2) {
      type = 'TWO_COLUMN';
    }

    return {
      rowIndex: rIdx,
      type,
      cellCount: cells.length,
      cells
    };
  });

  return {
    sectionNumber: secNum,
    title: record.title || '',
    rowCount: rows.length,
    columnCount: gridCols.length || (record.columns || 2),
    gridWidthsTwips: gridWidths,
    totalWidthTwips: totalGridWidth,
    rows
  };
}

/**
 * 触觉透视行 (Peek Row - 便捷重载通道)
 */
export function peekRow(session, ...args) {
  if (typeof args[0] === 'object' && args[0] !== null) {
    return peekRowInSession(session, args[0]);
  }
  const [sectionNumber, rowIndex] = args;
  return peekRowInSession(session, { sectionNumber, rowIndex });
}

/**
 * 触觉透视单元格 (Peek Cell - 便捷重载通道)
 */
export function peekCell(session, ...args) {
  if (typeof args[0] === 'object' && args[0] !== null) {
    return peekCellInSession(session, args[0]);
  }
  const [sectionNumber, rowIndex, cellIndex] = args;
  return peekCellInSession(session, { sectionNumber, rowIndex, cellIndex });
}

/**
 * 行级重塑器：智能扩充或缩减表格行数，新增行自动继承邻近数据行的边框样式与内边距，严禁破坏外实内虚规则
 * @param {Object} session
 * @param {number} secNum
 * @param {number} targetRowCount
 */
export function reshapeTableRows(session, secNum, targetRowCount) {
  if (targetRowCount <= 0) throw new Error(`targetRowCount must be > 0, received ${targetRowCount}`);
  const initialRecord = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!initialRecord) throw new Error(`Section ${secNum} not found in session`);

  const currentRowCount = initialRecord.rows?.length || 0;
  if (currentRowCount === targetRowCount) {
    return { success: true, sectionNumber: secNum, previousRowCount: currentRowCount, newRowCount: targetRowCount };
  }

  if (targetRowCount > currentRowCount) {
    const toAdd = targetRowCount - currentRowCount;
    for (let i = 0; i < toAdd; i++) {
      const currentRecord = (session.engine.records || []).find(r => r.sectionNumber === secNum);
      const insertedIdx = currentRecord.rows.length;
      const cloneFromIdx = Math.max(1, currentRecord.rows.length - 1);
      cloneAndInsertRow(session.engine, currentRecord, insertedIdx, cloneFromIdx);
    }
  } else {
    const toRemove = currentRowCount - targetRowCount;
    for (let i = 0; i < toRemove; i++) {
      const currentRecord = (session.engine.records || []).find(r => r.sectionNumber === secNum);
      const removeIdx = currentRecord.rows.length - 1;
      deleteDocxRow(session.engine, currentRecord, removeIdx);
    }
  }

  session.modifiedSections.add(secNum);
  const finalRecord = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  return {
    success: true,
    sectionNumber: secNum,
    previousRowCount: currentRowCount,
    newRowCount: finalRecord?.rows?.length || targetRowCount
  };
}

/**
 * 单行通栏裂变器：将多列数据行动态折叠为单通栏大通栏（如 Section 2 分类或 Section 3 说明行）
 * @param {Object} session
 * @param {number} secNum
 * @param {number} rowIdx
 * @param {string} content
 * @param {Object} options
 */
export function morphToFullWidth(session, secNum, rowIdx, content = '', options = {}) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!record) throw new Error(`Section ${secNum} not found in session`);
  if (!record.rows?.[rowIdx]) throw new Error(`Row ${rowIdx} not found in Section ${secNum}`);

  renderFullWidthRow(record, rowIdx, content, {
    isEnglish: session.isEnglish,
    isSection2: secNum === 2,
    ...options
  });

  session.modifiedSections.add(secNum);
  return { success: true, sectionNumber: secNum, rowIndex: rowIdx };
}

/**
 * 单行多列重构器：将通栏行或非标行拆分重构为标准多列网格
 * @param {Object} session
 * @param {number} secNum
 * @param {number} rowIdx
 * @param {Array<number>} colWidths
 * @param {Object} options
 */
export function morphToMultiColumn(session, secNum, rowIdx, colWidths = null, options = {}) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!record) throw new Error(`Section ${secNum} not found in session`);
  const row = record.rows?.[rowIdx];
  if (!row?.node) throw new Error(`Row ${rowIdx} not found in Section ${secNum}`);

  const doc = row.node.ownerDocument;
  const tblNode = record.tableNode || record.node || row.node.parentNode;
  let targetWidths = colWidths;
  if (!targetWidths || targetWidths.length === 0) {
    const gridCols = tblNode ? Array.from(tblNode.getElementsByTagNameNS(W_NS, 'gridCol')) : [];
    if (gridCols.length > 0) {
      targetWidths = gridCols.map(c => Number(c.getAttributeNS(W_NS, 'w') || c.getAttribute('w:w') || 0));
    } else {
      targetWidths = [2400, 7381];
    }
  }

  const existingTcs = Array.from(row.node.getElementsByTagNameNS(W_NS, 'tc'));
  existingTcs.forEach(tc => row.node.removeChild(tc));

  row.cells = [];

  targetWidths.forEach((width, cIdx) => {
    const tcNode = doc.createElementNS(W_NS, 'w:tc');
    row.node.appendChild(tcNode);

    const tcPr = doc.createElementNS(W_NS, 'w:tcPr');
    tcNode.appendChild(tcPr);

    const tcW = doc.createElementNS(W_NS, 'w:tcW');
    tcW.setAttributeNS(W_NS, 'w:w', String(width));
    tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
    tcPr.appendChild(tcW);

    const vAlign = doc.createElementNS(W_NS, 'w:vAlign');
    vAlign.setAttributeNS(W_NS, 'w:val', 'center');
    tcPr.appendChild(vAlign);

    const tcBorders = doc.createElementNS(W_NS, 'w:tcBorders');
    tcPr.appendChild(tcBorders);

    const isFirstCol = cIdx === 0;
    const isLastCol = cIdx === targetWidths.length - 1;
    const isFirstRow = rowIdx === 0;
    const isLastRow = rowIdx === (record.rows?.length || 1) - 1;

    const bTop = doc.createElementNS(W_NS, 'w:top');
    bTop.setAttributeNS(W_NS, 'w:val', isFirstRow ? 'single' : 'dotted');
    bTop.setAttributeNS(W_NS, 'w:sz', '4');
    bTop.setAttributeNS(W_NS, 'w:space', '0');
    bTop.setAttributeNS(W_NS, 'w:color', 'auto');
    tcBorders.appendChild(bTop);

    const bBottom = doc.createElementNS(W_NS, 'w:bottom');
    bBottom.setAttributeNS(W_NS, 'w:val', isLastRow ? 'single' : 'dotted');
    bBottom.setAttributeNS(W_NS, 'w:sz', '4');
    bBottom.setAttributeNS(W_NS, 'w:space', '0');
    bBottom.setAttributeNS(W_NS, 'w:color', 'auto');
    tcBorders.appendChild(bBottom);

    const bLeft = doc.createElementNS(W_NS, 'w:left');
    bLeft.setAttributeNS(W_NS, 'w:val', isFirstCol ? 'single' : 'dotted');
    bLeft.setAttributeNS(W_NS, 'w:sz', '4');
    bLeft.setAttributeNS(W_NS, 'w:space', '0');
    bLeft.setAttributeNS(W_NS, 'w:color', 'auto');
    tcBorders.appendChild(bLeft);

    const bRight = doc.createElementNS(W_NS, 'w:right');
    bRight.setAttributeNS(W_NS, 'w:val', isLastCol ? 'single' : 'dotted');
    bRight.setAttributeNS(W_NS, 'w:sz', '4');
    bRight.setAttributeNS(W_NS, 'w:space', '0');
    bRight.setAttributeNS(W_NS, 'w:color', 'auto');
    tcBorders.appendChild(bRight);

    const pNode = doc.createElementNS(W_NS, 'w:p');
    tcNode.appendChild(pNode);

    const newCell = {
      node: tcNode,
      text: '',
      bold: isFirstCol && rowIdx > 0
    };
    row.cells.push(newCell);
  });

  session.modifiedSections.add(secNum);
  return { success: true, sectionNumber: secNum, rowIndex: rowIdx, columnCount: targetWidths.length };
}

/**
 * 行插入通道 (Insert Row After - 便捷通道)
 */
export function insertRowAfter(session, secNum, rowIdx, cloneFromRowIdx = null) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!record) throw new Error(`Section ${secNum} not found in session`);

  const targetIdx = rowIdx + 1;
  const cloneSource = cloneFromRowIdx !== null ? cloneFromRowIdx : rowIdx;
  cloneAndInsertRow(session.engine, record, targetIdx, cloneSource);

  session.modifiedSections.add(secNum);
  return { success: true, sectionNumber: secNum, insertedRowIndex: targetIdx };
}

/**
 * 物理行删除通道 (Delete Row - 便捷通道)
 */
export function deleteRow(session, secNum, rowIdx) {
  return deleteRowFromSession(session, { sectionNumber: secNum, rowIndex: rowIdx });
}

/**
 * 单元格合并通道 (Merge Cells - 便捷通道)
 */
export function mergeCells(session, secNum, rowIdx, fromCol, toCol) {
  const colSpan = (toCol - fromCol) + 1;
  return mergeCellsInSession(session, { sectionNumber: secNum, rowIndex: rowIdx, colStart: fromCol, colSpan });
}

/**
 * 自适应排版标尺自检与注入 (Adaptive Ruler)
 * 探测章节最大序号位数：<=3 位为 Tier A (420 dxa)，>=4 位升级为 Tier B (560 dxa)
 */
export function applyAdaptiveRuler(session, secNum) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!record) return { success: false, reason: `Section ${secNum} not found` };

  let maxDigits = 0;
  for (const row of record.rows || []) {
    const c0Text = (row.cells?.[0]?.text || '').trim();
    const m = c0Text.match(/^(\d+(?:\.\d+)+)/);
    if (m) {
      const digits = m[1].replace(/\D/g, '');
      if (digits.length > maxDigits) maxDigits = digits.length;
    }
  }

  const ruler = session.templateProfile?.typographyProfile?.tabStops || { tierA: 420, tierB: 560 };
  const targetIndent = String(maxDigits >= 4 ? ruler.tierB : ruler.tierA);

  for (let rIdx = 1; rIdx < (record.rows || []).length; rIdx++) {
    const row = record.rows[rIdx];
    const c0 = row.cells?.[0];
    if (!c0?.node) continue;

    const ps = Array.from(c0.node.getElementsByTagNameNS(W_NS, 'p'));
    for (const p of ps) {
      const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
      if (!pPr) continue;

      const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')?.[0];
      if (ind) {
        ind.setAttributeNS(W_NS, 'w:left', targetIndent);
        ind.setAttributeNS(W_NS, 'w:hanging', targetIndent);
        ind.removeAttributeNS(W_NS, 'leftChars');
        ind.removeAttribute('w:leftChars');
        ind.removeAttributeNS(W_NS, 'hangingChars');
        ind.removeAttribute('w:hangingChars');
        ind.removeAttributeNS(W_NS, 'firstLineChars');
        ind.removeAttribute('w:firstLineChars');
      }

      const tabsNodes = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
      tabsNodes.forEach(n => pPr.removeChild(n));
    }
  }

  session.modifiedSections.add(secNum);
  return { success: true, sectionNumber: secNum, maxDigits, targetIndentDxa: targetIndent };
}

/**
 * 多列值格顶格左对齐强制规范 (Enforce Flush Left Values)
 */
export function enforceFlushLeftValues(session, secNum) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === secNum);
  if (!record) return { success: false, reason: `Section ${secNum} not found` };

  for (let rIdx = 1; rIdx < (record.rows || []).length; rIdx++) {
    const row = record.rows[rIdx];
    const startCol = (secNum === 13) ? 0 : 1;
    for (let cIdx = startCol; cIdx < (row.cells || []).length; cIdx++) {
      const cell = row.cells[cIdx];
      if (!cell?.node) continue;

      const doc = cell.node.ownerDocument || session.engine.documentXml;
      const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
      for (const p of ps) {
        let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
        if (!pPr) {
          pPr = doc.createElementNS(W_NS, 'w:pPr');
          p.insertBefore(pPr, p.firstChild);
        }
        const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')?.[0];
        if (ind) {
          pPr.removeChild(ind);
        }
        const tabsNodes = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
        tabsNodes.forEach(n => pPr.removeChild(n));

        // 核心排版硬指标：清除 both/center 等异常对齐，强制设置为 left 靠左对齐 (INV-VALUE-INDENT-DICHOTOMY)
        let jc = pPr.getElementsByTagNameNS(W_NS, 'jc')?.[0];
        if (!jc) {
          jc = doc.createElementNS(W_NS, 'w:jc');
          pPr.appendChild(jc);
        }
        jc.setAttributeNS(W_NS, 'w:val', 'left');

        const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
        for (const r of runs) {
          const tabs = Array.from(r.getElementsByTagNameNS(W_NS, 'tab'));
          tabs.forEach(t => r.removeChild(t));
        }
      }
    }
  }

  session.modifiedSections.add(secNum);
  return { success: true, sectionNumber: secNum };
}

/**
 * 拓扑不变量自检器 (Validate Topological Invariants)
 * 严格审查: 零 <w:numPr> 污染、零显式 <w:tabs> 标签污染、值格零非法悬挂缩进
 */
export function validateTopologicalInvariants(session, secNum = null) {
  const records = secNum !== null
    ? (session.engine.records || []).filter(r => r.sectionNumber === secNum)
    : (session.engine.records || []);

  const violations = [];

  for (const record of records) {
    const sNum = record.sectionNumber;
    const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;
    if (!tblNode) continue;

    // 1. 零 <w:numPr> 污染
    const numPrs = tblNode.getElementsByTagNameNS(W_NS, 'numPr');
    if (numPrs.length > 0) {
      violations.push({
        sectionNumber: sNum,
        code: 'NUMPR_POLLUTION',
        message: `Section ${sNum} contains ${numPrs.length} prohibited <w:numPr> nodes`
      });
    }

    // 2. 零显式 <w:tabs> 标签污染 (G-09 铁律)
    const tabsNodes = tblNode.getElementsByTagNameNS(W_NS, 'tabs');
    if (tabsNodes.length > 0) {
      violations.push({
        sectionNumber: sNum,
        code: 'EXPLICIT_TABS_TAG_DETECTED',
        message: `Section ${sNum} contains ${tabsNodes.length} prohibited <w:tabs> nodes`
      });
    }

    // 3. 值单元格零非法悬挂缩进
    for (let rIdx = 1; rIdx < (record.rows || []).length; rIdx++) {
      const row = record.rows[rIdx];
      if (row.cells.length <= 1) continue;

      for (let cIdx = 1; cIdx < row.cells.length; cIdx++) {
        const cell = row.cells[cIdx];
        const ps = Array.from(cell.node?.getElementsByTagNameNS(W_NS, 'p') || []);
        for (const p of ps) {
          const ind = p.getElementsByTagNameNS(W_NS, 'ind')?.[0];
          const hanging = ind?.getAttributeNS(W_NS, 'hanging') || ind?.getAttribute('w:hanging');
          if (hanging && Number(hanging) > 0) {
            violations.push({
              sectionNumber: sNum,
              rowIndex: rIdx,
              cellIndex: cIdx,
              code: 'VALUE_CELL_HANGING_INDENT',
              message: `Section ${sNum} Row ${rIdx} Cell ${cIdx} has illegal hanging indent: ${hanging}`
            });
          }
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violationCount: violations.length,
    violations
  };
}

/**
 * 事务快照通道 (Checkpoint - 便捷别名)
 */
export function checkpoint(session, name = 'default') {
  return createCheckpoint(session, name);
}

/**
 * 事务回滚通道 (Rollback - 便捷别名)
 */
export function rollback(session, name = 'default') {
  return rollbackSession(session, name);
}

/**
 * 安全写入 WordprocessingML 属性，防止 xmldom 下混用 setAttribute 与 setAttributeNS 导致重复属性
 */
function setWAttr(el, localName, val) {
  if (!el) return;
  if (el.hasAttribute(`w:${localName}`)) el.removeAttribute(`w:${localName}`);
  if (el.hasAttributeNS(W_NS, localName)) el.removeAttributeNS(W_NS, localName);
  el.setAttributeNS(W_NS, `w:${localName}`, String(val));
}

/**
 * 清除段落 w:ind 缩进节点（用于居中单元格消除母版遗留偏心缩进）
 */
function clearParagraphIndent(pPr) {
  if (!pPr) return;
  const oldInds = Array.from(pPr.getElementsByTagNameNS(W_NS, 'ind'));
  for (const indEl of oldInds) {
    pPr.removeChild(indEl);
  }
}

/**
 * 锁定单元格垂直居中 (vAlign=center)
 */
function setCellVerticalCenter(cellNode, doc) {
  if (!cellNode) return;
  let tcPr = cellNode.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
  if (!tcPr) {
    tcPr = doc.createElementNS(W_NS, 'w:tcPr');
    cellNode.insertBefore(tcPr, cellNode.firstChild);
  }
  let vAlignEl = tcPr.getElementsByTagNameNS(W_NS, 'vAlign')?.[0];
  if (!vAlignEl) {
    vAlignEl = doc.createElementNS(W_NS, 'w:vAlign');
    tcPr.appendChild(vAlignEl);
  }
  vAlignEl.setAttributeNS(W_NS, 'w:val', 'center');
}

/**
 * Section 3 成分网格居中对齐强化 (Format Section 3 Grid Center)
 * 审计规范要求：S3 表头行及组分数据行（r >= 3）所有单元格必须居中对齐 (jc=center, vAlign=center) 且零 w:ind 干扰
 */
export function formatSection3GridCenter(session) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === 3);
  if (!record || !Array.isArray(record.rows)) return { success: false };

  for (let rIdx = 3; rIdx < record.rows.length; rIdx++) {
    const row = record.rows[rIdx];
    const rowTxt = (row.cells || []).map(c => c.text || '').join(' ').trim();
    if (/^(?:3\.2[\s\t]*)?(?:成分|Ingredients)(?:\b|$)/i.test(rowTxt)) continue;
    for (const cell of (row.cells || [])) {
      if (!cell?.node) continue;
      const doc = cell.node.ownerDocument || session.engine.documentXml;
      setCellVerticalCenter(cell.node, doc);
      const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
      for (const p of ps) {
        let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
        if (!pPr) {
          pPr = doc.createElementNS(W_NS, 'w:pPr');
          p.insertBefore(pPr, p.firstChild);
        }
        clearParagraphIndent(pPr);
        let jc = pPr.getElementsByTagNameNS(W_NS, 'jc')?.[0];
        if (!jc) {
          jc = doc.createElementNS(W_NS, 'w:jc');
          pPr.appendChild(jc);
        }
        jc.setAttributeNS(W_NS, 'w:val', 'center');
      }
    }
  }
  session.modifiedSections.add(3);
  return { success: true, sectionNumber: 3 };
}

/**
 * 编辑器智能安全剪枝原语 (Safe Topological Row Pruning - REQ-EDT-PRUNE-01~02)
 * 在执行删行前校验父子层级关系：若候选行属于父级分类题头（如 Hand protection / 8.1 控制参数 / 1.3 供应商信息）
 * 且下方仍存在至少一个存活的有效子行，则拒绝误删，保护文档树结构完整性。
 */
export function pruneRowsSafely(session, sectionNumber, rowIndices = []) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record || !Array.isArray(record.rows)) return { success: false, deleted: [], protected: [] };

  const deleteSet = new Set(rowIndices.map(Number));
  const sortedDesc = Array.from(deleteSet).sort((a, b) => b - a);
  const parentHeaderRegex = /^(?:1\.3\s*供应商信息|Supplier\s*information|3\.2\s*成分|3\.2\s*Ingredients|8\.1\s*控制参数|Exposure\s*controls|8\.2\s*暴露控制|手部防护|Hand\s*protection|呼吸系统防护|Respiratory\s*protection|眼睛防护|Eye\s*protection|身体防护|Skin\s*and\s*body\s*protection)/i;

  const deleted = [];
  const protectedRows = [];

  for (const rIdx of sortedDesc) {
    const row = record.rows[rIdx];
    if (!row) continue;
    const c0Text = String(row.cells?.[0]?.text || '').trim();
    const isParentHeader = parentHeaderRegex.test(c0Text);

    if (isParentHeader) {
      // 检查后续是否存在不被删除的非空子行
      let hasSurvivingChild = false;
      for (let k = rIdx + 1; k < record.rows.length; k++) {
        if (deleteSet.has(k)) continue;
        const childRow = record.rows[k];
        const childText = (childRow?.cells || []).map(c => (c.text || '').trim()).join('');
        if (childText) {
          hasSurvivingChild = true;
          break;
        }
      }
      if (hasSurvivingChild) {
        protectedRows.push({ rowIndex: rIdx, label: c0Text });
        deleteSet.delete(rIdx);
        continue;
      }
    }

    deleteDocxRow(session.engine, record, rIdx);
    deleted.push(rIdx);
  }

  if (deleted.length > 0) session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, deleted, protected: protectedRows };
}

function setRunStyleNodes(doc, runNode, { fontFamily, fontSize, bold } = {}) {
  let rPr = runNode.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
  if (!rPr) {
    rPr = doc.createElementNS(W_NS, 'w:rPr');
    runNode.insertBefore(rPr, runNode.firstChild);
  }
  if (fontFamily) {
    let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
    if (!rFonts) {
      rFonts = doc.createElementNS(W_NS, 'w:rFonts');
      rPr.appendChild(rFonts);
    }
    ['ascii', 'hAnsi', 'eastAsia', 'cs'].forEach(a => {
      if (rFonts.hasAttribute(`w:${a}`)) rFonts.removeAttribute(`w:${a}`);
      if (rFonts.hasAttributeNS(W_NS, a)) rFonts.removeAttributeNS(W_NS, a);
    });
    rFonts.setAttributeNS(W_NS, 'w:ascii', fontFamily);
    rFonts.setAttributeNS(W_NS, 'w:hAnsi', fontFamily);
    rFonts.setAttributeNS(W_NS, 'w:eastAsia', fontFamily);
    rFonts.setAttributeNS(W_NS, 'w:cs', fontFamily);
  }
  if (fontSize) {
    let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')?.[0];
    if (!sz) {
      sz = doc.createElementNS(W_NS, 'w:sz');
      rPr.appendChild(sz);
    }
    if (sz.hasAttribute('w:val')) sz.removeAttribute('w:val');
    sz.setAttributeNS(W_NS, 'w:val', String(fontSize));

    let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')?.[0];
    if (!szCs) {
      szCs = doc.createElementNS(W_NS, 'w:szCs');
      rPr.appendChild(szCs);
    }
    if (szCs.hasAttribute('w:val')) szCs.removeAttribute('w:val');
    szCs.setAttributeNS(W_NS, 'w:val', String(fontSize));
  }
  if (bold === true) {
    if (!rPr.getElementsByTagNameNS(W_NS, 'b')?.[0]) {
      rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
    }
  } else if (bold === false) {
    Array.from(rPr.getElementsByTagNameNS(W_NS, 'b')).forEach(n => rPr.removeChild(n));
    Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs')).forEach(n => rPr.removeChild(n));
  }
}

export const GLOBAL_ROLE_STYLE_TOKENS = {
  STANDARD_TABLE_WIDTH_DXA: 9781,
  STANDARD_TWO_COL_GRID_DXA: [3519, 6262],
  getProfile(isEn = false, typographyProfile = null) {
    return {
      isEnglish: isEn,
      fontFamily: typographyProfile?.fontFamily || (isEn ? 'Arial' : '宋体'),
      seqFontFamily: typographyProfile?.seqFontFamily || (isEn ? 'Arial' : 'Times New Roman'),
      labelFontSize: typographyProfile?.labelFontSize || (isEn ? '19' : '24'),
      seqFontSize: typographyProfile?.seqFontSize || (isEn ? '19' : '21'),
      valueFontSize: typographyProfile?.valueFontSize || (isEn ? '19' : '24'),
      tabStops: typographyProfile?.tabStops || { tierA: 420, tierB: 560 }
    };
  },
  getRoleSpec(role, profile) {
    switch (role) {
      case 'SEQ_NUM':
        return { fontFamily: profile.seqFontFamily, fontSize: profile.seqFontSize, bold: true, jc: 'left' };
      case 'LABEL':
        return { fontFamily: profile.fontFamily, fontSize: profile.labelFontSize, bold: true, jc: 'left' };
      case 'BOLD_EXPLANATION':
        return { fontFamily: profile.fontFamily, fontSize: profile.labelFontSize, bold: true, jc: 'left' };
      case 'EXPLANATION':
        return { fontFamily: profile.fontFamily, fontSize: profile.valueFontSize, bold: false, jc: 'left' };
      case 'VALUE':
      default:
        return { fontFamily: profile.fontFamily, fontSize: profile.valueFontSize, bold: false, jc: 'left' };
    }
  }
};

/**
 * 拓扑驱动的编辑器全局几何与字体硬锁 (Apply Topology Typography Lock - REQ-TOPO-LOCK-01~02)
 * 严格以当前模板提取的 typographyProfile 为唯一准绳，统一字号、字体、子题头加粗、单 <w:tab/> 与 420/560 dxa 标尺。
 */
export function applyTopologyTypographyLock(session, typographyProfile = null) {
  const activeTypo = typographyProfile || session.templateProfile?.typographyProfile || null;
  const geom = session.templateProfile?.geometryProfile || {};
  const stdWidthDxa = geom.standardTableWidthDxa || GLOBAL_ROLE_STYLE_TOKENS.STANDARD_TABLE_WIDTH_DXA;
  const stdTwoColDxa = geom.standardTwoColGridDxa || GLOBAL_ROLE_STYLE_TOKENS.STANDARD_TWO_COL_GRID_DXA;

  const isEn = Boolean(activeTypo?.isEnglish ?? session.isEnglish);
  const profile = GLOBAL_ROLE_STYLE_TOKENS.getProfile(isEn, activeTypo);

  const doc = session.engine.documentXml;
  if (!doc) return { success: false };

  // 1. 英文版全篇标点纯度兜底：清除残留全角冒号
  if (isEn) {
    const allTs = Array.from(doc.getElementsByTagNameNS(W_NS, 't'));
    for (const tNode of allTs) {
      if (tNode.textContent && /：/.test(tNode.textContent)) {
        tNode.textContent = tNode.textContent.replace(/：/g, ':');
      }
    }
  }

  for (const record of session.engine.records || []) {
    const secNum = record.sectionNumber;
    if (!Array.isArray(record.rows)) continue;

    const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;

    // Section 11 模板残留 3 列行（c0 为空占位格/vMerge）物理清理：直接从 XML <w:tr> 移除空 c0，确保 100% 归位为标准 2 列 KV
    if (secNum === 11 && tblNode) {
      const trNodes = Array.from(tblNode.getElementsByTagNameNS(W_NS, 'tr'));
      for (let rIdx = 1; rIdx < trNodes.length; rIdx++) {
        const tr = trNodes[rIdx];
        const tcs = Array.from(tr.childNodes).filter(n => n.nodeType === 1 && n.localName === 'tc');
        if (tcs.length === 3 && !(tcs[0].textContent || '').trim()) {
          tr.removeChild(tcs[0]);
          const row = record.rows[rIdx];
          if (row?.cells?.length === 3 && !(row.cells[0]?.text || '').trim()) {
            row.cells.splice(0, 1);
          }
        }
      }
    }

    // @ANTIGRAVITY_INVARIANT_LOCK_START: 统一 16 个 Section 表格总宽度为 stdWidthDxa（消除 Section 8 等异类表宽），Section 11 纯 2 列/通栏结构重建标准 2 列 tblGrid
    if (tblNode) {
      let tblPr = tblNode.getElementsByTagNameNS(W_NS, 'tblPr')?.[0];
      if (!tblPr) {
        tblPr = doc.createElementNS(W_NS, 'w:tblPr');
        tblNode.insertBefore(tblPr, tblNode.firstChild);
      }
      let tblW = tblPr.getElementsByTagNameNS(W_NS, 'tblW')?.[0];
      if (!tblW) {
        tblW = doc.createElementNS(W_NS, 'w:tblW');
        tblPr.appendChild(tblW);
      }
      setWAttr(tblW, 'w', stdWidthDxa);
      setWAttr(tblW, 'type', 'dxa');

      // 统一所有章节 tblGrid 总宽为 stdWidthDxa（消除 Table 8 9860 dxa 等异类列网格，保留首列标签宽度）
      if (secNum !== 11) {
        const tblGridAll = tblNode.getElementsByTagNameNS(W_NS, 'tblGrid')?.[0];
        if (tblGridAll) {
          const gcs = Array.from(tblGridAll.getElementsByTagNameNS(W_NS, 'gridCol'));
          const gcWidths = gcs.map(gc => Number(gc.getAttributeNS(W_NS, 'w') || gc.getAttribute('w:w') || 0));
          const gcSum = gcWidths.reduce((a, b) => a + b, 0);
          if (gcs.length > 0 && gcSum > 0 && gcSum !== stdWidthDxa) {
            const diff = stdWidthDxa - gcSum;
            const lastIdx = gcs.length - 1;
            const newLastW = Math.max(400, gcWidths[lastIdx] + diff);
            setWAttr(gcs[lastIdx], 'w', newLastW);
            for (const r of record.rows) {
              const rCells = r.cells || [];
              if (rCells.length === 1 && rCells[0]?.node) {
                const tcW = rCells[0].node.getElementsByTagNameNS(W_NS, 'tcPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
                if (tcW) setWAttr(tcW, 'w', stdWidthDxa);
              } else if (rCells.length >= 2) {
                const tcWs = rCells.map(c => Number(c?.node?.getElementsByTagNameNS(W_NS, 'tcPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttributeNS(W_NS, 'w') || c?.node?.getElementsByTagNameNS(W_NS, 'tcPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttribute('w:w') || 0));
                const rSum = tcWs.reduce((a, b) => a + b, 0);
                if (rSum > 0 && rSum !== stdWidthDxa) {
                  const lastCellTcW = rCells[rCells.length - 1]?.node?.getElementsByTagNameNS(W_NS, 'tcPr')?.[0]?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
                  if (lastCellTcW) {
                    setWAttr(lastCellTcW, 'w', Math.max(400, tcWs[tcWs.length - 1] + (stdWidthDxa - rSum)));
                  }
                }
              }
            }
          }
        }
      }

      if (secNum === 11 && record.rows.slice(1).every(r => (r.cells || []).length <= 2)) {
        const tblGrid = tblNode.getElementsByTagNameNS(W_NS, 'tblGrid')?.[0];
        if (tblGrid) {
          Array.from(tblGrid.getElementsByTagNameNS(W_NS, 'gridCol')).forEach(gc => tblGrid.removeChild(gc));
          for (const colW of stdTwoColDxa) {
            const gc = doc.createElementNS(W_NS, 'w:gridCol');
            setWAttr(gc, 'w', colW);
            tblGrid.appendChild(gc);
          }
        }
        for (const r of record.rows) {
          const rCells = r.cells || [];
          if (rCells.length === 1 && rCells[0]?.node) {
            let tcPr = rCells[0].node.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
            if (!tcPr) {
              tcPr = doc.createElementNS(W_NS, 'w:tcPr');
              rCells[0].node.insertBefore(tcPr, rCells[0].node.firstChild);
            }
            let gs = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0];
            if (!gs) {
              gs = doc.createElementNS(W_NS, 'w:gridSpan');
              tcPr.appendChild(gs);
            }
            setWAttr(gs, 'val', 2);
            let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
            if (!tcW) {
              tcW = doc.createElementNS(W_NS, 'w:tcW');
              tcPr.appendChild(tcW);
            }
            setWAttr(tcW, 'w', stdWidthDxa);
            setWAttr(tcW, 'type', 'dxa');
          } else if (rCells.length === 2) {
            rCells.forEach((c, idx) => {
              if (!c?.node) return;
              let tcPr = c.node.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
              if (!tcPr) {
                tcPr = doc.createElementNS(W_NS, 'w:tcPr');
                c.node.insertBefore(tcPr, c.node.firstChild);
              }
              Array.from(tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')).forEach(g => tcPr.removeChild(g));
              let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
              if (!tcW) {
                tcW = doc.createElementNS(W_NS, 'w:tcW');
                tcPr.appendChild(tcW);
              }
              setWAttr(tcW, 'w', stdTwoColDxa[idx]);
              setWAttr(tcW, 'type', 'dxa');
            });
          }
        }
      }
    }
    // @ANTIGRAVITY_INVARIANT_LOCK_END

    // 0. 排查并补全 16 个 Section 标题序号 + 页眉/短说明防跨页撕裂 (keepNext / cantSplit)
    if (secNum >= 1 && secNum <= 16 && record.rows[0]?.cells?.length > 0) {
      for (const hCell of record.rows[0].cells) {
        const hTxt = (hCell.text || '').trim();
        if (hTxt && !new RegExp(`^${secNum}\\s*[.．、]`).test(hTxt)) {
          const tNodes = Array.from(hCell.node?.getElementsByTagNameNS(W_NS, 't') || []);
          const firstNonEmpty = tNodes.find(tn => (tn.textContent || '').trim().length > 0);
          if (firstNonEmpty) {
            firstNonEmpty.textContent = `${secNum}. ${firstNonEmpty.textContent.trimStart()}`;
          }
          hCell.text = `${secNum}. ${hTxt}`;
        }
        for (const hp of Array.from(hCell.node?.getElementsByTagNameNS(W_NS, 'p') || [])) {
          let hpPr = hp.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
          if (!hpPr) {
            hpPr = doc.createElementNS(W_NS, 'w:pPr');
            hp.insertBefore(hpPr, hp.firstChild);
          }
          if (!hpPr.getElementsByTagNameNS(W_NS, 'keepNext')?.[0]) {
            hpPr.appendChild(doc.createElementNS(W_NS, 'w:keepNext'));
          }
        }
      }
      if (record.rows[0]?.node) {
        let hTrPr = record.rows[0].node.getElementsByTagNameNS(W_NS, 'trPr')?.[0];
        if (!hTrPr) {
          hTrPr = doc.createElementNS(W_NS, 'w:trPr');
          record.rows[0].node.insertBefore(hTrPr, record.rows[0].node.firstChild);
        }
        if (!hTrPr.getElementsByTagNameNS(W_NS, 'cantSplit')?.[0]) {
          hTrPr.appendChild(doc.createElementNS(W_NS, 'w:cantSplit'));
        }
      }
    }

    // 终态安全清理：在所有写入与追加结束后，剔除无任何文本内容的纯空幽灵行
    for (let rIdx = record.rows.length - 1; rIdx >= 1; rIdx--) {
      const rowText = (record.rows[rIdx]?.cells || []).map(c => (c.text || '').trim()).join('');
      if (!rowText && record.rows.length > 2) {
        deleteDocxRow(session.engine, record, rIdx);
      }
    }

    // Section 2 采用专属 5 级大纲树状层级缩进，禁止执行序号重排与 420/560 悬挂缩进覆写
    if (secNum === 2) continue;

    // 若章节内序号因语义锚点匹配+末尾追加而出现乱序/跳号，则自动重排为连续序号 (如 9.1..9.11)
    const seqRows = [];
    for (let rIdx = 1; rIdx < record.rows.length; rIdx++) {
      const c0 = record.rows[rIdx]?.cells?.[0];
      const t = (c0?.text || '').trim();
      const sm = t.match(/^(\d+)\.(\d+)/);
      if (sm && Number(sm[1]) === secNum) seqRows.push({ rIdx, c0, sub: Number(sm[2]), rawSeq: `${sm[1]}.${sm[2]}` });
    }
    // @FIX_TAG(2026-11-24/template-editor/FIX-S2-NO-RENUMBER): Section 2 为通栏大纲结构，保留 2.0 紧急情况概述，禁止按 KV 行序重排为 2.1 导致双 2.1
    const isSeqOrdered = seqRows.every((sr, idx) => sr.sub === idx + 1);
    if (secNum !== 2 && seqRows.length > 0 && !isSeqOrdered) {
      seqRows.forEach((sr, idx) => {
        const expectedSeq = `${secNum}.${idx + 1}`;
        if (sr.rawSeq !== expectedSeq && sr.c0?.node) {
          const tNodes = Array.from(sr.c0.node.getElementsByTagNameNS(W_NS, 't'));
          for (const tn of tNodes) {
            if (tn.textContent && tn.textContent.includes(sr.rawSeq)) {
              tn.textContent = tn.textContent.replace(sr.rawSeq, expectedSeq);
              sr.c0.text = sr.c0.text.replace(sr.rawSeq, expectedSeq);
              break;
            }
          }
        }
      });
    }

    // 探测本章节最大编号位数 (Tier A: 420 dxa, Tier B: 560 dxa)
    let has4DigitSeq = false;
    for (let rIdx = 1; rIdx < record.rows.length; rIdx++) {
      const t = (record.rows[rIdx]?.cells?.[0]?.text || '').trim();
      const sm = t.match(/^(\d+\.\d+)/);
      if (sm && sm[1].length >= 5) {
        has4DigitSeq = true;
        break;
      }
    }
    const targetTabDxa = has4DigitSeq ? profile.tabStops.tierB : profile.tabStops.tierA;

    for (let rIdx = 1; rIdx < record.rows.length; rIdx++) {
      const row = record.rows[rIdx];
      const cells = row.cells || [];

      // 2-col KV 行：清理从模板继承的过高固定行高（如 S11 11.2 继承模板 3 行高 1169 dxa），确保单行自适应紧凑
      if (cells.length === 2 && row.node) {
        const valTxt = (cells[1]?.text || '').trim();
        if (!valTxt.includes('\n') && valTxt.length < 60) {
          const trPr = row.node.getElementsByTagNameNS(W_NS, 'trPr')?.[0];
          const trHeight = trPr?.getElementsByTagNameNS(W_NS, 'trHeight')?.[0];
          if (trHeight && Number(trHeight.getAttributeNS(W_NS, 'val') || trHeight.getAttribute('w:val') || 0) > 450) {
            trPr.removeChild(trHeight);
          }
        }
      }

      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        if (!cell?.node) continue;

        // 2-col KV 行双列统一垂直居中 (解决 S11 值格居上、S13 处理方法垂直居中规范)
        if (cells.length === 2) {
          let tcPr = cell.node.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
          if (!tcPr) {
            tcPr = doc.createElementNS(W_NS, 'w:tcPr');
            cell.node.insertBefore(tcPr, cell.node.firstChild);
          }
          let vAlignEl = tcPr.getElementsByTagNameNS(W_NS, 'vAlign')?.[0];
          if (!vAlignEl) {
            vAlignEl = doc.createElementNS(W_NS, 'w:vAlign');
            tcPr.appendChild(vAlignEl);
          }
          vAlignEl.setAttributeNS(W_NS, 'w:val', 'center');
        }

        if (secNum === 9 && cIdx === 0) continue;

        const c0TextTrim = (cells[0]?.text || '').trim();
        const isS8OelExplanationRow = secNum === 8 && /^(?:工作场所.*控制参数|Workplace\s+component\s+control\s+parameters)/i.test(c0TextTrim);
        const isS8OelHeaderRow = secNum === 8 && cells.length >= 3 && /^(?:物质|Substance)$/i.test(c0TextTrim);
        const isS8OelDataRow = secNum === 8 && cells.length >= 3 && !isS8OelExplanationRow && !isS8OelHeaderRow && !/^(?:8\.\d|控制参数|Control\s*parameters|暴露控制|Exposure)/i.test(c0TextTrim);
        const isLabelCol = (cIdx === 0 && cells.length >= 2 && !isS8OelDataRow && !isS8OelExplanationRow);
        if (isS8OelExplanationRow || (isS8OelDataRow && cIdx === 0)) {
          Array.from(cell.node.getElementsByTagNameNS(W_NS, 'b')).forEach(b => b.parentNode?.removeChild(b));
          Array.from(cell.node.getElementsByTagNameNS(W_NS, 'bCs')).forEach(b => b.parentNode?.removeChild(b));
        }
        // S8 OEL 表头与数据行全格垂直+水平居中；工作场所组分控制参数说明行左对齐+垂直居中
        if (isS8OelHeaderRow || isS8OelDataRow || isS8OelExplanationRow) {
          let tcPr = cell.node.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
          if (!tcPr) {
            tcPr = doc.createElementNS(W_NS, 'w:tcPr');
            cell.node.insertBefore(tcPr, cell.node.firstChild);
          }
          let vAlignEl = tcPr.getElementsByTagNameNS(W_NS, 'vAlign')?.[0];
          if (!vAlignEl) {
            vAlignEl = doc.createElementNS(W_NS, 'w:vAlign');
            tcPr.appendChild(vAlignEl);
          }
          vAlignEl.setAttributeNS(W_NS, 'w:val', 'center');
          const targetJc = isS8OelExplanationRow ? 'left' : 'center';
          for (const pNode of Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'))) {
            let pPr = pNode.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
            if (!pPr) {
              pPr = doc.createElementNS(W_NS, 'w:pPr');
              pNode.insertBefore(pPr, pNode.firstChild);
            }
            let jcEl = pPr.getElementsByTagNameNS(W_NS, 'jc')?.[0];
            if (!jcEl) {
              jcEl = doc.createElementNS(W_NS, 'w:jc');
              pPr.appendChild(jcEl);
            }
            jcEl.setAttributeNS(W_NS, 'w:val', targetJc);
            if (targetJc === 'center') {
              clearParagraphIndent(pPr);
            }
          }
        }
        const rawCellText = (cell.text || '').trim();

        // A. 结构性子题头强制加粗判定
        const mustBoldCell = isLabelCol && (
          /^(?:8\.1\b|控制参数|Control\s*parameters|暴露控制|Exposure\s*controls|手部防护|Hand\s*protection|其它的规定|其它规定|Other\s*provisions|符合下列法规|Complies\s*with\s*the\s*following|处理方法|Disposal\s*methods)/i.test(rawCellText)
        );
        const mustBoldSingleCol = (cells.length === 1) && (
          /^(?:其它的规定|其它规定|Other\s*provisions|符合下列法规|Complies\s*with\s*the\s*following|8\.1\b|控制参数|Control\s*parameters|暴露控制|Exposure\s*controls|手部防护|Hand\s*protection)/i.test(rawCellText)
        );

        // B. 编号标签单 <w:tab/> 间隔与 420/560 dxa 悬挂缩进规范化 (跳过 Section 9 已有激光垂线专职处理；覆盖 1-col 与 2-col 编号标签如 S8 8.1/8.2)
        let formattedFirstP = null;
        if (cIdx === 0 && secNum !== 9 && !isS8OelDataRow && !isS8OelExplanationRow) {
          const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
          const firstP = ps[0];
          const pText = (firstP?.textContent || '').replace(/\u00A0/g, ' ').trim();
          const seqMatch = pText.match(/^(\d+\.\d+)[\s\t]*(.+)$/);
          if (firstP && seqMatch) {
            const seqStr = seqMatch[1];
            const labelBody = seqMatch[2].trim();
            let pPr = firstP.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
            if (!pPr) {
              pPr = doc.createElementNS(W_NS, 'w:pPr');
              firstP.insertBefore(pPr, firstP.firstChild);
            }
            const oldTabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
            oldTabs.forEach(n => pPr.removeChild(n));

            let indEl = pPr.getElementsByTagNameNS(W_NS, 'ind')?.[0];
            if (!indEl) {
              indEl = doc.createElementNS(W_NS, 'w:ind');
              pPr.appendChild(indEl);
            }
            setWAttr(indEl, 'left', targetTabDxa);
            setWAttr(indEl, 'hanging', targetTabDxa);
            ['firstLine', 'leftChars', 'hangingChars', 'firstLineChars'].forEach(attr => {
              if (indEl.hasAttributeNS(W_NS, attr)) indEl.removeAttributeNS(W_NS, attr);
              if (indEl.hasAttribute(`w:${attr}`)) indEl.removeAttribute(`w:${attr}`);
            });

            const seqStyle = GLOBAL_ROLE_STYLE_TOKENS.getRoleSpec('SEQ_NUM', profile);
            const lblStyle = GLOBAL_ROLE_STYLE_TOKENS.getRoleSpec('LABEL', profile);

            const oldRuns = Array.from(firstP.getElementsByTagNameNS(W_NS, 'r'));
            oldRuns.forEach(r => firstP.removeChild(r));

            const seqRun = doc.createElementNS(W_NS, 'w:r');
            const seqT = doc.createElementNS(W_NS, 'w:t');
            seqT.textContent = seqStr;
            seqRun.appendChild(seqT);
            seqRun.appendChild(doc.createElementNS(W_NS, 'w:tab'));
            setRunStyleNodes(doc, seqRun, seqStyle);

            const bodyRun = doc.createElementNS(W_NS, 'w:r');
            const bodyT = doc.createElementNS(W_NS, 'w:t');
            bodyT.setAttribute('xml:space', 'preserve');
            bodyT.textContent = labelBody;
            bodyRun.appendChild(bodyT);
            setRunStyleNodes(doc, bodyRun, lblStyle);

            firstP.appendChild(seqRun);
            firstP.appendChild(bodyRun);
            formattedFirstP = firstP;

            // @FIX_TAG(2026-11-23/template-editor/FIX-EN-MULTIP-INDENT): 模板标签格若拆成多段 <w:p> (如 EN 5.1/5.2/5.3/6.1/12.2)，续行段落强制左缩进对齐正文首字 (420/560 dxa)，绝不挂在序号下
            for (let pi = 1; pi < ps.length; pi++) {
              const contP = ps[pi];
              let cpPr = contP.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
              if (!cpPr) {
                cpPr = doc.createElementNS(W_NS, 'w:pPr');
                contP.insertBefore(cpPr, contP.firstChild);
              }
              let cInd = cpPr.getElementsByTagNameNS(W_NS, 'ind')?.[0];
              if (!cInd) {
                cInd = doc.createElementNS(W_NS, 'w:ind');
                cpPr.appendChild(cInd);
              }
              setWAttr(cInd, 'left', targetTabDxa);
              ['hanging', 'firstLine', 'leftChars', 'hangingChars', 'firstLineChars'].forEach(attr => {
                if (cInd.hasAttributeNS(W_NS, attr)) cInd.removeAttributeNS(W_NS, attr);
                if (cInd.hasAttribute(`w:${attr}`)) cInd.removeAttribute(`w:${attr}`);
              });
            }
          } else if (firstP && (
            (isLabelCol && secNum !== 3)
            || (secNum === 8 && cells.length === 1 && !isS8OelExplanationRow && !/^\d+\.\d+/.test(rawCellText) && (/[：:]$/.test(rawCellText) || /^(?:手部防护|呼吸系统防护|眼睛防护|身体防护|建议|氟化橡胶|丁基橡胶|丁腈橡胶|Hand protection|Respiratory protection|Eye protection|Body protection|Recommendation|Fluoroelastomer|Butyl rubber|Nitrile rubber)/i.test(rawCellText)))
          )) {
            // 通用未编号标签（覆盖 S1 中文名称/化学品分类/供应商信息、S8 防护子标签/手套明细、S13 处理方法等）：
            // 统一注入同基线 w:left (420/560 dxa)，物理清除 hanging/firstLine/*Chars 锯齿，实现首字与带序号标签 100% 垂直齐平
            let pPr = firstP.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
            if (!pPr) {
              pPr = doc.createElementNS(W_NS, 'w:pPr');
              firstP.insertBefore(pPr, firstP.firstChild);
            }
            let indEl = pPr.getElementsByTagNameNS(W_NS, 'ind')?.[0];
            if (!indEl) {
              indEl = doc.createElementNS(W_NS, 'w:ind');
              pPr.appendChild(indEl);
            }
            setWAttr(indEl, 'left', targetTabDxa);
            ['hanging', 'firstLine', 'leftChars', 'hangingChars', 'firstLineChars'].forEach(attr => {
              if (indEl.hasAttributeNS(W_NS, attr)) indEl.removeAttributeNS(W_NS, attr);
              if (indEl.hasAttribute(`w:${attr}`)) indEl.removeAttribute(`w:${attr}`);
            });
          }
        }

        // C. 全局字体与字阶锁 (依据 typographyProfile 严格投影；跳过已重构的 formattedFirstP 的 Run)
        const psAll = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
        const targetSz = (cIdx === 0) ? profile.labelFontSize : profile.valueFontSize;
        for (const p of psAll) {
          let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
          if (!pPr) {
            pPr = doc.createElementNS(W_NS, 'w:pPr');
            p.insertBefore(pPr, p.firstChild);
          }
          // @FIX_TAG(2026-11-23/template-editor/FIX-NO-JUSTIFY-BOTH): 全篇表体段落禁用 both/distribute 两端对齐，未显式居中者统一注入 jc=left（保留 S3 3列成分表与 S8 OEL 表居中对齐，并清除居中格残留 w:ind）
          let jcEl = pPr.getElementsByTagNameNS(W_NS, 'jc')?.[0];
          const curJc = jcEl ? (jcEl.getAttributeNS(W_NS, 'val') || jcEl.getAttribute('w:val')) : null;
          const isS3ParentRow = secNum === 3 && /^(?:3\.2[\s\t]*)?(?:成分|Ingredients)(?:\b|$)/i.test(rawCellText);
          if (secNum === 3 && cells.length >= 3 && !isS3ParentRow) {
            setCellVerticalCenter(cell.node, doc);
            if (!jcEl) {
              jcEl = doc.createElementNS(W_NS, 'w:jc');
              pPr.appendChild(jcEl);
            }
            setWAttr(jcEl, 'val', 'center');
            clearParagraphIndent(pPr);
          } else {
            if (isS3ParentRow || !curJc || curJc === 'both' || curJc === 'distribute') {
              if (!jcEl) {
                jcEl = doc.createElementNS(W_NS, 'w:jc');
                pPr.appendChild(jcEl);
              }
              setWAttr(jcEl, 'val', 'left');
            } else if (curJc === 'center') {
              clearParagraphIndent(pPr);
            }
          }
          const pRPr = pPr.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
          if (pRPr) {
            const pSzs = Array.from(pRPr.getElementsByTagNameNS(W_NS, 'sz'));
            for (const psNode of pSzs) psNode.setAttributeNS(W_NS, 'w:val', String(targetSz));
            const pSzCss = Array.from(pRPr.getElementsByTagNameNS(W_NS, 'szCs'));
            for (const pscNode of pSzCss) pscNode.setAttributeNS(W_NS, 'w:val', String(targetSz));
          }
          if (p === formattedFirstP) continue;
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          const isValueCol = (cIdx >= 1 && cells.length === 2);
          const roleBold = (isLabelCol && secNum !== 3) || mustBoldCell || mustBoldSingleCol
            ? true
            : (isValueCol ? false : undefined);
          for (const r of runs) {
            setRunStyleNodes(doc, r, {
              fontFamily: profile.fontFamily,
              fontSize: targetSz,
              bold: roleBold
            });
          }
          // 通用化学分子式上下标富文本渲染 (CO2, H2O, NO2, SO2, cm3 等，确保中英文双语一致)
          const pRunsNow = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          for (const rNode of pRunsNow) {
            const rPrNode = rNode.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
            if (rPrNode?.getElementsByTagNameNS(W_NS, 'vertAlign')?.[0]) continue;
            const tNodes = Array.from(rNode.getElementsByTagNameNS(W_NS, 't'));
            if (tNodes.length !== 1) continue;
            const rawT = tNodes[0].textContent || '';
            const chemRe = /\b(CO|H|NO|SO)(2)\b|\b(H)(2)(O)\b|\b(LD|LC)(50)\b|(cm|m)(³)|\b(cm|m)(3)\b/g;
            if (!chemRe.test(rawT)) continue;
            chemRe.lastIndex = 0;
            const parts = [];
            let cursor = 0;
            let m;
            while ((m = chemRe.exec(rawT)) !== null) {
              if (m.index > cursor) parts.push({ txt: rawT.slice(cursor, m.index), va: null });
              if (m[1]) {
                parts.push({ txt: m[1], va: null }, { txt: m[2], va: 'subscript' });
              } else if (m[3]) {
                parts.push({ txt: m[3], va: null }, { txt: m[4], va: 'subscript' }, { txt: m[5], va: null });
              } else if (m[6]) {
                parts.push({ txt: m[6], va: null }, { txt: m[7], va: 'subscript' });
              } else if (m[8]) {
                parts.push({ txt: m[8], va: null }, { txt: '3', va: 'superscript' });
              } else if (m[10]) {
                parts.push({ txt: m[10], va: null }, { txt: m[11], va: 'superscript' });
              }
              cursor = m.index + m[0].length;
            }
            if (cursor < rawT.length) parts.push({ txt: rawT.slice(cursor), va: null });
            if (parts.length > 1) {
              for (const part of parts) {
                const cloneR = doc.createElementNS(W_NS, 'w:r');
                const cloneT = doc.createElementNS(W_NS, 'w:t');
                cloneT.setAttribute('xml:space', 'preserve');
                cloneT.textContent = part.txt;
                cloneR.appendChild(cloneT);
                setRunStyleNodes(doc, cloneR, {
                  fontFamily: profile.fontFamily,
                  fontSize: targetSz,
                  bold: roleBold
                });
                if (part.va) {
                  let crPr = cloneR.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
                  if (!crPr) {
                    crPr = doc.createElementNS(W_NS, 'w:rPr');
                    cloneR.insertBefore(crPr, cloneR.firstChild);
                  }
                  const vaEl = doc.createElementNS(W_NS, 'w:vertAlign');
                  vaEl.setAttributeNS(W_NS, 'w:val', part.va);
                  crPr.appendChild(vaEl);
                }
                p.insertBefore(cloneR, rNode);
              }
              p.removeChild(rNode);
            }
          }
        }
      }
    }
    session.modifiedSections.add(secNum);
  }

  // 英文版页脚防超宽折行：将 4984/4984 均分网格调整为 7100/2868 dxa，左格字号统一为 sz=18 (9pt)，确保公司全称+型号单行不折行
  if (isEn && session.engine?.supportingXml) {
    for (const [partName, xmlText] of Object.entries(session.engine.supportingXml)) {
      if (!/^word\/footer\d+\.xml$/.test(partName) || !xmlText || !xmlText.includes('4984')) continue;
      let ftrXml = xmlText
        .replace(/<w:gridCol\s+w:w="4984"\s*\/>\s*<w:gridCol\s+w:w="4984"\s*\/>/g, '<w:gridCol w:w="7100"/><w:gridCol w:w="2868"/>')
        .replace(/(<w:tr\b[\s\S]*?<w:tc\b[\s\S]*?<w:tcW\s+w:w=")4984("[\s\S]*?<\/w:tc>\s*<w:tc\b[\s\S]*?<w:tcW\s+w:w=")4984(")/g, '$17100$22868$3')
        .replace(/(<w:sz(?:Cs)?\s+w:val=")21(")/g, '$118$2');
      session.engine.supportingXml[partName] = ftrXml;
    }
  }

  return { success: true, profile };
}
