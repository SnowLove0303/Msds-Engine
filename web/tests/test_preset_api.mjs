import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import { handleApiRequest } from '../src/msds-api-controller.js';

console.log('=== 测试：MSDS-Engine 预设接口体系与 PDF 同步导出套件 ===\n');

// 启动测试 HTTP 内存服务
const server = http.createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not handled' }));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/api/msds`;

async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

try {
  // 1. 验证健康检查与 PDF 转换器就绪状态
  console.log('--- 1. 验证健康检查接口 ---');
  const healthRes = await request('/health');
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.data.success, true);
  assert.equal(healthRes.data.pdfConverterAvailable, true, '本机必须就绪 LibreOffice PDF 转换工具');
  console.log('✅ 健康检查通过，PDF 转换能力已就绪\n');

  // 2. 验证预设列表与国彩中英文内置预设
  console.log('--- 2. 验证预设查询接口 (GET /presets) ---');
  const listRes = await request('/presets');
  assert.equal(listRes.status, 200);
  assert.ok(listRes.data.data.length >= 4, '必须至少包含 4 个官方内置预设');

  const guocaiCn = listRes.data.data.find((p) => p.id === 'preset_guocai_cn');
  assert.ok(guocaiCn, '必须存在 preset_guocai_cn');
  assert.equal(guocaiCn.name, '国彩中文标准预设');
  assert.equal(guocaiCn.entity, '国彩');
  assert.equal(guocaiCn.language, 'CN');
  assert.equal(guocaiCn.isBuiltin, true);
  assert.equal(guocaiCn.fieldOverrides.supplier_name, '英德市国彩精细化工有限公司');
  assert.equal(guocaiCn.fieldOverrides.phone, '86-763-2811205');
  assert.equal(guocaiCn.fieldOverrides.fax, '86-763-2811024');
  assert.equal(guocaiCn.headerFooterOverrides.company, '英德市国彩新材料有限公司');

  const guocaiEn = listRes.data.data.find((p) => p.id === 'preset_guocai_en');
  assert.ok(guocaiEn, '必须存在 preset_guocai_en');
  assert.equal(guocaiEn.name, '国彩英文标准预设');
  assert.equal(guocaiEn.entity, '国彩');
  assert.equal(guocaiEn.language, 'EN');
  assert.equal(guocaiEn.isBuiltin, true);
  assert.equal(guocaiEn.fieldOverrides.supplier_name, 'Yingde Guocai Fine Chemical Co., Ltd.');
  assert.equal(guocaiEn.headerFooterOverrides.company, 'Yingde Guocai New Material Co., Ltd.');

  console.log('✅ 国彩中英文预设参数核验 100% 达标\n');

  // 3. 验证预设单项查询 (GET /presets/:id)
  console.log('--- 3. 验证预设详情接口 (GET /presets/:id) ---');
  const detailRes = await request('/presets/preset_guocai_cn');
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.data.data.id, 'preset_guocai_cn');
  console.log('✅ 预设详情接口核验通过\n');

  // 4. 验证自定义预设增删改查
  console.log('--- 4. 验证自定义预设 CRUD ---');
  const createRes = await request('/presets', {
    method: 'POST',
    body: {
      id: 'preset_test_custom',
      name: '自动化测试预设',
      entity: '国彩',
      language: 'CN',
      fieldOverrides: {
        supplier_name: '测试客户定制有限公司',
      },
      headerFooterOverrides: {
        company: '测试客户定制有限公司',
      },
    },
  });
  assert.equal(createRes.status, 200);
  assert.equal(createRes.data.data.name, '自动化测试预设');

  // 4.1 更新
  const updateRes = await request('/presets/preset_test_custom', {
    method: 'PUT',
    body: {
      name: '自动化测试预设（已更新）',
      fieldOverrides: {
        supplier_name: '测试更新供应商',
      },
    },
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.data.name, '自动化测试预设（已更新）');

  // 4.2 删除自定义预设
  const delRes = await request('/presets/preset_test_custom', { method: 'DELETE' });
  assert.equal(delRes.status, 200);
  assert.equal(delRes.data.id, 'preset_test_custom');

  // 4.3 内置预设防删保护
  const delBuiltinRes = await request('/presets/preset_guocai_cn', { method: 'DELETE' });
  assert.equal(delBuiltinRes.status, 400);
  assert.match(delBuiltinRes.data.error.message, /禁止删除/);
  console.log('✅ 自定义预设增删改查与内置保护均通过\n');

  // 5. 端到端会话流：导入 -> 智能匹配 -> 应用国彩预设 -> 同步导出 DOCX + PDF
  console.log('--- 5. 验证端到端国彩预设应用与 DOCX/PDF 同步导出 ---');
  const testSessionId = `test_sess_${Date.now()}`;
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx';

  // 5.1 导入
  const importRes = await request('/import', {
    method: 'POST',
    body: {
      sessionId: testSessionId,
      filePath: srcPath,
      templateVariant: 'CN_GUANZHI',
    },
  });
  assert.equal(importRes.status, 200);

  // 5.2 匹配
  const matchRes = await request('/match', {
    method: 'POST',
    body: { sessionId: testSessionId },
  });
  assert.equal(matchRes.status, 200);

  // 5.3 应用国彩中文预设 (优先级覆盖)
  const applyRes = await request('/presets/apply', {
    method: 'POST',
    body: {
      sessionId: testSessionId,
      presetId: 'preset_guocai_cn',
    },
  });
  assert.equal(applyRes.status, 200);
  assert.equal(applyRes.data.presetId, 'preset_guocai_cn');
  assert.ok(applyRes.data.appliedFieldsCount > 0);

  // 5.4 导出 DOCX + PDF 同步版本
  const exportRes = await request('/export', {
    method: 'POST',
    body: {
      sessionId: testSessionId,
      format: 'both',
      includeBase: true,
      presetIds: ['preset_guocai_cn'],
    },
  });
  assert.equal(exportRes.status, 200);
  assert.equal(exportRes.data.success, true);
  assert.ok(exportRes.data.files.length >= 2, '必须同时生成 DOCX 和 PDF 成果物');

  const docxFile = exportRes.data.files.find((f) => f.format === 'docx' && f.presetId === 'preset_guocai_cn');
  assert.ok(docxFile, '必须导出国彩预设 DOCX');
  assert.ok(docxFile.size > 20000, 'DOCX 体积必须大于 20KB');
  assert.ok(docxFile.contentBase64.length > 0);

  const pdfFile = exportRes.data.files.find((f) => f.format === 'pdf' && f.presetId === 'preset_guocai_cn');
  assert.ok(pdfFile, '必须导出国彩预设 PDF');
  assert.ok(pdfFile.size > 50000, 'PDF 体积必须大于 50KB');
  assert.ok(pdfFile.durationMs > 0, 'PDF 耗时记录有效');

  console.log(`✅ 成功同步导出 DOCX（${Math.round(docxFile.size / 1024)} KB）与 PDF（${Math.round(pdfFile.size / 1024)} KB，耗时 ${pdfFile.durationMs}ms）\n`);

  console.log('🎉 预设接口体系、国彩中英文预设与 PDF 同步产出全量集成校验 100% 通过！\n');
} finally {
  server.close();
}
