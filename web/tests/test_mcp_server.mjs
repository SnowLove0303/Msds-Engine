import { spawn } from 'child_process';
import path from 'path';

async function runTest() {
  console.log('=== Testing MSDS MCP Server ===');

  const serverPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/mcp-server.js';
  const child = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  let messageId = 1;
  const pendingRequests = new Map();

  let buffer = '';
  child.stdout.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep last incomplete line
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line.trim());
      if (msg.id && pendingRequests.has(msg.id)) {
        const resolve = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        resolve(msg);
      }
    }
  });

  function sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, resolve);
      const req = { jsonrpc: '2.0', id, method, params };
      child.stdin.write(JSON.stringify(req) + '\n');
    });
  }

  // 1. Initialize
  const initRes = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
  console.log('Initialize response:', initRes.result.serverInfo);
  if (initRes.result.serverInfo.name !== 'msds-engine-mcp') {
    throw new Error('Server name mismatch');
  }

  // 2. tools/list
  const toolsRes = await sendRequest('tools/list');
  const tools = toolsRes.result.tools;
  console.log('Tools available:', tools.map(t => t.name));
  if (tools.length !== 10) {
    throw new Error(`Expected 10 tools, got ${tools.length}`);
  }

  // 3. call msds_get_template_schema
  const schemaCallRes = await sendRequest('tools/call', {
    name: 'msds_get_template_schema',
    arguments: { templateKey: 'CN_Guanzhi' }
  });
  const schemaData = JSON.parse(schemaCallRes.result.content[0].text);
  console.log('Template schema tool call success:', schemaData.name);
  if (!schemaData.sections) {
    throw new Error('Template schema missing sections');
  }

  // 4. call msds_plan_audit_targets
  const planCallRes = await sendRequest('tools/call', {
    name: 'msds_plan_audit_targets',
    arguments: { modelCode: 'PU-218A', sourceFacts: {} }
  });
  const planData = JSON.parse(planCallRes.result.content[0].text);
  console.log('Plan audit targets call success, expected files:', planData.targets.global.expectedFiles.length);

  child.stdin.end();
  await new Promise(r => child.on('exit', r));

  console.log('🎉 MSDS MCP Server Test PASSED (Exit Code 0)');
}

runTest().catch(err => {
  console.error('❌ MCP Server Test FAILED:', err);
  process.exit(1);
});
