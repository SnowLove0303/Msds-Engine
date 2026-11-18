import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { handleApiRequest } from '../src/msds-api-controller.js';

// 启动测试内存 HTTP 服务器
const server = http.createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  }
});

async function postJson(port, pathName, payload) {
  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathName,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Test API Server running on port ${port}`);

  try {
    const testTargetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/test_output_ep1702_pipeline';
    await fs.mkdir(testTargetDir, { recursive: true });

    // 测试 1: 分阶段调用 (Step-by-Step Stage 1 -> Stage 2 -> Stage 3 -> Stage 4)
    console.log('--- 测试阶段 1: POST /api/msds/pipeline/base-cn ---');
    const s1Res = await postJson(port, '/api/msds/pipeline/base-cn', {
      sessionId: 'test-sess-1',
      model: 'EP-1702',
      cnGroundTruthPath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志 (手动调整）.docx'
    });
    assert.equal(s1Res.status, 200);
    assert.equal(s1Res.json.success, true);
    assert.equal(s1Res.json.stage, 1);
    console.log('✅ Stage 1 通过: base-cn 建立成功');

    console.log('--- 测试阶段 2: POST /api/msds/pipeline/base-en ---');
    const s2Res = await postJson(port, '/api/msds/pipeline/base-en', {
      sessionId: 'test-sess-1',
      facts: {
        solids: '53±2%',
        waterRange: '35-45',
        etherRange: '2-8'
      }
    });
    assert.equal(s2Res.status, 200);
    assert.equal(s2Res.json.success, true);
    assert.equal(s2Res.json.stage, 2);
    console.log('✅ Stage 2 通过: base-en 派生成功');

    console.log('--- 测试阶段 3: POST /api/msds/pipeline/apply-presets ---');
    const s3Res = await postJson(port, '/api/msds/pipeline/apply-presets', {
      sessionId: 'test-sess-1',
      entityId: 'GUOCAI'
    });
    assert.equal(s3Res.status, 200);
    assert.equal(s3Res.json.success, true);
    assert.equal(s3Res.json.stage, 3);
    console.log('✅ Stage 3 通过: 预设变体挂载成功');

    console.log('--- 测试阶段 4: POST /api/msds/pipeline/export-all ---');
    const s4Res = await postJson(port, '/api/msds/pipeline/export-all', {
      sessionId: 'test-sess-1',
      targetDir: testTargetDir
    });
    assert.equal(s4Res.status, 200);
    assert.equal(s4Res.json.success, true);
    assert.equal(s4Res.json.stage, 4);
    assert.equal(s4Res.json.deliverables.length, 8);
    console.log('✅ Stage 4 通过: 8 份文件高速并行导出成功');

    // 测试 2: 一键原子执行接口 POST /api/msds/pipeline/generate-eight
    console.log('--- 测试原子接口: POST /api/msds/pipeline/generate-eight ---');
    const atomicRes = await postJson(port, '/api/msds/pipeline/generate-eight', {
      model: 'EP-1702',
      cnGroundTruthPath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志 (手动调整）.docx',
      targetDir: testTargetDir,
      facts: {
        solids: '53±2%',
        waterRange: '35-45',
        etherRange: '2-8'
      }
    });
    assert.equal(atomicRes.status, 200);
    assert.equal(atomicRes.json.success, true);
    assert.equal(atomicRes.json.deliverables.length, 8);
    console.log(`✅ 一键门面接口通过: 8 格式全部产出完成，耗时: ${atomicRes.json.durationMs}ms`);

    // 清理测试临时输出目录
    await fs.rm(testTargetDir, { recursive: true, force: true });
    console.log('🎉 全部 Pipeline API 测试均 100% 验证通过！');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  server.close();
  process.exit(1);
});
