import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

async function runTest() {
  console.log('=== Testing End-to-End MCP Workflow ===');

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
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line.trim());
        if (msg.id && pendingRequests.has(msg.id)) {
          const resolve = pendingRequests.get(msg.id);
          pendingRequests.delete(msg.id);
          resolve(msg);
        }
      } catch (err) {
        console.error('Error parsing line from stdout:', line, err);
      }
    }
  });

  function sendRequest(method, params = {}) {
    return new Promise((resolve) => {
      const id = messageId++;
      pendingRequests.set(id, resolve);
      const req = { jsonrpc: '2.0', id, method, params };
      child.stdin.write(JSON.stringify(req) + '\n');
    });
  }

  // 1. 初始化
  await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'e2e-agent', version: '1.0.0' }
  });

  // 2. 识别源文件 (Recognition)
  const sourceFile = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const recRes = await sendRequest('tools/call', {
    name: 'msds_recognize_source',
    arguments: { sourceFilePath: sourceFile }
  });
  const facts = JSON.parse(recRes.result.content[0].text);
  console.log('Step 1 [Recognize]: Model =', facts.modelCode, 'IsHazardous =', facts.ghs.isHazardous, 'Categories =', facts.ghs.categories.length);
  if (!facts.modelCode || facts.ghs.categories.length === 0) {
    throw new Error('Recognition failed to extract core facts');
  }

  // 3. 模板格式检索 (Template Schema)
  const tplRes = await sendRequest('tools/call', {
    name: 'msds_get_template_schema',
    arguments: { templateKey: 'CN_Guanzhi' }
  });
  const tplSchema = JSON.parse(tplRes.result.content[0].text);
  console.log('Step 2 [Template]: Name =', tplSchema.name, 'Sections =', Object.keys(tplSchema.sections).length);

  // 4. 前置制定审计目标 (Audit-Driven Planning)
  const planRes = await sendRequest('tools/call', {
    name: 'msds_plan_audit_targets',
    arguments: { modelCode: facts.modelCode, sourceFacts: facts }
  });
  const contract = JSON.parse(planRes.result.content[0].text);
  console.log('Step 3 [Plan Audit Targets]: Planned files =', contract.targets.global.expectedFiles.length);

  // 5. 原子通道编辑测试 (Editor Channels)
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-e2e-'));
  const testOutPath = path.join(tempDir, 'e2e_edit_output.docx');
  const editRes = await sendRequest('tools/call', {
    name: 'msds_execute_editor_ops',
    arguments: {
      templateKey: 'CN_Guanzhi',
      outputPath: testOutPath,
      operations: [
        { op: 'clearTemplate' },
        { op: 'writeCell', sectionNumber: 1, rowIndex: 2, cellIndex: 1, text: '水性聚氨酯树脂分散体 PU-218A' },
        { op: 'formatLaserTabs' }
      ]
    }
  });
  const editData = JSON.parse(editRes.result.content[0].text);
  console.log('Step 4 [Editor Ops]: Success =', editData.success, 'Size =', editData.sizeBytes);
  if (!editData.success || !fs.existsSync(testOutPath)) {
    throw new Error('Editor operations failed to output docx');
  }
  fs.rmSync(tempDir, { recursive: true, force: true });

  // 6. 批量导出八格式交付物 (Batch Export Eight)
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A';
  console.log('Step 5 [Batch Export Eight]: Exporting fresh 8 deliverables...');
  const exportRes = await sendRequest('tools/call', {
    name: 'msds_batch_export_eight',
    arguments: {
      modelCode: 'PU-218A',
      sourceFilePath: sourceFile,
      targetDir
    }
  });
  const exportData = JSON.parse(exportRes.result.content[0].text);
  console.log('Export success =', exportData.success, 'Deliverables =', exportData.deliverables?.length);

  // 7. 机械终审核销 (Audit Verification)
  console.log('Step 6 [Audit Verification]: Running bipolar bilayer audit...');
  const auditRes = await sendRequest('tools/call', {
    name: 'msds_audit_deliverables',
    arguments: { targetDir, modelCode: 'PU-218A' }
  });
  const auditData = JSON.parse(auditRes.result.content[0].text);
  console.log('Audit Verification: Success =', auditData.success, 'Failures =', auditData.failCount);
  if (!auditData.success || auditData.failCount !== 0) {
    throw new Error(`Audit verification reported ${auditData.failCount} failures`);
  }

  child.stdin.end();
  await new Promise(r => child.on('exit', r));

  console.log('🎉 Full End-to-End MCP Pipeline Test 100% PASSED (Exit Code 0)');
}

runTest().catch(err => {
  console.error('❌ E2E Test FAILED:', err);
  process.exit(1);
});
