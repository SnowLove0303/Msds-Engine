#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './src/msds-api-controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');

const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '0.0.0.0';
const VERSION = '1.2.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. API 路由: 版本与健康检查探针
  if (pathname === '/api/version') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      version: VERSION,
      name: 'msds-engine',
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // 2. 后端 MSDS API 控制器
  if (pathname.startsWith('/api/msds')) {
    const handled = await handleApiRequest(req, res);
    if (handled) return;
  }

  // 3. 生产静态资源托管 (web/dist)
  let filePath = path.join(DIST_DIR, pathname);
  try {
    let stats = await fs.promises.stat(filePath).catch(() => null);
    if (stats && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stats = await fs.promises.stat(filePath).catch(() => null);
    }

    // SPA Fallback: 若文件不存在且非 API 请求，回退到 index.html
    if (!stats) {
      filePath = path.join(DIST_DIR, 'index.html');
      stats = await fs.promises.stat(filePath).catch(() => null);
    }

    if (!stats) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found (dist not built, please run: npm run build)');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Internal Server Error: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 [MSDS Engine v${VERSION}] 生产服务器已就绪`);
  console.log(`🌐 访问地址: http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
  console.log(`📡 API 健康探针: http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/api/version`);
  console.log(`====================================================`);
});
