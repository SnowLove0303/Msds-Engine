#!/usr/bin/env node

/**
 * MSDS-Engine 官方 MCP 协议标准网关驱动器 (MSDS MCP Gateway Runner)
 * 
 * 核心使命:
 * 1. 作为 Agent 与 MSDS-Engine 原生 MCP 服务端 (mcp-server.js) 的全同构受控协议桥梁；
 * 2. 彻底取缔生产 Agent 私写 ad-hoc 脚本与直接操作 XML/DOCX 的狂野行为；
 * 3. 100% 遵从 JSON-RPC 2.0 规范，提供纯净的参数化调用通道与审计日志追踪。
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { serializeFactsToMarkdown } from '../src/recognition-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_PATH = path.resolve(__dirname, '../src/mcp-server.js');

async function callMcpTool(toolName, toolArgs = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    let messageId = 1;
    const pendingRequests = new Map();
    let stdoutBuffer = '';

    child.stdout.on('data', chunk => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop(); // 保留尚未闭合的尾行
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line.trim());
          if (msg.id && pendingRequests.has(msg.id)) {
            const reqResolve = pendingRequests.get(msg.id);
            pendingRequests.delete(msg.id);
            reqResolve(msg);
          }
        } catch (e) {
          // 忽略非 JSON 行
        }
      }
    });

    child.on('error', err => reject(err));
    child.on('exit', code => {
      if (code !== 0 && pendingRequests.size > 0) {
        reject(new Error(`MCP server process exited with code ${code}`));
      }
    });

    function sendRequest(method, params = {}) {
      return new Promise((res, rej) => {
        const id = messageId++;
        pendingRequests.set(id, res);
        const req = { jsonrpc: '2.0', id, method, params };
        child.stdin.write(JSON.stringify(req) + '\n');
      });
    }

    (async () => {
      try {
        // 1. 标准握手 Initialize
        const initRes = await sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'msds-mcp-gateway', version: '1.0.0' }
        });

        if (!initRes || !initRes.result) {
          throw new Error('MCP handshake failed');
        }

        if (toolName === 'tools/list' || toolName === '__list__') {
          const toolsRes = await sendRequest('tools/list');
          child.stdin.end();
          resolve(toolsRes.result);
          return;
        }

        // 2. 派发受控 Tools Call
        const callRes = await sendRequest('tools/call', {
          name: toolName,
          arguments: toolArgs
        });

        child.stdin.end();

        if (callRes.error) {
          reject(new Error(`MCP Tool [${toolName}] Error: ${JSON.stringify(callRes.error)}`));
          return;
        }

        // 解析 MCP Content 返回
        const content = callRes.result?.content;
        if (Array.isArray(content) && content.length > 0 && content[0].text) {
          try {
            const parsed = JSON.parse(content[0].text);
            resolve(parsed);
          } catch (_) {
            resolve(content[0].text);
          }
        } else {
          resolve(callRes.result);
        }
      } catch (err) {
        child.kill();
        reject(err);
      }
    })();
  });
}

// CLI 参数解析与分发
async function main() {
  const args = process.argv.slice(2);
  let tool = null;
  let toolArgs = {};
  let outPath = null;
  let format = 'json';

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--list-tools' || a === '-l') {
      tool = '__list__';
    } else if (a.startsWith('--tool=')) {
      tool = a.slice(7);
    } else if (a === '--tool' && args[i + 1]) {
      tool = args[++i];
    } else if (a.startsWith('--args=')) {
      toolArgs = JSON.parse(a.slice(7));
    } else if (a === '--args' && args[i + 1]) {
      toolArgs = JSON.parse(args[++i]);
    } else if (a.startsWith('--argsFile=')) {
      const content = await fs.readFile(a.slice(11), 'utf8');
      toolArgs = JSON.parse(content);
    } else if (a === '--argsFile' && args[i + 1]) {
      const content = await fs.readFile(args[++i], 'utf8');
      toolArgs = JSON.parse(content);
    } else if (a.startsWith('--out=')) {
      outPath = a.slice(6);
    } else if (a === '--out' && args[i + 1]) {
      outPath = args[++i];
    } else if (a.startsWith('--format=')) {
      format = a.slice(9).toLowerCase();
    } else if (a === '--format' && args[i + 1]) {
      format = args[++i].toLowerCase();
    } else if (!tool && !a.startsWith('-')) {
      tool = a;
    }
  }

  if (!tool) {
    console.error('用法: node msds_mcp_gateway.mjs --tool=<tool_name> [--args=\'<json_string>\'] [--argsFile=<path_to_json>] [--out=<file>] [--format=json|md]');
    console.error('查询全量工具: node msds_mcp_gateway.mjs --list-tools');
    process.exit(1);
  }

  try {
    const result = await callMcpTool(tool, toolArgs);
    if (tool === '__list__') {
      console.log('=== MSDS-Engine 官方可用 MCP 工具清单 ===');
      console.log(JSON.stringify(result, null, 2));
    } else if (format === 'md' && tool === 'msds_recognize_source') {
      const textPayload = result?.result?.content?.[0]?.text;
      const facts = textPayload ? JSON.parse(textPayload) : (result?.result || result);
      const md = [
        serializeFactsToMarkdown(facts),
        '\n## MCP 统一入口调用与物理无损自检指纹',
        `- **MCP 工具**: \`msds_recognize_source\` (via \`web/scripts/msds_mcp_gateway.mjs\`)`,
        `- **原始非空段落数**: ${facts.integrity?.rawParagraphCount ?? '—'}`,
        `- **原始字符数 / 提取字符数**: ${facts.integrity?.rawCharCount ?? '—'} / ${facts.integrity?.extractedCharCount ?? '—'} (守恒率: ${facts.integrity?.conservationRatio ?? '—'}%)`,
        `- **16 章节覆盖**: ${facts.integrity?.coveredSectionsCount ?? '—'}/16 (空缺: ${facts.integrity?.emptySections?.length ? facts.integrity.emptySections.join(', ') : '无'})`,
        `- **未匹配原始段落数**: ${facts.integrity?.missingParagraphCount ?? '—'}`,
        `- **无损判定**: ${facts.integrity?.isLossless ? 'PASS (100% 无损)' : 'WARN'}`
      ].join('\n');
      if (outPath) {
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, md, 'utf8');
        console.log(JSON.stringify({ status: 'success', tool, format: 'md', outPath, modelCode: facts.modelCode, integrity: facts.integrity }, null, 2));
      } else {
        console.log(md);
      }
    } else {
      const jsonOut = JSON.stringify({ status: 'success', tool, result }, null, 2);
      if (outPath) {
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, jsonOut, 'utf8');
        console.log(JSON.stringify({ status: 'success', tool, format: 'json', outPath }, null, 2));
      } else {
        console.log(jsonOut);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ status: 'error', tool, error: err.message }, null, 2));
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}

export { callMcpTool };
