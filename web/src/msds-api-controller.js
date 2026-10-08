import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadDocx } from './docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './smart-matching.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../public/templates');

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
      if (body.length > 50 * 1024 * 1024) {
        reject(new Error('请求体过大（上限 50MB）'));
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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload, null, 2));
}

/**
 * 统一 API 请求调度入口
 * 适用于 Vite 中间件及原生 Node HTTP 服务
 */
export async function handleApiRequest(req, res) {
  const parsedUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = parsedUrl.pathname.replace(/\/+$/, '');

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  // 路由匹配：只处理 /api/msds/*
  if (!pathname.startsWith('/api/msds')) {
    return false;
  }

  try {
    // 1. GET /api/msds/health
    if (pathname === '/api/msds/health' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        service: 'msds-studio-api',
        version: '1.0.0',
        activeSessions: sessions.size,
        uptimeSeconds: Math.round(process.uptime()),
      });
      return true;
    }

    // 2. POST /api/msds/import
    if (pathname === '/api/msds/import' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const filePath = body.filePath;
      const sessionId = body.sessionId || 'default';

      if (!filePath) {
        sendJson(res, 400, { success: false, error: { message: '缺少必需参数 filePath' } });
        return true;
      }

      let fileBuf;
      try {
        fileBuf = await fs.readFile(filePath);
      } catch (e) {
        sendJson(res, 404, { success: false, error: { message: `无法读取指定文件: ${filePath} (${e.message})` } });
        return true;
      }

      const fileName = path.basename(filePath);
      const sourceEngine = await loadDocx(fileBuf, fileName);

      const session = getOrCreateSession(sessionId);
      session.sourceEngine = sourceEngine;
      session.matchResult = null;
      session.editorEngine = null;
      session.updatedAt = Date.now();

      const sections = sourceEngine.records
        .filter((r) => r.kind === 'table' && r.sectionNumber)
        .map((r) => ({
          sectionNumber: r.sectionNumber,
          title: r.title,
          rowCount: r.rows?.length || 0,
          fieldCandidateCount: r.fieldCandidates?.length || 0,
        }));

      sendJson(res, 200, {
        success: true,
        sessionId,
        data: {
          fileName,
          fileSizeBytes: fileBuf.length,
          sectionCount: sections.length,
          sections,
          warnings: sourceEngine.warnings || [],
        },
      });
      return true;
    }

    // 3. GET /api/msds/recognition
    if (pathname === '/api/msds/recognition' && req.method === 'GET') {
      const sessionId = parsedUrl.searchParams.get('sessionId') || 'default';
      const session = sessions.get(sessionId);

      if (!session || !session.sourceEngine) {
        sendJson(res, 400, { success: false, error: { message: `会话 ${sessionId} 不存在或未导入 MSDS 文档，请先调用 /import` } });
        return true;
      }

      const matchRes = runSmartMatching(session.sourceEngine.records);
      const sections = [];

      for (let s = 1; s <= 16; s++) {
        const secRecord = session.sourceEngine.records.find((r) => r.sectionNumber === s && r.kind === 'table');
        const matchedSec = matchRes.matchedSections.find((ms) => ms.sectionNumber === s);

        const candidates = (secRecord?.fieldCandidates || []).map((fc) => ({
          label: fc.label,
          value: fc.value,
        }));

        const components = matchedSec?.components || [];

        sections.push({
          sectionNumber: s,
          title: secRecord?.title || `第 ${s} 部分`,
          candidates,
          components: s === 3 ? components : undefined,
        });
      }

      sendJson(res, 200, {
        success: true,
        sessionId,
        data: {
          sections,
        },
      });
      return true;
    }

    // 4. POST /api/msds/match
    if (pathname === '/api/msds/match' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || 'default';
      const templateVariant = body.templateVariant || 'CN_GUANZHI';

      const session = sessions.get(sessionId);
      if (!session || !session.sourceEngine) {
        sendJson(res, 400, { success: false, error: { message: `会话 ${sessionId} 未导入文档，请先调用 /import` } });
        return true;
      }

      const tplPath = resolveTemplatePath(templateVariant);
      let tplBuf;
      try {
        tplBuf = await fs.readFile(tplPath);
      } catch (e) {
        sendJson(res, 500, { success: false, error: { message: `无法加载模板文件: ${tplPath}` } });
        return true;
      }

      const editorEngine = await loadDocx(tplBuf, path.basename(tplPath));
      const matchResult = runSmartMatching(session.sourceEngine.records);
      const injectRes = applyMatchResultToEditor(matchResult, editorEngine);

      session.templateVariant = templateVariant;
      session.matchResult = matchResult;
      session.editorEngine = editorEngine;
      session.updatedAt = Date.now();

      sendJson(res, 200, {
        success: true,
        sessionId,
        templateVariant,
        data: {
          injectedCount: injectRes.injectedCount,
          prunedCount: injectRes.prunedCount,
          matchedFields: matchResult.summary?.matchedFields || 0,
          prunedFields: matchResult.summary?.prunedFields || 0,
          notApplicableFields: matchResult.summary?.notApplicableFields || 0,
        },
      });
      return true;
    }

    // 5. GET /api/msds/match-result
    if (pathname === '/api/msds/match-result' && req.method === 'GET') {
      const sessionId = parsedUrl.searchParams.get('sessionId') || 'default';
      const format = parsedUrl.searchParams.get('format') || 'summary';

      const session = sessions.get(sessionId);
      if (!session || !session.editorEngine || !session.matchResult) {
        sendJson(res, 400, { success: false, error: { message: `会话 ${sessionId} 尚未执行匹配，请先调用 /match` } });
        return true;
      }

      const structuredSections = [];

      for (let s = 1; s <= 16; s++) {
        const tRecord = session.editorEngine.records.find((r) => r.sectionNumber === s && r.kind === 'table');
        const matchedSec = session.matchResult.matchedSections.find((ms) => ms.sectionNumber === s);
        if (!tRecord) continue;

        const rows = [];
        for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
          const row = tRecord.rows[rIdx];
          const isSingleCell = row.cells.length === 1;
          const labelCell = row.cells[0];
          const valCell = row.cells.length > 1 ? row.cells[row.cells.length - 1] : null;

          let label = '';
          let value = '';

          if (isSingleCell) {
            const txt = (labelCell?.text || '').trim();
            if (labelCell?.kind === 'label-only' && !labelCell?.editable) {
              label = txt;
              value = '';
            } else {
              label = s === 16 ? '免责声明：' : (s === 13 ? '废弃通用原则：' : (s === 15 ? '法规依据：' : '说明：'));
              value = txt;
            }
          } else {
            label = (labelCell?.labelText || labelCell?.text || '').trim();
            value = (valCell?.valueText || valCell?.text || '').trim();
          }

          if (label || value) {
            rows.push({
              label: label || `项目 ${rIdx}`,
              value: value || '',
              status: value ? 'MATCHED' : (label ? 'LABEL_ONLY' : 'EMPTY'),
            });
          }
        }

        const secObj = {
          sectionNumber: s,
          title: tRecord.title,
          rows,
        };

        if (s === 3 && matchedSec?.components) {
          secObj.components = matchedSec.components;
        }

        structuredSections.push(secObj);
      }

      // 根据 format 格式化返回
      if (format === 'markdown') {
        let md = `# MSDS 智能匹配结果报告\n\n`;
        md += `- **会话 ID**: \`${sessionId}\`\n`;
        md += `- **模板变体**: \`${session.templateVariant}\`\n`;
        md += `- **总匹配项**: ${session.matchResult.summary?.matchedFields || 0} | **剪枝删行**: ${session.matchResult.summary?.prunedFields || 0}\n\n`;

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
          data: {
            markdown: md,
          },
        });
        return true;
      }

      // 默认 summary 模式
      sendJson(res, 200, {
        success: true,
        sessionId,
        templateVariant: session.templateVariant,
        data: {
          sections: structuredSections,
        },
      });
      return true;
    }

    // 未知 MSDS API 子路径
    sendJson(res, 404, { success: false, error: { message: `未知的 API 端点: ${pathname}` } });
    return true;
  } catch (err) {
    sendJson(res, 500, { success: false, error: { message: `服务器内部错误: ${err.message}`, stack: err.stack } });
    return true;
  }
}
