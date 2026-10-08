#!/usr/bin/env node
import { createServer } from 'node:http';
import { handleApiRequest } from './msds-api-controller.js';

const defaultPort = 5174;
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : defaultPort;
const host = '127.0.0.1';

const server = createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      error: {
        message: `未找到路径: ${req.url}。MSDS API 端点挂载于 /api/msds/*`,
      },
    }));
  }
});

server.listen(port, host, () => {
  console.log(`====================================================`);
  console.log(`🚀 MSDS Studio Agent API 独立服务已就绪！`);
  console.log(`📡 服务基地址: http://${host}:${port}/api/msds`);
  console.log(`🔍 健康检查:   http://${host}:${port}/api/msds/health`);
  console.log(`📥 导入接口:   POST http://${host}:${port}/api/msds/import`);
  console.log(`📖 识别接口:   GET  http://${host}:${port}/api/msds/recognition`);
  console.log(`🎯 匹配接口:   POST http://${host}:${port}/api/msds/match`);
  console.log(`📊 结果接口:   GET  http://${host}:${port}/api/msds/match-result?format=summary|markdown`);
  console.log(`====================================================`);
});
