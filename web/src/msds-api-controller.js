import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadDocx } from './docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './smart-matching.js';
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
} from './msds-db.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../public/templates');
const APP_VERSION = '1.3.0';

// 内存会话存储池
const sessions = new Map();

function getOrCreateSession(sessionId = 'default') {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      sourceEngine: null,
      matchResult: null,
      editorEngine: null,
      templateVariant: 'CN_GUANZHI',
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
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });
  res.end(JSON.stringify(data));
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
    // 现有单次会话 API 保留 (Backward Compatibility)
    // ==========================================

    // 1. GET /api/msds/health
    if (pathname === '/api/msds/health' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        status: 'UP',
        engineVersion: APP_VERSION,
        activeSessions: sessions.size,
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

    sendJson(res, 404, { success: false, error: { message: `未知的 API 端点: ${pathname}` } });
    return true;
  } catch (err) {
    sendJson(res, 500, { success: false, error: { message: `服务器内部错误: ${err.message}`, stack: err.stack } });
    return true;
  }
}
