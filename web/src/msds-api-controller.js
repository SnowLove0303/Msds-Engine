import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadDocx } from './docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './smart-matching.js';
import JSZip from 'jszip';
import {
  createBatch,
  listBatches,
  saveRecord,
  getRecords,
  getRecordById,
  deleteRecord,
  getDocxBuffer,
  updateRecordMatch,
  updateRecordAnnotations,
  getRepoStats,
  serializeMatchResult,
  listPresets,
  getPresetById,
  savePreset,
  deletePreset,
} from './msds-db.js';
import {
  applyPresetPriorityOverlay,
  buildExportDocxName,
  renumberRecord,
  applySemanticOverrides,
  findCellBySemanticKey,
  writeCellValue,
  updateHeaderFooterData,
  harmonizeTableLabels,
  suppressOversizedRowHeights,
} from './docx-engine.js';

function tableRecords(engine) {
  return (engine?.records || []).filter((r) => r.kind === 'table');
}
import {
  convertDocxToPdf,
  convertBatchDocxToPdf,
  getPdfCapability,
} from './pdf-converter.js';
import {
  ENTITY_MATRIX,
  buildEnglishFacts,
  buildBaseChineseEngine,
  buildBaseEnglishEngine,
  derivePresetEngines,
  batchExportDeliverables,
  executeEightDeliverablesPipeline
} from './pipeline-engine.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

/**
 * PDF 导出预检：在生成任何文件之前判定转换能力，并决定"快速失败"或"降级为仅 Word"。
 * - format='pdf'  且能力不可用 → blocked（不产生任何半成品）
 * - format='both' 且能力不可用 → pdfOmitted（继续交付 Word，并在响应中标注缺失原因）
 * @param {string} format 'docx' | 'pdf' | 'both'
 */
function evaluatePdfPreflight(format) {
  const needsPdf = format === 'pdf' || format === 'both';
  if (!needsPdf) return { needsPdf: false, capability: null, pdfOmitted: null, blocked: null };

  const capability = getPdfCapability();
  if (capability.available) return { needsPdf: true, capability, pdfOmitted: null, blocked: null };

  const remedy = capability.remedy || '请先准备可用的 PDF 转换运行环境';
  if (format === 'pdf') {
    return {
      needsPdf: true,
      capability,
      pdfOmitted: null,
      blocked: {
        status: 503,
        message: `PDF 转换能力不可用，已取消本次导出以避免产生半成品。原因：${capability.reason} 补救方式：${remedy}`,
      },
    };
  }
  return {
    needsPdf: true,
    capability,
    pdfOmitted: {
      reason: capability.reason,
      remedy,
      backend: capability.backend,
      fontsStatus: capability.fontsStatus,
      attempts: capability.attempts,
    },
    blocked: null,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../public/templates');
const APP_VERSION = '1.6.0';

// 内存会话存储池
const sessions = new Map();

// ==========================================
// 协同草稿内存存储池与辅助函数
// ==========================================
const editorDrafts = new Map();

export function getEditorDraft(id) {
  return editorDrafts.get(id) || null;
}

export function listEditorDrafts() {
  return Array.from(editorDrafts.values()).map((d) => ({
    draftId: d.draftId,
    model: d.model,
    baselineId: d.baselineId,
    fieldsCount: d.fieldsCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

function resolveTemplateByBaseline(baselineId = 'baseline_cn_guanzhi') {
  const norm = String(baselineId || '').toLowerCase();
  if (norm.includes('en_guocai') || norm.includes('guocai_en')) {
    return path.join(TEMPLATES_DIR, '正式模板_MSDS_EN_国彩(1).docx');
  }
  if (norm.includes('en')) {
    return path.join(TEMPLATES_DIR, '正式模板_MSDS_EN_冠志(1).docx');
  }
  if (norm.includes('cn_guocai') || norm.includes('guocai_cn') || norm.includes('guocai')) {
    return path.join(TEMPLATES_DIR, '正式模板_MSDS_CN_国彩(1).docx');
  }
  return path.join(TEMPLATES_DIR, '正式模板_MSDS_CN_冠志(1).docx');
}

function findCellInEngine(engine, key) {
  if (!engine?.records || !key) return null;
  const k = String(key).trim();
  let cell = findCellBySemanticKey(engine, k);
  if (cell) return cell;
  if (!k.startsWith('sec')) {
    cell = findCellBySemanticKey(engine, `sec${k}`);
    if (cell) return cell;
  }
  const numMatch = k.match(/^(d+).(d+)$/);
  if (numMatch) {
    const secNum = parseInt(numMatch[1], 10);
    const itemNum = numMatch[2];
    const prefixRegex = new RegExp(`^\\s*${secNum}\\.${itemNum}\\b`);
    const records = engine.records.filter((r) => r.sectionNumber === secNum && Array.isArray(r.rows));
    for (const record of records) {
      for (const row of record.rows) {
        const labelCell = row.cells.find((c) => c.role === 'label' || c.isLabel) || row.cells[0];
        const labelText = (labelCell?.labelText || labelCell?.text || '').trim();
        if (prefixRegex.test(labelText)) {
          const valCell = row.cells.find((c) => c.editable);
          if (valCell) return valCell;
        }
      }
    }
  }
  for (const record of engine.records) {
    if (!Array.isArray(record.rows)) continue;
    for (const row of record.rows) {
      const labelCell = row.cells.find((c) => c.role === 'label' || c.isLabel) || row.cells[0];
      const labelText = (labelCell?.labelText || labelCell?.text || '').trim();
      if (labelText && labelText.includes(k)) {
        const valCell = row.cells.find((c) => c.editable);
        if (valCell) return valCell;
      }
    }
  }
  return null;
}

function getOrCreateSession(sessionId = 'default') {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      sourceEngine: null,
      matchResult: null,
      editorEngine: null,
      templateVariant: 'CN_GUANZHI',
      baseCnEngine: null,
      baseEnEngine: null,
      presetEngines: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  return sessions.get(sessionId);
}

function resolveTemplatePath(variant = 'CN_GUANZHI') {
  const norm = String(variant || '').toUpperCase();
  if (norm.includes('EN')) {
    return path.join(TEMPLATES_DIR, '正式模板_MSDS_EN_冠志(1).docx');
  }
  return path.join(TEMPLATES_DIR, '正式模板_MSDS_CN_冠志(1).docx');
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100 * 1024 * 1024) {
        reject(new Error('请求体过大（上限 100MB）'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error(`无效的 JSON 格式: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  if (res.headersSent) {
    try { res.end(); } catch {}
    return;
  }
  let jsonStr;
  try {
    jsonStr = JSON.stringify(data);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ success: false, error: { message: `JSON 序列化失败: ${err.message}` } }));
    }
    return;
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });
  res.end(jsonStr);
}

// 递归扫描目录中的 DOCX 文件
function scanDocxFiles(dirPath, fileList = []) {
  if (!fsSync.existsSync(dirPath)) return fileList;
  const entries = fsSync.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanDocxFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.docx') && !entry.name.startsWith('~$')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export async function handleApiRequest(req, res) {
  // CORS 预检请求直接通过
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    });
    res.end();
    return true;
  }

  const parsedUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  if (!pathname.startsWith('/api/msds')) {
    return false;
  }

  try {
    // ==========================================
    // 0. 智能匹配记录库 (Repo & Database API)
    // ==========================================

    // 0.1 GET /api/msds/repo/stats - 获取记录库统计指标
    if (pathname === '/api/msds/repo/stats' && req.method === 'GET') {
      const stats = getRepoStats();
      sendJson(res, 200, { success: true, data: stats });
      return true;
    }

    // 0.2 GET /api/msds/repo/batches - 获取全部批次列表
    if (pathname === '/api/msds/repo/batches' && req.method === 'GET') {
      const batches = listBatches();
      sendJson(res, 200, { success: true, data: batches });
      return true;
    }

    // 0.3 POST /api/msds/repo/batch/create - 创建新批次
    if (pathname === '/api/msds/repo/batch/create' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const b = createBatch(body);
      sendJson(res, 200, { success: true, data: b });
      return true;
    }

    // 0.4 GET /api/msds/repo/records - 检索记录库列表 (支持 batchId, status, query 分页)
    if (pathname === '/api/msds/repo/records' && req.method === 'GET') {
      const batchId = searchParams.get('batchId') || 'all';
      const status = searchParams.get('status') || 'all';
      const query = searchParams.get('query') || '';
      const limit = Number(searchParams.get('limit') || 100);
      const offset = Number(searchParams.get('offset') || 0);

      const result = getRecords({ batchId, status, query, limit, offset });
      sendJson(res, 200, { success: true, data: result });
      return true;
    }

    // 0.5 GET /api/msds/repo/records/:id - 获取单个记录完整数据
    const recordDetailMatch = pathname.match(/^\/api\/msds\/repo\/records\/([^\/]+)$/);
    if (recordDetailMatch && req.method === 'GET') {
      const recId = decodeURIComponent(recordDetailMatch[1]);
      const record = getRecordById(recId);
      if (!record) {
        sendJson(res, 404, { success: false, error: { message: `未找到 ID 为 ${recId} 的匹配记录` } });
        return true;
      }
      sendJson(res, 200, { success: true, data: record });
      return true;
    }

    // 0.6 GET /api/msds/repo/records/:id/docx - 获取原始 DOCX 二进制
    const recordDocxMatch = pathname.match(/^\/api\/msds\/repo\/records\/([^\/]+)\/docx$/);
    if (recordDocxMatch && req.method === 'GET') {
      const recId = decodeURIComponent(recordDocxMatch[1]);
      const record = getRecordById(recId);
      if (!record) {
        sendJson(res, 404, { success: false, error: { message: `未找到记录 ${recId}` } });
        return true;
      }
      const buffer = getDocxBuffer(recId);
      if (!buffer) {
        sendJson(res, 404, { success: false, error: { message: `未找到记录 ${recId} 的 DOCX 二进制文件` } });
        return true;
      }
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': buffer.length,
        'Content-Disposition': `inline; filename="${encodeURIComponent(record.file_name || 'document.docx')}"`,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(buffer);
      return true;
    }

    // 0.7 DELETE /api/msds/repo/records/:id - 删除指定记录
    if (recordDetailMatch && req.method === 'DELETE') {
      const recId = decodeURIComponent(recordDetailMatch[1]);
      deleteRecord(recId);
      sendJson(res, 200, { success: true, id: recId });
      return true;
    }

    // 0.8 POST /api/msds/repo/records/:id/rematch - 单条记录使用最新算法重新匹配
    const recordRematchMatch = pathname.match(/^\/api\/msds\/repo\/records\/([^\/]+)\/rematch$/);
    if (recordRematchMatch && req.method === 'POST') {
      const recId = decodeURIComponent(recordRematchMatch[1]);
      const record = getRecordById(recId);
      if (!record) {
        sendJson(res, 404, { success: false, error: { message: `未找到记录 ${recId}` } });
        return true;
      }
      const buffer = getDocxBuffer(recId);
      if (!buffer) {
        sendJson(res, 404, { success: false, error: { message: `DOCX 缓存缺失` } });
        return true;
      }

      const doc = await loadDocx(buffer, record.file_name);
      const newMatchRes = runSmartMatching(doc.records);
      const updateRes = updateRecordMatch(recId, newMatchRes, APP_VERSION);

      sendJson(res, 200, {
        success: true,
        data: {
          id: recId,
          oldStatus: record.status,
          newStatus: updateRes.status,
          matchedFields: updateRes.matched,
          conflictFields: updateRes.conflicts,
          unmatchedFields: updateRes.unmatched,
          matchResult: serializeMatchResult(newMatchRes),
        },
      });
      return true;
    }

    // 0.9 POST /api/msds/repo/batch/:batchId/rematch - 批次全量算法回归重跑
    const batchRematchMatch = pathname.match(/^\/api\/msds\/repo\/batch\/([^\/]+)\/rematch$/);
    if (batchRematchMatch && req.method === 'POST') {
      const bId = decodeURIComponent(batchRematchMatch[1]);
      const recs = getRecords({ batchId: bId, limit: 1000 }).records;
      const results = [];

      for (const r of recs) {
        try {
          const buffer = getDocxBuffer(r.id);
          if (!buffer) continue;
          const doc = await loadDocx(buffer, r.file_name);
          const newMatch = runSmartMatching(doc.records);
          const update = updateRecordMatch(r.id, newMatch, APP_VERSION);
          results.push({
            id: r.id,
            fileName: r.file_name,
            oldStatus: r.status,
            newStatus: update.status,
            conflicts: update.conflicts,
            unmatched: update.unmatched,
            success: true,
          });
        } catch (e) {
          results.push({ id: r.id, fileName: r.file_name, success: false, error: e.message });
        }
      }

      sendJson(res, 200, {
        success: true,
        batchId: bId,
        total: recs.length,
        rematched: results.length,
        results,
      });
      return true;
    }

    // 0.10 POST /api/msds/repo/records/:id/annotations - 更新记录的批注列表
    const recordAnnMatch = pathname.match(/^\/api\/msds\/repo\/records\/([^\/]+)\/annotations$/);
    if (recordAnnMatch && req.method === 'POST') {
      const recId = decodeURIComponent(recordAnnMatch[1]);
      const body = await parseJsonBody(req);
      const resAnn = updateRecordAnnotations(recId, body.annotations || []);
      sendJson(res, 200, { success: true, data: resAnn });
      return true;
    }

    // 0.11 POST /api/msds/repo/batch/import - 核心：批量摄入与自动识别匹配存储
    if (pathname === '/api/msds/repo/batch/import' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      let batchId = body.batchId;
      if (!batchId) {
        const created = createBatch({
          batchName: body.batchName || `批量摄入-${new Date().toLocaleString('zh-CN')}`,
          createdBy: body.createdBy || 'api_agent',
        });
        batchId = created.batchId;
      }

      const filesToProcess = [];

      // 1. 本地目录路径扫描摄入
      if (body.dirPath) {
        const scanned = scanDocxFiles(body.dirPath);
        for (const p of scanned) {
          filesToProcess.push({ filePath: p, fileName: path.basename(p) });
        }
      }

      // 2. 本地文件路径数组摄入
      if (Array.isArray(body.filePaths)) {
        for (const p of body.filePaths) {
          if (fsSync.existsSync(p)) {
            filesToProcess.push({ filePath: p, fileName: path.basename(p) });
          }
        }
      }

      // 3. 直接上传 base64 文件流摄入
      if (Array.isArray(body.files)) {
        for (const f of body.files) {
          if (f.contentBase64 && f.fileName) {
            filesToProcess.push({
              fileName: f.fileName,
              buffer: Buffer.from(f.contentBase64, 'base64'),
            });
          }
        }
      }

      if (filesToProcess.length === 0) {
        sendJson(res, 400, { success: false, error: { message: '未找到可处理的 DOCX 文件。请提供 dirPath, filePaths 或 files。' } });
        return true;
      }

      const results = [];
      for (const item of filesToProcess) {
        try {
          let buffer = item.buffer;
          if (!buffer && item.filePath) {
            buffer = fsSync.readFileSync(item.filePath);
          }
          if (!buffer) continue;

          const doc = await loadDocx(buffer, item.fileName);
          const matchRes = runSmartMatching(doc.records);

          const summary = matchRes.summary || {};
          const model = summary.productName || item.fileName.split(/[_\s]/)[0] || '';
          const lang = matchRes.fileNaming?.language || (item.fileName.includes('_EN') ? 'EN' : 'CN');
          const isGuocai = /国彩|Guocai/i.test(item.fileName);
          const entity = isGuocai ? '国彩' : '冠志';
          const tplVariant = body.templateVariant || (lang === 'EN' ? (isGuocai ? 'EN_GUOCAI' : 'EN_GUANZHI') : (isGuocai ? 'CN_GUOCAI' : 'CN_GUANZHI'));

          const recId = `REC-${model || 'MSDS'}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
          const conflicts = summary.reviewAmbiguousFields || 0;
          const unmatched = summary.unmatchedFields || 0;
          const status = conflicts > 0 ? 'HAS_CONFLICTS' : (unmatched > 0 ? 'HAS_UNMATCHED' : 'PERFECT');

          const saved = saveRecord({
            id: recId,
            batchId,
            fileName: item.fileName,
            model,
            language: lang,
            entity,
            templateVariant: tplVariant,
            status,
            matchedFields: summary.matchedFields || 0,
            prunedFields: summary.prunedFields || 0,
            conflictFields: conflicts,
            unmatchedFields: unmatched,
            annotationsCount: 0,
            engineVersion: APP_VERSION,
            rawFactsJson: doc.records,
            matchResultJson: matchRes,
            annotationsJson: [],
            docxBuffer: buffer,
          });

          results.push({
            id: recId,
            fileName: item.fileName,
            model,
            status,
            matchedFields: summary.matchedFields || 0,
            conflictFields: conflicts,
            unmatchedFields: unmatched,
            success: true,
          });
        } catch (e) {
          results.push({
            fileName: item.fileName,
            success: false,
            error: e.message,
          });
        }
      }

      sendJson(res, 200, {
        success: true,
        batchId,
        totalProcessed: filesToProcess.length,
        successCount: results.filter((r) => r.success).length,
        failedCount: results.filter((r) => !r.success).length,
        results,
      });
      return true;
    }

    // ==========================================
    // 0.5 预设库管理与优先级应用 (Presets API)
    // ==========================================

    // 0.5.1 GET /api/msds/presets - 获取全部预设（支持 entity/language/enabled 过滤）
    if (pathname === '/api/msds/presets' && req.method === 'GET') {
      const entity = searchParams.get('entity') || 'all';
      const language = searchParams.get('language') || 'all';
      const enabledOnly = searchParams.get('enabledOnly') === 'true';

      const presets = listPresets({ entity, language, enabledOnly });
      sendJson(res, 200, {
        success: true,
        total: presets.length,
        data: presets,
      });
      return true;
    }

    // 0.5.2 GET /api/msds/presets/:id - 获取指定预设详情
    const presetDetailMatch = pathname.match(/^\/api\/msds\/presets\/([^\/]+)$/);
    if (presetDetailMatch && req.method === 'GET') {
      const presetId = decodeURIComponent(presetDetailMatch[1]);
      const p = getPresetById(presetId);
      if (!p) {
        sendJson(res, 404, { success: false, error: { message: `未找到 ID 为 ${presetId} 的预设` } });
        return true;
      }
      sendJson(res, 200, { success: true, data: p });
      return true;
    }

    // 0.5.3 POST /api/msds/presets - 新建或保存预设
    if (pathname === '/api/msds/presets' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.name) {
        sendJson(res, 400, { success: false, error: { message: '预设名称（name）为必填字段' } });
        return true;
      }
      const saved = savePreset(body);
      sendJson(res, 200, { success: true, data: saved, message: '预设已成功保存' });
      return true;
    }

    // 0.5.4 PUT /api/msds/presets/:id - 更新指定预设
    if (presetDetailMatch && req.method === 'PUT') {
      const presetId = decodeURIComponent(presetDetailMatch[1]);
      const body = await parseJsonBody(req);
      body.id = presetId;
      const updated = savePreset(body);
      sendJson(res, 200, { success: true, data: updated, message: '预设已成功更新' });
      return true;
    }

    // 0.5.5 DELETE /api/msds/presets/:id - 删除指定自定义预设
    if (presetDetailMatch && req.method === 'DELETE') {
      const presetId = decodeURIComponent(presetDetailMatch[1]);
      try {
        const delRes = deletePreset(presetId);
        sendJson(res, 200, { success: true, id: presetId, message: '预设已成功删除' });
      } catch (err) {
        sendJson(res, 400, { success: false, error: { message: err.message } });
      }
      return true;
    }

    // 0.5.6 POST /api/msds/presets/apply - 将指定预设应用至会话（优先级覆盖）
    if (pathname === '/api/msds/presets/apply' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const presetId = body.presetId;

      const session = sessions.get(sessionId);
      if (!session || !session.editorEngine) {
        sendJson(res, 404, { success: false, error: { message: `未找到会话或模板编辑器未就绪: ${sessionId}` } });
        return true;
      }

      let presetObj = body.preset;
      if (!presetObj && presetId) {
        presetObj = getPresetById(presetId);
      }
      if (!presetObj) {
        sendJson(res, 400, { success: false, error: { message: '请提供有效的 presetId 或 preset 对象' } });
        return true;
      }

      // 如果有即时传入的临时覆盖
      if (body.customFieldOverrides) {
        presetObj = {
          ...presetObj,
          fieldOverrides: { ...presetObj.fieldOverrides, ...body.customFieldOverrides },
        };
      }
      if (body.customHeaderFooterOverrides) {
        presetObj = {
          ...presetObj,
          headerFooterOverrides: { ...presetObj.headerFooterOverrides, ...body.customHeaderFooterOverrides },
        };
      }

      // 执行局部优先级覆盖合并
      const appliedCount = applyPresetPriorityOverlay(session.sourceEngine || session.editorEngine, presetObj, session.editorEngine);
      tableRecords(session.editorEngine).forEach((r) => renumberRecord(r));
      session.updatedAt = Date.now();
      session.activePresetId = presetObj.id;

      sendJson(res, 200, {
        success: true,
        sessionId,
        presetId: presetObj.id,
        presetName: presetObj.name,
        appliedFieldsCount: appliedCount,
        message: `预设【${presetObj.name}】已成功覆盖应用`,
      });
      return true;
    }

    // ==========================================
    // 0.6 Agent 与 Web 编辑器协同草稿流 API
    // ==========================================

    // 0.6.1 POST /api/msds/editor/draft - 创建或追加协同草稿
    if (pathname === '/api/msds/editor/draft' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { model, baselineId, fields, facts } = body;

      const tplPath = resolveTemplateByBaseline(baselineId);
      if (!fsSync.existsSync(tplPath)) {
        sendJson(res, 404, { success: false, error: { message: `模板基准文件不存在: ${tplPath}` } });
        return true;
      }

      const tplBuf = await fs.readFile(tplPath);
      const engine = await loadDocx(tplBuf, path.basename(tplPath));

      let modifiedCount = 0;
      if (fields && typeof fields === 'object') {
        for (const [k, v] of Object.entries(fields)) {
          if (v === undefined || v === null) continue;
          const cell = findCellInEngine(engine, k);
          if (cell && cell.editable) {
            writeCellValue(cell, v);
            modifiedCount++;
          }
        }
      }

      // 保持 G-11 字体/字重分离与排版规整
      harmonizeTableLabels(engine);
      suppressOversizedRowHeights(engine);
      if (model) {
        updateHeaderFooterData(engine, { model: String(model).trim() });
      }

      const docxArrayBuffer = await engine.exportArrayBuffer();
      const docxBuffer = Buffer.from(docxArrayBuffer);
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      editorDrafts.set(draftId, {
        draftId,
        model: model || 'PU-Standard',
        baselineId: baselineId || 'baseline_cn_guanzhi',
        engine,
        docxBuffer,
        fieldsCount: modifiedCount,
        facts: facts || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      sendJson(res, 200, {
        success: true,
        data: {
          draftId,
          model: model || 'PU-Standard',
          baselineId: baselineId || 'baseline_cn_guanzhi',
          modifiedFields: modifiedCount,
          createdAt: Date.now(),
        },
      });
      return true;
    }

    // 0.6.2 GET /api/msds/editor/drafts - 获取全部活跃协同草稿摘要
    if (pathname === '/api/msds/editor/drafts' && req.method === 'GET') {
      const list = Array.from(editorDrafts.values()).map((d) => ({
        draftId: d.draftId,
        model: d.model,
        baselineId: d.baselineId,
        fieldsCount: d.fieldsCount,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
      sendJson(res, 200, { success: true, data: list });
      return true;
    }

    // 0.6.3 GET /api/msds/editor/draft/:id/docx - 获取协同草稿 DOCX 二进制
    const draftDocxMatch = pathname.match(/^\/api\/msds\/editor\/draft\/([^\/]+)\/docx$/);
    if (draftDocxMatch && req.method === 'GET') {
      const draftId = decodeURIComponent(draftDocxMatch[1]);
      const draft = editorDrafts.get(draftId);
      if (!draft || !draft.docxBuffer) {
        sendJson(res, 404, { success: false, error: { message: `未找到 ID 为 ${draftId} 的协同草稿` } });
        return true;
      }
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': draft.docxBuffer.length,
        'Content-Disposition': `inline; filename="${encodeURIComponent(draft.draftId + '.docx')}"`,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(draft.docxBuffer);
      return true;
    }

    // 0.6.4 GET /api/msds/editor/draft/:id - 获取指定草稿元数据
    const draftMetaMatch = pathname.match(/^\/api\/msds\/editor\/draft\/([^\/]+)$/);
    if (draftMetaMatch && req.method === 'GET') {
      const draftId = decodeURIComponent(draftMetaMatch[1]);
      const draft = editorDrafts.get(draftId);
      if (!draft) {
        sendJson(res, 404, { success: false, error: { message: `未找到 ID 为 ${draftId} 的协同草稿` } });
        return true;
      }
      sendJson(res, 200, {
        success: true,
        data: {
          draftId: draft.draftId,
          model: draft.model,
          baselineId: draft.baselineId,
          fieldsCount: draft.fieldsCount,
          facts: draft.facts,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        },
      });
      return true;
    }

    // ==========================================
    // 现有单次会话 API 保留 (Backward Compatibility)
    // ==========================================

    // 1. GET /api/msds/health
    if (pathname === '/api/msds/health' && req.method === 'GET') {
      const pdfCapability = getPdfCapability();
      sendJson(res, 200, {
        success: true,
        status: 'UP',
        engineVersion: APP_VERSION,
        activeSessions: sessions.size,
        // 保留既有布尔字段（取值来源改为能力描述，语义不变）
        pdfConverterAvailable: pdfCapability.available,
        // 新增：完整能力详情，用于导出前诊断与后端溯源
        pdfCapability: {
          available: pdfCapability.available,
          backend: pdfCapability.backend,
          backendLabel: pdfCapability.backendLabel,
          version: pdfCapability.version,
          exportFilter: pdfCapability.exportFilter,
          fontsReady: pdfCapability.fontsReady,
          fontsStatus: pdfCapability.fontsStatus,
          fontsDetail: pdfCapability.fontsDetail,
          reason: pdfCapability.reason,
          remedy: pdfCapability.remedy,
          warnings: pdfCapability.warnings,
          attempts: pdfCapability.attempts,
          platform: pdfCapability.platform,
          probedAt: pdfCapability.probedAt,
        },
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    // 2. POST /api/msds/import
    if (pathname === '/api/msds/import' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const templateVariant = body.templateVariant || 'CN_GUANZHI';
      let fileBuffer = null;
      let fileName = body.fileName || 'imported.docx';

      if (body.filePath) {
        try {
          fileBuffer = await fs.readFile(body.filePath);
          fileName = path.basename(body.filePath);
        } catch (err) {
          sendJson(res, 400, { success: false, error: { message: `无法读取指定文件: ${err.message}` } });
          return true;
        }
      } else if (body.contentBase64) {
        try {
          fileBuffer = Buffer.from(body.contentBase64, 'base64');
        } catch (err) {
          sendJson(res, 400, { success: false, error: { message: `base64 解码失败: ${err.message}` } });
          return true;
        }
      } else {
        sendJson(res, 400, { success: false, error: { message: '缺少参数：请提供 filePath 或 contentBase64' } });
        return true;
      }

      const docxEngine = await loadDocx(fileBuffer.buffer, fileName);
      const session = getOrCreateSession(sessionId);
      session.sourceEngine = docxEngine;
      session.sourceFileName = fileName;
      session.templateVariant = templateVariant;
      session.updatedAt = Date.now();

      // 如果请求指定了 saveToRepo，同步存入记录库
      if (body.saveToRepo) {
        const matchRes = runSmartMatching(docxEngine.records);
        session.matchResult = matchRes;
        const summary = matchRes.summary || {};
        const model = summary.productName || fileName.split(/[_\s]/)[0] || '';
        const recId = `REC-${model || 'MSDS'}-${Date.now()}`;
        saveRecord({
          id: recId,
          batchId: body.batchId || 'manual',
          fileName,
          model,
          language: matchRes.fileNaming?.language || 'CN',
          entity: /国彩/i.test(fileName) ? '国彩' : '冠志',
          templateVariant,
          status: (summary.reviewAmbiguousFields || 0) > 0 ? 'HAS_CONFLICTS' : 'PERFECT',
          matchedFields: summary.matchedFields || 0,
          prunedFields: summary.prunedFields || 0,
          conflictFields: summary.reviewAmbiguousFields || 0,
          unmatchedFields: summary.unmatchedFields || 0,
          rawFactsJson: docxEngine.records,
          matchResultJson: matchRes,
          docxBuffer: fileBuffer,
        });
      }

      sendJson(res, 200, {
        success: true,
        sessionId,
        fileName,
        templateVariant,
        message: 'DOCX 识别加载成功',
      });
      return true;
    }

    // 3. GET /api/msds/recognition
    if (pathname === '/api/msds/recognition' && req.method === 'GET') {
      const sessionId = searchParams.get('sessionId') || 'default';
      const session = sessions.get(sessionId);
      if (!session || !session.sourceEngine) {
        sendJson(res, 404, { success: false, error: { message: `未找到活跃会话或源文档未导入: ${sessionId}` } });
        return true;
      }

      const secFilter = searchParams.get('section');
      let records = session.sourceEngine.records;
      if (secFilter) {
        const targetSec = Number(secFilter);
        records = records.filter((r) => r.sectionNumber === targetSec);
      }

      sendJson(res, 200, {
        success: true,
        sessionId,
        data: {
          fileName: session.sourceFileName,
          totalRecords: records.length,
          records,
        },
      });
      return true;
    }

    // 4. POST /api/msds/match
    if (pathname === '/api/msds/match' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = sessions.get(sessionId);
      if (!session || !session.sourceEngine) {
        sendJson(res, 404, { success: false, error: { message: `未找到活跃会话或源文档未导入: ${sessionId}` } });
        return true;
      }

      if (body.templateVariant) session.templateVariant = body.templateVariant;
      const matchResult = runSmartMatching(session.sourceEngine.records);
      session.matchResult = matchResult;

      const templatePath = resolveTemplatePath(session.templateVariant);
      const templateBuffer = await fs.readFile(templatePath);
      const tplEngine = await loadDocx(templateBuffer.buffer, path.basename(templatePath));
      applyMatchResultToEditor(matchResult, tplEngine);
      session.editorEngine = tplEngine;
      session.updatedAt = Date.now();

      sendJson(res, 200, {
        success: true,
        sessionId,
        templateVariant: session.templateVariant,
        summary: matchResult.summary,
        message: '智能匹配与模板插槽装配已成功执行',
      });
      return true;
    }

    // 5. GET /api/msds/match-result
    if (pathname === '/api/msds/match-result' && req.method === 'GET') {
      const sessionId = searchParams.get('sessionId') || 'default';
      const format = searchParams.get('format') || 'summary';
      const session = sessions.get(sessionId);
      if (!session || !session.matchResult) {
        sendJson(res, 404, { success: false, error: { message: `未找到匹配结果，请先调用 /api/msds/match 进行匹配: ${sessionId}` } });
        return true;
      }

      const matchRes = session.matchResult;
      const structuredSections = matchRes.matchedSections.map((sec) => ({
        sectionNumber: sec.sectionNumber,
        title: sec.title,
        rows: sec.matchedRows.map((r) => ({
          label: r.standardLabel,
          value: r.value,
          status: r.status,
          reason: r.reason,
        })),
        components: sec.components,
      }));

      if (format === 'markdown') {
        let md = `# MSDS 智能匹配结果报告\n\n`;
        md += `- **会话 ID**: ${sessionId}\n`;
        md += `- **源文件名**: ${session.sourceFileName || '未知'}\n`;
        md += `- **模板变体**: ${session.templateVariant}\n`;
        md += `- **产品型号**: ${matchRes.summary?.productName || '未识别'}\n`;
        md += `- **对齐字段**: ${matchRes.summary?.matchedFields || 0}\n`;
        md += `- **清空字段**: ${matchRes.summary?.prunedFields || 0}\n`;
        md += `- **冲突字段**: ${matchRes.summary?.reviewAmbiguousFields || 0}\n\n`;
        md += `---\n\n`;

        for (const sec of structuredSections) {
          md += `## 第 ${sec.sectionNumber} 部分：${sec.title.replace(/^第?\s*\d+\s*[部分.、\s]*/i, '')}\n\n`;

          if (sec.sectionNumber === 3) {
            const generalRows = sec.rows.filter((r) => !/化学品名称|CAS编号|含量/i.test(r.label));
            if (generalRows.length) {
              md += `| 标准标签 | 匹配值 | 状态 |\n|---|---|---|\n`;
              for (const r of generalRows) {
                const cleanVal = r.value.replace(/\n+/g, '；');
                md += `| **${r.label}** | ${cleanVal || '*(空)*'} | ${r.status} |\n`;
              }
              md += `\n`;
            }
            if (sec.components?.length) {
              md += `### 组分明细表\n\n`;
              md += `| 化学品名称 | CAS编号 | 含量%（w/w） |\n|---|---|---|\n`;
              for (const c of sec.components) {
                md += `| ${c.name} | ${c.cas || '无'} | ${c.concentration || '未标明'} |\n`;
              }
              md += `\n`;
            }
          } else if (sec.rows.length) {
            md += `| 标准标签 | 匹配值 | 状态 |\n|---|---|---|\n`;
            for (const r of sec.rows) {
              const cleanVal = r.value.replace(/\n+/g, '；');
              md += `| **${r.label}** | ${cleanVal || '*(空)*'} | ${r.status} |\n`;
            }
            md += `\n`;
          } else {
            md += `*(无数据行)*\n\n`;
          }
        }

        sendJson(res, 200, {
          success: true,
          sessionId,
          templateVariant: session.templateVariant,
          data: { markdown: md },
        });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        sessionId,
        templateVariant: session.templateVariant,
        data: { sections: structuredSections },
      });
      return true;
    }


    // ========================================================
    // 5.5 四阶生产流水线 API 端点 (Pipeline API)
    // ========================================================
    // 阶段一：建立中文基准 (Base-CN)
    if (pathname === '/api/msds/pipeline/base-cn' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = getOrCreateSession(sessionId);

      const model = body.model || 'MSDS';
      let cnBuf = null;
      if (body.cnGroundTruthBase64) {
        cnBuf = Buffer.from(body.cnGroundTruthBase64, 'base64');
      } else if (body.recordId) {
        cnBuf = await getDocxBuffer(body.recordId);
      }

      const engine = await buildBaseChineseEngine({
        modelCode: model,
        cnGroundTruthBuffer: cnBuf,
        cnGroundTruthPath: body.cnGroundTruthPath,
        revisionDate: body.revisionDate || null
      });

      session.baseCnEngine = engine;
      session.model = model;

      sendJson(res, 200, {
        success: true,
        stage: 1,
        stageName: 'Base-CN Established',
        sessionId,
        model,
        tableCount: tableRecords(engine).length,
        headerFooter: engine.headerFooterData
      });
      return true;
    }

    // 阶段二：建立英文基准 (Base-EN)
    if (pathname === '/api/msds/pipeline/base-en' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = getOrCreateSession(sessionId);

      const model = body.model || session.model || 'MSDS';
      const facts = body.facts || {};

      const engine = await buildBaseEnglishEngine({
        modelCode: model,
        facts,
        revisionDate: body.revisionDate || null
      });

      session.baseEnEngine = engine;

      sendJson(res, 200, {
        success: true,
        stage: 2,
        stageName: 'Base-EN Derived',
        sessionId,
        model,
        tableCount: tableRecords(engine).length,
        headerFooter: engine.headerFooterData
      });
      return true;
    }

    // 阶段三：应用预设派生变体 (Apply Presets)
    if (pathname === '/api/msds/pipeline/apply-presets' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = getOrCreateSession(sessionId);

      if (!session.baseCnEngine || !session.baseEnEngine) {
        sendJson(res, 400, {
          success: false,
          error: { message: '请先完成阶段一 (base-cn) 与阶段二 (base-en) 基准建立' }
        });
        return true;
      }

      const model = session.model || body.model || 'MSDS';
      const entityId = body.entityId || 'GUOCAI';

      const { cnPresetEngine, enPresetEngine } = await derivePresetEngines({
        modelCode: model,
        baseCnEngine: session.baseCnEngine,
        baseEnEngine: session.baseEnEngine,
        entityId,
        revisionDate: body.revisionDate || null
      });

      session.presetEngines = {
        cn: cnPresetEngine,
        en: enPresetEngine,
        entityId
      };

      sendJson(res, 200, {
        success: true,
        stage: 3,
        stageName: 'Presets Applied',
        sessionId,
        model,
        derivedVariants: [
          `${model} msds_CN ${ENTITY_MATRIX[entityId]?.cn?.shortName || entityId}`,
          `${model} msds_EN ${ENTITY_MATRIX[entityId]?.en?.shortName || entityId}`
        ]
      });
      return true;
    }

    // 阶段四：批量并行导出 (Export All)
    if (pathname === '/api/msds/pipeline/export-all' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = getOrCreateSession(sessionId);

      if (!session.baseCnEngine || !session.baseEnEngine || !session.presetEngines) {
        sendJson(res, 400, {
          success: false,
          error: { message: '缺少完整的基准或预设引擎实例，无法导出' }
        });
        return true;
      }

      const model = session.model || body.model || 'MSDS';
      const targetDir = body.targetDir || null;

      const deliverables = await batchExportDeliverables({
        modelCode: model,
        targetDir,
        engines: {
          cnGuanzhi: session.baseCnEngine,
          cnGuocai: session.presetEngines.cn,
          enGuanzhi: session.baseEnEngine,
          enGuocai: session.presetEngines.en
        }
      });

      sendJson(res, 200, {
        success: true,
        stage: 4,
        stageName: 'Export Complete',
        sessionId,
        model,
        targetDir,
        deliverables
      });
      return true;
    }

    // 统一门面接口：四阶流水线一步原子完成 (One-Click Atomic Pipeline)
    if (pathname === '/api/msds/pipeline/generate-eight' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const model = body.model;
      if (!model) {
        sendJson(res, 400, { success: false, error: { message: '必须指定产品型号 (model)' } });
        return true;
      }

      let cnBuf = null;
      if (body.cnGroundTruthBase64) {
        cnBuf = Buffer.from(body.cnGroundTruthBase64, 'base64');
      } else if (body.recordId) {
        cnBuf = await getDocxBuffer(body.recordId);
      }

      const result = await executeEightDeliverablesPipeline({
        modelCode: model,
        cnGroundTruthPath: body.cnGroundTruthPath,
        cnGroundTruthBuffer: cnBuf,
        targetDir: body.targetDir,
        facts: body.facts || {},
        revisionDate: body.revisionDate || null
      });

      sendJson(res, 200, result);
      return true;
    }

    // ==========================================
    // 6. 统一导出接口 (Export DOCX & PDF)
    // ==========================================
    // POST /api/msds/convert-pdf-batch
    // 支持接收前端传来的多份 DOCX 文件并发批处理转译为高清 PDF
    if (pathname === '/api/msds/convert-pdf-batch' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const capability = getPdfCapability();
      if (!capability.available) {
        sendJson(res, 503, {
          success: false,
          error: {
            message: `PDF 转换能力不可用，无法转译 PDF。原因：${capability.reason} 补救方式：${capability.remedy}`,
          },
          pdfCapability: capability,
        });
        return true;
      }
      const files = (body.files || []).map((f) => ({
        name: f.name,
        buffer: Buffer.from(f.bufferBase64, 'base64'),
      }));
      const pdfs = await convertBatchDocxToPdf(files);
      sendJson(res, 200, {
        success: true,
        pdfs: pdfs.map((p) => ({
          pdfName: p.pdfName,
          pdfBase64: p.pdfBuffer.toString('base64'),
          size: p.size,
          durationMs: p.durationMs,
        })),
      });
      return true;
    }

    // POST /api/msds/export
    // 支持按预设优先级同步导出 DOCX 与高清 PDF (可打包为 ZIP 或返回 base64 清单)
    if (pathname === '/api/msds/export' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = sessions.get(sessionId);

      let baseEngine = session?.editorEngine;
      let baseModel = session?.matchResult?.summary?.productName || '';

      if (!baseEngine && body.baseDocxBase64) {
        const buf = Buffer.from(body.baseDocxBase64, 'base64');
        baseEngine = await loadDocx(buf, body.templateName || 'base.docx');
        baseModel = body.productModel || baseEngine.headerFooterData?.model || '';
      }

      if (!baseEngine && body.recordId) {
        const rec = getRecordById(body.recordId);
        if (rec) {
          const buf = getDocxBuffer(body.recordId);
          if (buf) {
            baseEngine = await loadDocx(buf, rec.file_name);
            baseModel = rec.model || '';
          }
        }
      }

      if (!baseEngine) {
        sendJson(res, 404, { success: false, error: { message: `未找到可导出的引擎实例。请提供有效 sessionId 或 recordId` } });
        return true;
      }

      const format = String(body.format || 'docx').toLowerCase(); // 'docx' | 'pdf' | 'both'
      const returnType = String(body.returnType || 'json').toLowerCase(); // 'json' | 'binary'
      const includeBase = body.includeBase !== false;
      const requestedPresetIds = Array.isArray(body.presetIds) ? body.presetIds : null;

      // 提取预设清单
      let exportPresets = [];
      if (requestedPresetIds && requestedPresetIds.length > 0) {
        for (const pid of requestedPresetIds) {
          const p = getPresetById(pid);
          if (p) exportPresets.push(p);
        }
      } else if (body.presetIds === 'all') {
        exportPresets = listPresets({ enabledOnly: true });
      }

      const outputs = [];

      // PDF 能力预检：必须在生成任何文件之前完成，避免"已完成大量工作才报能力缺失"
      const pdfPreflight = evaluatePdfPreflight(format);
      if (pdfPreflight.blocked) {
        sendJson(res, pdfPreflight.blocked.status, {
          success: false,
          error: { message: pdfPreflight.blocked.message },
          pdfCapability: pdfPreflight.capability,
        });
        return true;
      }

      // 1. 并发准备全部 DOCX 目标文件 (Promise.all 并行装配)
      const docxGenerationTasks = [];

      if (includeBase) {
        docxGenerationTasks.push(
          (async () => {
            const baseDocxBuf = await baseEngine.exportArrayBuffer();
            const baseName = buildExportDocxName(baseEngine, {
              customFileName: body.customFileName,
              templateName: session?.templateVariant,
              sourcePreviewName: session?.sourceFileName,
              productModel: baseModel,
            });
            return {
              name: baseName,
              format: 'docx',
              buffer: Buffer.from(baseDocxBuf),
              size: baseDocxBuf.byteLength,
              isBase: true,
            };
          })()
        );
      }

      for (const preset of exportPresets) {
        docxGenerationTasks.push(
          (async () => {
            const rawBuf = await baseEngine.exportArrayBuffer();
            const presetEngine = await loadDocx(rawBuf, preset.targetTemplate || 'template.docx');

            applyPresetPriorityOverlay(baseEngine, preset, presetEngine);
            tableRecords(presetEngine).forEach((r) => renumberRecord(r));

            let presetDocxName = '';
            if (preset.headerFooterOverrides?.customFileNamePattern) {
              presetDocxName = preset.headerFooterOverrides.customFileNamePattern.replace('{model}', baseModel || 'MSDS');
            } else {
              const cleanPresetName = (preset.name || '预设').replace(/[\/:*?"<>|]/g, '_');
              const lang = preset.language || 'CN';
              presetDocxName = `${baseModel || 'MSDS'} msds_${lang}_${cleanPresetName}.docx`;
            }

            const presetDocxBuf = await presetEngine.exportArrayBuffer();
            return {
              name: presetDocxName,
              presetId: preset.id,
              presetName: preset.name,
              format: 'docx',
              buffer: Buffer.from(presetDocxBuf),
              size: presetDocxBuf.byteLength,
              isBase: false,
            };
          })()
        );
      }

      // 并行执行所有 DOCX 生成
      const docxResults = await Promise.all(docxGenerationTasks);

      if (format === 'docx' || format === 'both') {
        for (const item of docxResults) {
          outputs.push(item);
        }
      }

      // 2. 批量极速并发转译 PDF (利用 LibreOffice 原生批处理管道)
      //    both 模式下能力缺失时跳过 PDF，保留已生成的 DOCX（优雅降级）
      if (pdfPreflight.needsPdf && !pdfPreflight.pdfOmitted) {
        const pdfItemsToConvert = docxResults.map((item) => ({
          buffer: item.buffer,
          name: item.name,
        }));

        const pdfResults = await convertBatchDocxToPdf(pdfItemsToConvert);
        for (let i = 0; i < pdfResults.length; i++) {
          const pRes = pdfResults[i];
          const matchedDocx = docxResults[i];
          outputs.push({
            name: pRes.pdfName,
            presetId: matchedDocx?.presetId,
            presetName: matchedDocx?.presetName,
            format: 'pdf',
            buffer: pRes.pdfBuffer,
            size: pRes.size,
            durationMs: pRes.durationMs,
          });
        }
      }

      if (outputs.length === 0) {
        sendJson(res, 400, { success: false, error: { message: '没有生成任何导出文件' } });
        return true;
      }

      // 二进制下载流模式
      if (returnType === 'binary') {
        if (outputs.length === 1) {
          const single = outputs[0];
          const contentType = single.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': single.buffer.length,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(single.name)}"`,
            'Access-Control-Allow-Origin': '*',
            ...(pdfPreflight.pdfOmitted
              ? { 'X-PDF-Omitted': encodeURIComponent(pdfPreflight.pdfOmitted.reason || 'pdf-unavailable') }
              : {}),
          });
          res.end(single.buffer);
          return true;
        } else {
          const zip = new JSZip();
          for (const item of outputs) {
            zip.file(item.name, item.buffer);
          }
          const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
          const zipName = `${baseModel || 'MSDS'}_多版本同步包.zip`;
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': zipBuf.length,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}"`,
            'Access-Control-Allow-Origin': '*',
            ...(pdfPreflight.pdfOmitted
              ? { 'X-PDF-Omitted': encodeURIComponent(pdfPreflight.pdfOmitted.reason || 'pdf-unavailable') }
              : {}),
          });
          res.end(zipBuf);
          return true;
        }
      }

      // 默认 JSON 模式 (携带 Base64 内容及统计元数据)
      sendJson(res, 200, {
        success: true,
        sessionId,
        model: baseModel,
        format,
        totalFiles: outputs.length,
        pdfOmitted: pdfPreflight.pdfOmitted || null,
        pdfCapability: pdfPreflight.capability
          ? {
              available: pdfPreflight.capability.available,
              backend: pdfPreflight.capability.backend,
              backendLabel: pdfPreflight.capability.backendLabel,
              reason: pdfPreflight.capability.reason,
              remedy: pdfPreflight.capability.remedy,
            }
          : null,
        files: outputs.map((f) => ({
          name: f.name,
          format: f.format,
          size: f.size,
          presetId: f.presetId,
          presetName: f.presetName,
          durationMs: f.durationMs,
          contentBase64: f.buffer.toString('base64'),
        })),
      });
      return true;
    }

    // ==========================================
    // 6. 统一导出接口 (Export DOCX & PDF)
    // ==========================================
    // POST /api/msds/export
    // 支持按预设优先级同步导出 DOCX 与高清 PDF (可打包为 ZIP 或返回 base64 清单)
    if (pathname === '/api/msds/export' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const session = sessions.get(sessionId);

      let baseEngine = session?.editorEngine;
      let baseModel = session?.matchResult?.summary?.productName || '';

      if (!baseEngine && body.recordId) {
        const rec = getRecordById(body.recordId);
        if (rec) {
          const buf = getDocxBuffer(body.recordId);
          if (buf) {
            baseEngine = await loadDocx(buf, rec.file_name);
            baseModel = rec.model || '';
          }
        }
      }

      if (!baseEngine) {
        sendJson(res, 404, { success: false, error: { message: `未找到可导出的引擎实例。请提供有效 sessionId 或 recordId` } });
        return true;
      }

      const format = String(body.format || 'docx').toLowerCase(); // 'docx' | 'pdf' | 'both'
      const returnType = String(body.returnType || 'json').toLowerCase(); // 'json' | 'binary'
      const includeBase = body.includeBase !== false;
      const requestedPresetIds = Array.isArray(body.presetIds) ? body.presetIds : null;

      // 提取预设清单
      let exportPresets = [];
      if (requestedPresetIds && requestedPresetIds.length > 0) {
        for (const pid of requestedPresetIds) {
          const p = getPresetById(pid);
          if (p) exportPresets.push(p);
        }
      } else if (body.presetIds === 'all') {
        exportPresets = listPresets({ enabledOnly: true });
      }

      const outputs = [];

      // PDF 能力预检：必须在生成任何文件之前完成
      const pdfPreflight = evaluatePdfPreflight(format);
      if (pdfPreflight.blocked) {
        sendJson(res, pdfPreflight.blocked.status, {
          success: false,
          error: { message: pdfPreflight.blocked.message },
          pdfCapability: pdfPreflight.capability,
        });
        return true;
      }

      // 1. 普通基准主文档导出
      if (includeBase) {
        const baseDocxBuf = await baseEngine.exportArrayBuffer();
        const baseName = buildExportDocxName(baseEngine, {
          customFileName: body.customFileName,
          templateName: session?.templateVariant,
          sourcePreviewName: session?.sourceFileName,
          productModel: baseModel,
        });

        if (format === 'docx' || format === 'both') {
          outputs.push({
            name: baseName,
            format: 'docx',
            buffer: Buffer.from(baseDocxBuf),
            size: baseDocxBuf.byteLength,
          });
        }
        if (pdfPreflight.needsPdf && !pdfPreflight.pdfOmitted) {
          const pdfRes = await convertDocxToPdf(baseDocxBuf, baseName);
          outputs.push({
            name: pdfRes.pdfName,
            format: 'pdf',
            buffer: pdfRes.pdfBuffer,
            size: pdfRes.size,
            durationMs: pdfRes.durationMs,
          });
        }
      }

      // 2. 逐个生成勾选的预设版本
      for (const preset of exportPresets) {
        const rawBuf = await baseEngine.exportArrayBuffer();
        const presetEngine = await loadDocx(rawBuf, preset.targetTemplate || 'template.docx');

        applyPresetPriorityOverlay(baseEngine, preset, presetEngine);
        tableRecords(presetEngine).forEach((r) => renumberRecord(r));

        let presetDocxName = '';
        if (preset.headerFooterOverrides?.customFileNamePattern) {
          presetDocxName = preset.headerFooterOverrides.customFileNamePattern.replace('{model}', baseModel || 'MSDS');
        } else {
          const cleanPresetName = (preset.name || '预设').replace(/[\\/:*?"<>|]/g, '_');
          const lang = preset.language || 'CN';
          presetDocxName = `${baseModel || 'MSDS'} msds_${lang}_${cleanPresetName}.docx`;
        }

        const presetDocxBuf = await presetEngine.exportArrayBuffer();

        if (format === 'docx' || format === 'both') {
          outputs.push({
            name: presetDocxName,
            presetId: preset.id,
            presetName: preset.name,
            format: 'docx',
            buffer: Buffer.from(presetDocxBuf),
            size: presetDocxBuf.byteLength,
          });
        }
        if (pdfPreflight.needsPdf && !pdfPreflight.pdfOmitted) {
          const pdfRes = await convertDocxToPdf(presetDocxBuf, presetDocxName);
          outputs.push({
            name: pdfRes.pdfName,
            presetId: preset.id,
            presetName: preset.name,
            format: 'pdf',
            buffer: pdfRes.pdfBuffer,
            size: pdfRes.size,
            durationMs: pdfRes.durationMs,
          });
        }
      }

      if (outputs.length === 0) {
        sendJson(res, 400, { success: false, error: { message: '没有生成任何导出文件' } });
        return true;
      }

      // 二进制下载流模式
      if (returnType === 'binary') {
        if (outputs.length === 1) {
          const single = outputs[0];
          const contentType = single.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': single.buffer.length,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(single.name)}"`,
            'Access-Control-Allow-Origin': '*',
            ...(pdfPreflight.pdfOmitted
              ? { 'X-PDF-Omitted': encodeURIComponent(pdfPreflight.pdfOmitted.reason || 'pdf-unavailable') }
              : {}),
          });
          res.end(single.buffer);
          return true;
        } else {
          const zip = new JSZip();
          for (const item of outputs) {
            zip.file(item.name, item.buffer);
          }
          const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
          const zipName = `${baseModel || 'MSDS'}_多版本同步包.zip`;
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': zipBuf.length,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}"`,
            'Access-Control-Allow-Origin': '*',
            ...(pdfPreflight.pdfOmitted
              ? { 'X-PDF-Omitted': encodeURIComponent(pdfPreflight.pdfOmitted.reason || 'pdf-unavailable') }
              : {}),
          });
          res.end(zipBuf);
          return true;
        }
      }

      // 默认 JSON 模式 (携带 Base64 内容及统计元数据)
      sendJson(res, 200, {
        success: true,
        sessionId,
        model: baseModel,
        format,
        totalFiles: outputs.length,
        pdfOmitted: pdfPreflight.pdfOmitted || null,
        pdfCapability: pdfPreflight.capability
          ? {
              available: pdfPreflight.capability.available,
              backend: pdfPreflight.capability.backend,
              backendLabel: pdfPreflight.capability.backendLabel,
              reason: pdfPreflight.capability.reason,
              remedy: pdfPreflight.capability.remedy,
            }
          : null,
        files: outputs.map((f) => ({
          name: f.name,
          format: f.format,
          size: f.size,
          presetId: f.presetId,
          presetName: f.presetName,
          durationMs: f.durationMs,
          contentBase64: f.buffer.toString('base64'),
        })),
      });
      return true;
    }

    sendJson(res, 404, { success: false, error: { message: `未知的 API 端点: ${pathname}` } });
    return true;
  } catch (err) {
    if (!res.headersSent) {
      sendJson(res, 500, { success: false, error: { message: `服务器内部错误: ${err.message}`, stack: err.stack } });
    }
    return true;
  }
}
