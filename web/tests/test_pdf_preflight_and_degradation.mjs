#!/usr/bin/env node
/**
 * PDF 导出预检与优雅降级回归测试。
 *
 * 覆盖 openspec change `portable-pdf-export-pipeline` 的两条规约：
 *   - Capability Self-Check and Pre-Flight
 *   - Graceful Export Degradation
 *
 * 通过 `MSDS_PDF_DISABLE=1` 构造"转换能力确定不可用"的环境，
 * 使本测试不依赖宿主是否安装转换器，可在任何机器上稳定复现。
 *
 * 用法：node tests/test_pdf_preflight_and_degradation.mjs
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.MSDS_PDF_DISABLE = '1';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(REPO_ROOT, '算法训练材料', 'PU-303C', 'PU-303C msds_CN 冠志 （手动）.docx');

const { handleApiRequest } = await import('../src/msds-api-controller.js');

let failures = 0;
let checks = 0;
function ok(label, condition, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

if (!existsSync(FIXTURE)) {
  console.error(`缺少测试样本：${FIXTURE}`);
  process.exit(1);
}
const fixtureB64 = readFileSync(FIXTURE).toString('base64');

const port = 5197;
const server = createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { message: 'Not Found' } }));
  }
});
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${port}/api/msds`;
console.log(`PDF 预检与降级测试（MSDS_PDF_DISABLE=1，服务 ${base}）\n`);

const postJson = (url, body) => fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

try {
  // ------------------------------------------------------------------ 健康检查
  console.log('场景：健康检查回报能力详情');
  {
    const r = await fetch(`${base}/health`);
    const j = await r.json();
    ok('HTTP 200', r.status === 200, `实际 ${r.status}`);
    ok('旧布尔字段保留且为 false', j.pdfConverterAvailable === false, `实际 ${j.pdfConverterAvailable}`);
    ok('新增能力详情字段存在', Boolean(j.pdfCapability));
    ok('详情含可用性 / 后端 / 字体状态 / 原因',
      j.pdfCapability?.available === false
      && j.pdfCapability?.backend === null
      && typeof j.pdfCapability?.fontsStatus === 'string'
      && typeof j.pdfCapability?.reason === 'string'
      && j.pdfCapability.reason.length > 0);
    ok('四层均有评估记录', Array.isArray(j.pdfCapability?.attempts) && j.pdfCapability.attempts.length === 4,
      `实际 ${j.pdfCapability?.attempts?.length}`);
    ok('给出可操作的补救方式', typeof j.pdfCapability?.remedy === 'string' && j.pdfCapability.remedy.length > 0);
  }

  // ------------------------------------------------------------------ 仅 PDF
  console.log('\n场景：仅 PDF 模式在能力缺失时不产生半成品');
  {
    const r = await postJson(`${base}/export`, {
      format: 'pdf',
      baseDocxBase64: fixtureB64,
      templateName: 'fixture.docx',
      returnType: 'json',
    });
    const j = await r.json();
    ok('以 503 明确失败', r.status === 503, `实际 ${r.status}`);
    ok('失败信息说明缺失原因与补救方式', /原因/.test(j.error?.message || '') && /补救方式/.test(j.error?.message || ''));
    ok('未返回任何半成品文件', !j.files || j.files.length === 0, `files=${j.files?.length}`);
    ok('失败响应携带能力详情', Boolean(j.pdfCapability));
  }

  // ------------------------------------------------------------------ both
  console.log('\n场景：both 模式在 PDF 缺失时仍交付 Word');
  {
    const r = await postJson(`${base}/export`, {
      format: 'both',
      baseDocxBase64: fixtureB64,
      templateName: 'fixture.docx',
      returnType: 'json',
    });
    const j = await r.json();
    ok('HTTP 200 且 success=true', r.status === 200 && j.success === true, `status=${r.status} success=${j.success}`);
    ok('仍然交付了 DOCX 产物', Array.isArray(j.files) && j.files.length > 0 && j.files.every((f) => f.format === 'docx'),
      `files=${JSON.stringify((j.files || []).map((f) => f.format))}`);
    ok('明确标注 PDF 未生成及原因',
      Boolean(j.pdfOmitted) && typeof j.pdfOmitted.reason === 'string' && j.pdfOmitted.reason.length > 0);
    ok('未混入任何 PDF 产物', (j.files || []).every((f) => !/\.pdf$/i.test(f.name)));
    ok('DOCX 内容非空', (j.files || []).every((f) => typeof f.contentBase64 === 'string' && f.contentBase64.length > 0));
  }

  // ------------------------------------------------------------------ 批量端点
  console.log('\n场景：批量转换端点在能力缺失时的错误语义');
  {
    const r = await postJson(`${base}/convert-pdf-batch`, {
      files: [{ name: 'a.docx', bufferBase64: fixtureB64 }],
    });
    const j = await r.json();
    ok('以 503 拒绝', r.status === 503, `实际 ${r.status}`);
    ok('错误信息含原因与补救方式', /原因/.test(j.error?.message || '') && /补救方式/.test(j.error?.message || ''));
    ok('携带能力详情', Boolean(j.pdfCapability));
  }
} finally {
  server.close();
}

console.log(`\n断言 ${checks} 项，失败 ${failures} 项`);
if (failures > 0) {
  console.error('PDF 预检与降级测试未通过');
  process.exit(1);
}
console.log('PDF 预检与降级测试通过');
