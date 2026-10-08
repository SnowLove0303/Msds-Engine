import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handleApiRequest } from '../src/msds-api-controller.js';

console.log('=== MSDS STUDIO Agent 专用 API 自动化测试套件 ===\n');

// 1. 创建本地轻量测试服务器
const port = 5188;
const server = createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { message: 'Not Found' } }));
  }
});

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
console.log(`✓ 测试 API 服务已启动于: http://127.0.0.1:${port}`);

const baseUrl = `http://127.0.0.1:${port}/api/msds`;
const samplePath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';

try {
  // ==========================================
  // 测试 1：健康检查端点 (GET /health)
  // ==========================================
  const healthRes = await fetch(`${baseUrl}/health`);
  assert.equal(healthRes.status, 200, '健康检查端点必须返回 200');
  const healthJson = await healthRes.json();
  assert.equal(healthJson.success, true, '健康检查必须返回 success=true');
  console.log('✓ 1. 健康检查端点正常');

  // ==========================================
  // 测试 2：导入 MSDS 源文档 (POST /import)
  // ==========================================
  const importRes = await fetch(`${baseUrl}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath: samplePath,
      sessionId: 'test-session',
    }),
  });
  assert.equal(importRes.status, 200, '导入端点必须返回 200');
  const importJson = await importRes.json();
  assert.equal(importJson.success, true, '导入必须成功');
  assert.equal(importJson.sessionId, 'test-session', '会话 ID 必须一致');
  assert.equal(importJson.data.sectionCount, 16, '必须成功识别 16 个 Section');
  console.log(`✓ 2. 导入端点正常：成功解析 ${importJson.data.fileName}，识别 ${importJson.data.sectionCount} 个 Section`);

  // ==========================================
  // 测试 3：获取识别结果 (GET /recognition)
  // ==========================================
  const recogRes = await fetch(`${baseUrl}/recognition?sessionId=test-session`);
  assert.equal(recogRes.status, 200, '识别端点必须返回 200');
  const recogJson = await recogRes.json();
  assert.equal(recogJson.success, true, '识别结果获取必须成功');
  assert(recogJson.data.sections.length >= 16, '识别结果必须包含全部 16 个章节');
  
  const sec3Recog = recogJson.data.sections.find((s) => s.sectionNumber === 3);
  assert(sec3Recog, '识别结果必须包含 Section 3');
  assert(sec3Recog.components.length >= 3, 'Section 3 必须成功识别出至少 3 项组分');
  console.log(`✓ 3. 识别端点正常：16 章节完整提取，组分成功识别: ${sec3Recog.components.map((c) => c.name).join(', ')}`);

  // ==========================================
  // 测试 4：发起智能匹配 (POST /match)
  // ==========================================
  const matchRes = await fetch(`${baseUrl}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'test-session',
      templateVariant: 'CN_GUANZHI',
    }),
  });
  assert.equal(matchRes.status, 200, '匹配端点必须返回 200');
  const matchJson = await matchRes.json();
  assert.equal(matchJson.success, true, '智能匹配必须成功');
  assert(matchJson.data.injectedCount > 0, '注入字段数必须大于 0');
  assert(matchJson.data.prunedCount > 0, '剪枝/删行数必须大于 0');
  console.log(`✓ 4. 智能匹配发起正常：injected=${matchJson.data.injectedCount}, pruned=${matchJson.data.prunedCount}`);

  // ==========================================
  // 测试 5：获取智能匹配结果 - summary 模式 (GET /match-result?format=summary)
  // ==========================================
  const summaryRes = await fetch(`${baseUrl}/match-result?sessionId=test-session&format=summary`);
  assert.equal(summaryRes.status, 200, '匹配结果端点必须返回 200');
  const summaryJson = await summaryRes.json();
  assert.equal(summaryJson.success, true, '匹配结果必须获取成功');
  assert(summaryJson.data.sections.length >= 16, '必须包含 16 个章节匹配结果');

  // 检查 Section 2：无值删行后的 3 个有效项
  const sec2Res = summaryJson.data.sections.find((s) => s.sectionNumber === 2);
  assert(sec2Res, '结果必须包含 Section 2');
  assert.equal(sec2Res.rows.length, 3, 'Section 2 删行后必须精准保留 3 行有效标签-值');
  console.log('✓ 5.1 结果 summary 模式正常：Section 2 精准为 3 行标签-值');

  // 检查 Section 3：三列表格
  const sec3Res = summaryJson.data.sections.find((s) => s.sectionNumber === 3);
  assert(sec3Res && sec3Res.components?.length >= 3, 'Section 3 结果必须包含三列组分数据');
  console.log('✓ 5.2 结果 summary 模式正常：Section 3 组分数据结构完整');

  // ==========================================
  // 测试 6：获取智能匹配结果 - markdown 模式 (GET /match-result?format=markdown)
  // ==========================================
  const mdRes = await fetch(`${baseUrl}/match-result?sessionId=test-session&format=markdown`);
  assert.equal(mdRes.status, 200, 'Markdown 模式必须返回 200');
  const mdJson = await mdRes.json();
  assert.equal(mdJson.success, true, 'Markdown 模式必须成功');
  assert(typeof mdJson.data.markdown === 'string', '返回的 markdown 必须为字符串');
  assert(mdJson.data.markdown.includes('## 第 2 部分：') || mdJson.data.markdown.includes('第 2 部分'), 'Markdown 报告必须包含第 2 部分');
  assert(mdJson.data.markdown.includes('## 第 9 部分：') || mdJson.data.markdown.includes('第 9 部分'), 'Markdown 报告必须包含第 9 部分');
  assert(mdJson.data.markdown.includes('聚氨酯聚合物'), 'Markdown 报告必须包含成分名称');
  console.log('✓ 6. 结果 markdown 模式正常：生成高保真 Markdown 报告文本，供 Agent 直接消费！');

  console.log('\n========================================');
  console.log('AGENT API 全链路自动化测试 100% 通过！');
  console.log('========================================\n');
} finally {
  server.close();
}
