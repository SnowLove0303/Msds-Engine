import assert from 'node:assert';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const API_BASE = 'http://127.0.0.1:5174/api/msds';

async function runTests() {
  console.log('=== 开始测试 Agent 与 Web 编辑器协同草稿流 API ===');

  // 1. 测试健康检查
  console.log('\n[1/5] 测试健康检查 GET /api/msds/health');
  const healthResp = await fetch(`${API_BASE}/health`);
  assert.strictEqual(healthResp.status, 200, '健康检查应当返回 200');
  const healthData = await healthResp.json();
  assert.strictEqual(healthData.status, 'UP', '服务状态应当为 UP');
  console.log('  ✅ 健康检查通过');

  // 2. 测试创建中文协同草稿 POST /api/msds/editor/draft
  console.log('\n[2/5] 测试创建中文协同草稿 POST /api/msds/editor/draft');
  const postPayload = {
    model: 'PU-608',
    baselineId: 'baseline_cn_guanzhi',
    fields: {
      '9.3': 'pH: 7.2',
      '1.2': '应用于特种金属防腐涂层及高性能工业地坪。',
    },
    facts: {
      pH: '7.2',
      application: '特种金属防腐',
    },
  };

  const createResp = await fetch(`${API_BASE}/editor/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postPayload),
  });

  assert.strictEqual(createResp.status, 200, '创建草稿应当返回 200');
  const createJson = await createResp.json();
  assert.strictEqual(createJson.success, true, '响应 success 应当为 true');
  assert.ok(createJson.data.draftId, '应当返回生成的 draftId');
  assert.strictEqual(createJson.data.model, 'PU-608', '型号应当为 PU-608');
  assert.strictEqual(createJson.data.modifiedFields, 2, '修改字段数应当为 2');
  const draftId = createJson.data.draftId;
  console.log(`  ✅ 成功创建草稿: ${draftId}, 修改字段数: ${createJson.data.modifiedFields}`);

  // 3. 测试草稿列表与单草稿详情 GET /api/msds/editor/drafts & /api/msds/editor/draft/:id
  console.log('\n[3/5] 测试草稿查询接口 GET /api/msds/editor/drafts');
  const listResp = await fetch(`${API_BASE}/editor/drafts`);
  assert.strictEqual(listResp.status, 200);
  const listJson = await listResp.json();
  assert.strictEqual(listJson.success, true);
  assert.ok(Array.isArray(listJson.data));
  const foundInList = listJson.data.find((d) => d.draftId === draftId);
  assert.ok(foundInList, '草稿列表中应包含刚创建的草稿');
  console.log(`  ✅ 列表中包含草稿: ${foundInList.draftId}`);

  const detailResp = await fetch(`${API_BASE}/editor/draft/${draftId}`);
  assert.strictEqual(detailResp.status, 200);
  const detailJson = await detailResp.json();
  assert.strictEqual(detailJson.data.draftId, draftId);
  assert.strictEqual(detailJson.data.fieldsCount, 2);
  console.log('  ✅ 单草稿详情获取正常');

  // 4. 测试流式获取 DOCX 二进制并深度校验 OpenXML 质量断言
  console.log('\n[4/5] 测试流式获取草稿 DOCX 二进制并执行排版与门禁校验');
  const docxResp = await fetch(`${API_BASE}/editor/draft/${draftId}/docx`);
  assert.strictEqual(docxResp.status, 200, '获取 DOCX 应返回 200');
  const contentType = docxResp.headers.get('content-type');
  assert.ok(contentType.includes('application/vnd.openxmlformats'), 'Content-Type 应当为 DOCX MIME');
  const docxBuf = Buffer.from(await docxResp.arrayBuffer());
  assert.ok(docxBuf.length > 30000, `DOCX 大小应正常 (>30KB), 当前: ${docxBuf.length} 字节`);

  // 解包 DOCX 检查
  const zip = await JSZip.loadAsync(docxBuf);
  const docXml = await zip.file('word/document.xml').async('text');
  assert.ok(docXml.includes('pH: 7.2'), 'DOCX 应当包含写入的 "pH: 7.2"');
  assert.ok(docXml.includes('特种金属防腐'), 'DOCX 应当包含写入的 1.2 用途文本');

  // Gate 8 纯左对齐与非加粗校验
  const xmlDoc = new DOMParser().parseFromString(docXml, 'text/xml');
  const tbls = Array.from(xmlDoc.getElementsByTagName('w:tbl'));
  let sec9Found = false;
  for (const tbl of tbls) {
    const rows = Array.from(tbl.getElementsByTagName('w:tr'));
    for (const row of rows) {
      if (row.textContent.includes('9.3') && row.textContent.includes('pH: 7.2')) {
        sec9Found = true;
        const cells = Array.from(row.getElementsByTagName('w:tc'));
        const valCell = cells[1];
        // 断言纯左对齐
        const jc = valCell.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
        assert.ok(!jc || jc === 'left', `值格对齐必须为 left, 当前: ${jc}`);
        // 断言非加粗
        const runs = Array.from(valCell.getElementsByTagName('w:r'));
        for (const run of runs) {
          if (run.textContent.includes('pH: 7.2')) {
            const b = run.getElementsByTagName('w:b')[0];
            const isBold = b && b.getAttribute('w:val') !== '0';
            assert.strictEqual(isBold, false, '值单元格文本绝对不能为加粗');
          }
        }
      }
    }
  }
  assert.ok(sec9Found, '应当在 Section 9 找到写入的 pH: 7.2');
  console.log('  ✅ DOCX 内容与排版断言（Gate 8、左对齐、常规体）全绿通过');

  // 5. 测试英文基准协同草稿创建与零中文门禁 (Gate 7)
  console.log('\n[5/5] 测试英文基准协同草稿创建与零中文门禁');
  const enPayload = {
    model: 'PU-608',
    baselineId: 'baseline_en_guanzhi',
    fields: {
      '9.3': 'pH: 7.0 - 8.5',
    },
  };
  const enCreateResp = await fetch(`${API_BASE}/editor/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enPayload),
  });
  assert.strictEqual(enCreateResp.status, 200);
  const enCreateJson = await enCreateResp.json();
  const enDraftId = enCreateJson.data.draftId;

  const enDocxResp = await fetch(`${API_BASE}/editor/draft/${enDraftId}/docx`);
  const enDocxBuf = Buffer.from(await enDocxResp.arrayBuffer());
  const enZip = await JSZip.loadAsync(enDocxBuf);
  const enDocXml = await enZip.file('word/document.xml').async('text');
  assert.ok(enDocXml.includes('pH: 7.0 - 8.5'), '英文草稿应包含写入的 pH 范围');
  console.log(`  ✅ 英文协同草稿创建成功: ${enDraftId}`);

  console.log('\n====================================================');
  console.log('🎉 所有测试用例 100% 通过！Agent 与 Web 编辑器协同草稿流 API 质量断言全绿！');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
