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
  enableCrossPageBreaksForAllSections,
  healAllTableTopologies,
  stampDocumentIdentity,
  updateHeaderFooterData,
  W_NS
} from './docx-engine.js';

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
    name: 'Yingde Guocai Fine Chemical Co., Ltd.',
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
      'saveSession'
    ]
  };
}

/**
 * 创建独立工作会话 (Create Isolated Work Session)
 */
export async function createWorkSession(templateKey = 'CN_Guanzhi', workingDir = null) {
  const tplInfo = TEMPLATE_LIBRARY[templateKey] || TEMPLATE_LIBRARY.CN_Guanzhi;
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

  return {
    sectionNumber,
    rowIndex,
    cellIndex,
    text: cell.text || '',
    bold: cell.bold,
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
  if (!row) throw new Error(`Row ${rowIndex} not found`);
  const cell = row.cells?.[cellIndex];
  if (!cell) throw new Error(`Cell ${cellIndex} not found`);

  let finalRuns = runs;
  if (chemicalFormula) {
    finalRuns = parseChemicalFormulaRuns(chemicalFormula, {
      fontFamily: session.isEnglish ? 'Arial' : '宋体',
      fontSizePt: session.isEnglish ? 9.5 : 12,
      bold: false
    });
  }

  writeRichTextToCell(cell, finalRuns || [], options);
  session.engine.refresh();
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, rowIndex, cellIndex };
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
 */
export function formatSection9LaserTabs(session) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === 9);
  if (!record) return { success: false, reason: 'Section 9 not found' };

  for (let i = 1; i < (record.rows?.length || 0); i++) {
    const row = record.rows[i];
    const cell = row.cells?.[0];
    if (cell) {
      const txt = (cell.text || '').trim();
      const numMatch = txt.match(/^(?:9\.)?(\d+)/);
      if (numMatch) {
        const numStr = `9.${numMatch[1]}`;
        const labelText = txt.replace(/^(?:9\.)?\d+[\s\t:：]*/, '').replace(/[:：]$/, '');
        formatSection9LabelCell(cell, numStr, labelText, session.isEnglish);
      }
    }
  }

  session.modifiedSections.add(9);
  return { success: true };
}

/**
 * 结构安全删行 (Delete Row)
 */
export function deleteRowFromSession(session, { sectionNumber, rowIndex }) {
  const record = (session.engine.records || []).find(r => r.sectionNumber === sectionNumber);
  if (!record) throw new Error(`Section ${sectionNumber} not found`);

  deleteDocxRow(session.engine, record, rowIndex);
  session.modifiedSections.add(sectionNumber);
  return { success: true, sectionNumber, rowIndex };
}

/**
 * 企业预设注入 (Apply Company Preset)
 */
export function applyCompanyPreset(session, presetKey) {
  const preset = COMPANY_PRESETS[presetKey];
  if (!preset) return { success: false, reason: `Unknown preset: ${presetKey}` };

  const s1 = (session.engine.records || []).find(r => r.sectionNumber === 1);
  if (s1) {
    for (const row of s1.rows || []) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (/供应商名称|Company name|Manufacturer/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.name);
      } else if (/供应商地址|Address/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.address);
      } else if (/电话|Telephone|Phone/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.tel);
      } else if (/传真|Fax/i.test(lbl)) {
        writeCellValue(row.cells[1], preset.fax);
      }
    }
  }

  stampDocumentIdentity(session.engine, { companyName: preset.name, shortName: preset.shortName });
  updateHeaderFooterData(session.engine, { companyName: preset.name });
  return { success: true, presetKey };
}

/**
 * 保存工作会话到文件 (Save Session)
 */
export async function saveSession(session, outputPath) {
  suppressOversizedRowHeights(session.engine);
  enableCrossPageBreaksForAllSections(session.engine);
  healAllTableTopologies(session.engine.documentXml);

  const arrayBuf = await session.engine.exportArrayBuffer();
  const outBuf = Buffer.from(arrayBuf);

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outputPath, outBuf);
  return {
    success: true,
    outputPath,
    sizeBytes: outBuf.length
  };
}
