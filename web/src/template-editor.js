import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import {
  loadDocx,
  writeCellValue,
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
import { applyGlobalTypographyProjection } from './universal-editor-primitives.js';
import { enforceStructuralTypographyInvariants } from './pipeline-engine.js';

export const TEMPLATE_LIBRARY = {
  CN_Guanzhi: {
    key: 'CN_Guanzhi',
    name: '正式模板_MSDS_CN_冠志',
    language: 'zh',
    company: 'Guanzhi',
    templatePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx'
  },
  EN_Guanzhi: {
    key: 'EN_Guanzhi',
    name: '正式模板_MSDS_EN_冠志',
    language: 'en',
    company: 'Guanzhi',
    templatePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx'
  },
  CN_Guocai: {
    key: 'CN_Guocai',
    name: '正式模板_MSDS_CN_国彩',
    language: 'zh',
    company: 'Guocai',
    templatePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx'
  },
  EN_Guocai: {
    key: 'EN_Guocai',
    name: '正式模板_MSDS_EN_国彩',
    language: 'en',
    company: 'Guocai',
    templatePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx'
  },
  PA_Benchmark_CN: {
    key: 'PA_Benchmark_CN',
    name: '正式模板_MSDS_CN_PA基准',
    language: 'zh',
    company: 'Guanzhi',
    templatePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx'
  },
  PA_Benchmark_EN: {
    key: 'PA_Benchmark_EN',
    name: '正式模板_MSDS_EN_PA基准',
    language: 'en',
    company: 'Guanzhi',
    templatePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx'
  }
};

const COMPANY_PRESETS = {
  Guanzhi_zh: {
    name: '广州冠志新材料科技有限公司',
    shortName: '冠志',
    address: '广州市萝岗区科学城掬泉路3号广州国际企业孵化器A区1106室',
    tel: '86-20-82567990',
    fax: '86-20-32214789'
  },
  Guocai_zh: {
    name: '英德市国彩精细化工有限公司',
    shortName: '国彩',
    address: '广东省英德市白沙镇太平村更古坑凯迪工业园区',
    tel: '86-763-2811205',
    fax: '86-763-2811024'
  },
  Guanzhi_en: {
    name: 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
    shortName: 'Guanzhi',
    address: 'Room 1106, Area A, Guangzhou International Enterprise Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou',
    tel: '86-20-82567990',
    fax: '86-20-32214789'
  },
  Guocai_en: {
    name: 'Yingde Guocai New Material Co., Ltd.',
    shortName: 'Guocai',
    address: 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde City, Guangdong Province',
    tel: '86-763-2811205',
    fax: '86-763-2811024'
  }
};

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

    const rowsInfo = (record.rows || []).map((row, rIdx) => ({
      rowIndex: rIdx,
      cellsCount: row.cells.length,
      cells: row.cells.map((cell, cIdx) => ({
        cellIndex: cIdx,
        text: (cell.text || '').trim(),
        isLabel: cIdx === 0,
        gridSpan: Number(cell.node?.getAttributeNS?.(W_NS, 'gridSpan') || cell.node?.getAttribute?.('w:gridSpan') || '1')
      }))
    }));

    sectionsSchema[secNum] = {
      sectionNumber: secNum,
      title: record.title || '',
      columnCount: gridCols.length || (record.rows?.[0]?.cells?.length || 2),
      gridWidthsTwips: gridWidths,
      rowsCount: record.rows?.length || 0,
      rows: rowsInfo
    };
  }

  return {
    templateKey: tplInfo.key,
    name: tplInfo.name,
    language: tplInfo.language,
    company: tplInfo.company,
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
export async function createWorkSession(templateKey = 'CN_Guanzhi', workingDir = null) {
  let tplInfo;
  if (typeof templateKey === 'string' && fs.existsSync(templateKey)) {
    const isEn = /_EN|English/i.test(templateKey);
    const isGc = /国彩|Guocai/i.test(templateKey);
    tplInfo = {
      key: 'custom_path',
      name: path.basename(templateKey, '.docx'),
      language: isEn ? 'en' : 'zh',
      company: isGc ? 'Guocai' : 'Guanzhi',
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
    modifiedSections: new Set(),
    checkpoints: new Map()
  };

  if (tplInfo.company === 'Guocai') {
    applyCompanyPreset(session, tplInfo.language === 'en' ? 'Guocai_en' : 'Guocai_zh');
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
export function writeCellValueToSession(session, { sectionNumber, rowIndex, cellIndex, text }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found in session document`);

  const row = record.rows?.[rowIndex];
  if (!row) throw new Error(`Row ${rowIndex} not found in Section ${sectionNumber}`);

  const cell = row.cells?.[cellIndex];
  if (!cell) throw new Error(`Cell ${cellIndex} not found in Section ${sectionNumber} Row ${rowIndex}`);

  writeCellValue(cell, text, {
    bold: false,
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

  renderFullWidthRow(record, 1, content, {
    isEnglish: session.isEnglish,
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
export function applyCompanyPreset(session, presetKey) {
  let preset = COMPANY_PRESETS[presetKey];
  if (!preset) {
    if (typeof presetKey === 'object' && presetKey !== null) {
      preset = presetKey;
    } else if (typeof presetKey === 'string') {
      const isEn = session.templateKey?.includes('EN') || session.templateKey?.includes('en');
      const langSuffix = isEn ? '_en' : '_zh';
      const cleanKey = presetKey.toLowerCase();
      if (cleanKey.includes('guanzhi')) {
        preset = COMPANY_PRESETS[`Guanzhi${langSuffix}`];
      } else if (cleanKey.includes('guocai')) {
        preset = COMPANY_PRESETS[`Guocai${langSuffix}`];
      }
    }
  }
  if (!preset) return { success: false, reason: `Unknown preset: ${presetKey}` };

  const s1 = (session.engine.records || []).find(r => r.sectionNumber === 1);
  if (s1) {
    for (const row of s1.rows || []) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (/供应商名称|Company\s*name|Manufacturer|Name\s*of\s*supplier/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.name);
      } else if (/供应商地址|Address/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.address);
      } else if (/应急电话|Emergency\s*telephone|Emergency\s*phone/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.emergencyPhone || preset.tel);
      } else if (/电话|Telephone|Phone|\bTel\b/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.tel);
      } else if (/传真|Fax/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.fax);
      }
    }
  }

  stampDocumentIdentity(session.engine, { companyName: preset.name, shortName: preset.shortName });
  updateHeaderFooterData(session.engine, { company: preset.name });
  return { success: true, presetKey };
}

/**
 * 保存工作会话到文件 (Save Session)
 */
export async function saveSession(session, outputPath) {
  suppressOversizedRowHeights(session.engine);
  suppressTrailingDocumentParagraph(session.engine);
  enableCrossPageBreaksForAllSections(session.engine);
  healAllTableTopologies(session.engine.documentXml);

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

  const targetIndent = maxDigits >= 4 ? '560' : '420';

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
    for (let cIdx = 1; cIdx < (row.cells || []).length; cIdx++) {
      const cell = row.cells[cIdx];
      if (!cell?.node) continue;

      const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
      for (const p of ps) {
        const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
        if (pPr) {
          const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')?.[0];
          if (ind) {
            pPr.removeChild(ind);
          }
          const tabsNodes = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
          tabsNodes.forEach(n => pPr.removeChild(n));
        }

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
