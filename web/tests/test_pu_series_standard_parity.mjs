import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor, runAutomatedAudits } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== 测试：PU-1001 至 PU-1004 标准答案 Parity 与导出重载闭环验证 ===\n');

const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));

const sampleConfigs = [
  {
    model: 'PU-1001',
    expectedS2Rows: [12, 15],
    expectedComponent: '聚氨酯分散体',
  },
  {
    model: 'PU-1002',
    expectedS2Rows: [12, 15],
    expectedComponent: '水性聚氨酯树脂分散体',
  },
  {
    model: 'PU-1003',
    expectedS2Rows: [12, 15],
    expectedComponent: '聚氨酯分散体',
  },
  {
    model: 'PU-1004',
    expectedS2Rows: [12, 15],
    expectedComponent: '聚氨酯分散体',
  },
];

for (const cfg of sampleConfigs) {
  console.log(`\n----------------- 开始验证：${cfg.model} -----------------`);
  const sPath = new URL(`../../scratch/standard-compare/${cfg.model}_source_CN.docx`, import.meta.url);
  const sBuf = await fs.readFile(sPath);

  const sEngine = await loadDocx(sBuf, `${cfg.model}_source.docx`);
  const tEngine = await loadDocx(tplBuf, 'template.docx');

  // 1. 执行智能匹配与注入
  const matchResult = runSmartMatching(sEngine.records);
  const injectRes = applyMatchResultToEditor(matchResult, tEngine);
  console.log(`✓ 匹配与注入完成: injected=${injectRes.injectedCount}, pruned=${injectRes.prunedCount}`);

  // 2. 导出 DOCX 二进制并使用 loadDocx 重新加载验证 (Roundtrip Reload)
  const exportedBuf = await tEngine.exportArrayBuffer();
  assert(exportedBuf && exportedBuf.byteLength > 0, '导出的 DOCX 必须为非空二进制');
  const reloadedEngine = await loadDocx(exportedBuf, `${cfg.model}_exported.docx`);

  // 3. 校验 Section 1：中文名称型号前半角空格规范
  const s1 = reloadedEngine.records.find((r) => r.sectionNumber === 1);
  assert(s1, '必须存在 Section 1');
  const cnNameRow = s1.rows.find((r) => r.cells.some((c) => /中文名称/i.test(c.text || '')));
  assert(cnNameRow, 'Section 1 必须包含中文名称行');
  const cnNameVal = (cnNameRow.cells[cnNameRow.cells.length - 1].text || '').trim();
  console.log(`✓ Section 1 中文名称: "${cnNameVal}"`);
  assert(
    new RegExp(`\\s+${cfg.model}`, 'i').test(cnNameVal),
    `中文名称中的型号前必须包含半角空格，实际为: "${cnNameVal}"`
  );

  // 4. 校验 Section 2：多槽位行投影与行数收敛 (12 ~ 15 行)
  const s2 = reloadedEngine.records.find((r) => r.sectionNumber === 2);
  assert(s2, '必须存在 Section 2');
  console.log(`✓ Section 2 行数: ${s2.rows.length}`);
  assert(
    s2.rows.length >= cfg.expectedS2Rows[0] && s2.rows.length <= cfg.expectedS2Rows[1],
    `Section 2 行数必须在 [${cfg.expectedS2Rows[0]}, ${cfg.expectedS2Rows[1]}] 区间，实际为: ${s2.rows.length}`
  );
  // 确认无空值“紧急情况概述”行
  const hasEmergencyOverview = s2.rows.some((r) => /紧急情况概述/i.test(r.cells[0]?.text || ''));
  assert.equal(hasEmergencyOverview, false, 'Section 2 无值紧急情况概述行必须已被安全物理删除');

  // 确认 GHS 分类、信号词、危险性说明、防范说明存在
  const hasClassification = s2.rows.some((r) => /GHS危险性类别/i.test(r.cells[0]?.text || ''));
  const hasSignalWord = s2.rows.some((r) => /信号词/i.test(r.cells[0]?.text || ''));
  const hasHazards = s2.rows.some((r) => /危险性说明/i.test(r.cells[0]?.text || ''));
  const hasPrecautionary = s2.rows.some((r) => /防范说明/i.test(r.cells[0]?.text || ''));
  assert(hasClassification, 'Section 2 必须包含 GHS 危险性类别行');
  assert(hasSignalWord, 'Section 2 必须包含信号词行');
  assert(hasHazards, 'Section 2 必须包含危险性说明行');
  assert(hasPrecautionary, 'Section 2 必须包含防范说明行');

  // 校验编号连续性
  const seqs = [];
  for (let i = 1; i < s2.rows.length; i++) {
    const m = s2.rows[i].cells[0]?.text?.match(/2\.(\d+)/);
    if (m) seqs.push(Number(m[1]));
  }
  for (let i = 0; i < seqs.length; i++) {
    assert.equal(seqs[i], i + 1, `Section 2 序号必须严格连续，第 ${i + 1} 个序号应为 2.${i + 1}，实际为 2.${seqs[i]}`);
  }

  // 5. 校验 Section 3：组分名称保真
  const s3 = reloadedEngine.records.find((r) => r.sectionNumber === 3);
  assert(s3, '必须存在 Section 3');
  const s3AllText = s3.rows.map((r) => r.cells.map((c) => c.text).join(' ')).join('\n');
  assert(
    s3AllText.includes(cfg.expectedComponent),
    `Section 3 组分名称必须包含 "${cfg.expectedComponent}"，实际内容:\n${s3AllText}`
  );
  console.log(`✓ Section 3 组分名称保真包含: "${cfg.expectedComponent}"`);

  // 6. 校验 Section 4：CN 模板 Profile 绑定，无旧模板残留
  const s4 = reloadedEngine.records.find((r) => r.sectionNumber === 4);
  assert(s4, '必须存在 Section 4');
  assert.equal(s4.rows.length, 6, 'Section 4 行数必须保持 6 行');
  for (let rIdx = 1; rIdx < s4.rows.length; rIdx++) {
    const valText = (s4.rows[rIdx].cells[s4.rows[rIdx].cells.length - 1].text || '').trim();
    assert(valText.length > 0, `Section 4 第 ${rIdx} 行值单元格不能为空`);
  }
  console.log(`✓ Section 4 6行值单元格已全部稳定注入`);

  // 7. 校验 Section 5：语义分行 (\n) 保留
  const s5 = reloadedEngine.records.find((r) => r.sectionNumber === 5);
  assert(s5, '必须存在 Section 5');
  const s53Row = s5.rows.find((r) => r.cells.some((c) => /特殊危害/i.test(c.text || '')));
  const s54Row = s5.rows.find((r) => r.cells.some((c) => /预防措施和保护设备/i.test(c.text || '')));
  assert(s53Row, 'Section 5 必须存在 5.3 特殊危害行');
  assert(s54Row, 'Section 5 必须存在 5.4 预防措施和保护设备行');
  const s53Val = s53Row.cells[s53Row.cells.length - 1].text || '';
  const s54Val = s54Row.cells[s54Row.cells.length - 1].text || '';
  assert(s53Val.includes('\n'), `5.3 特殊危害必须保留语义换行 \\n，实际为:\n${JSON.stringify(s53Val)}`);
  assert(s54Val.includes('\n'), `5.4 保护设备必须保留语义换行 \\n，实际为:\n${JSON.stringify(s54Val)}`);
  console.log(`✓ Section 5 语义换行已成功保留`);

  // 8. 校验 Section 11：严格收敛为 2 行，杜绝端点残留与幽灵数据
  const s11 = reloadedEngine.records.find((r) => r.sectionNumber === 11);
  assert(s11, '必须存在 Section 11');
  console.log(`✓ Section 11 行数: ${s11.rows.length}`);
  assert.equal(s11.rows.length, 2, `Section 11 必须严格收敛为 2 行，实际为: ${s11.rows.length}`);
  assert(
    s11.rows[1].cells[0]?.text?.includes('该产品无可用的毒理学研究'),
    `Section 11 第 2 行必须为产品级说明，实际为: "${s11.rows[1].cells[0]?.text}"`
  );

  // 9. 校验 Section 12：严格收敛为 2 行
  const s12 = reloadedEngine.records.find((r) => r.sectionNumber === 12);
  assert(s12, '必须存在 Section 12');
  console.log(`✓ Section 12 行数: ${s12.rows.length}`);
  assert.equal(s12.rows.length, 2, `Section 12 必须严格收敛为 2 行，实际为: ${s12.rows.length}`);
  assert(
    s12.rows[1].cells[0]?.text?.includes('生态'),
    `Section 12 第 2 行必须为产品级生态说明，实际为: "${s12.rows[1].cells[0]?.text}"`
  );

  // 10. 校验 Section 15：9 行完整结构，5 法规顺序固定，GB 15258 绝不丢失
  const s15 = reloadedEngine.records.find((r) => r.sectionNumber === 15);
  assert(s15, '必须存在 Section 15');
  console.log(`✓ Section 15 行数: ${s15.rows.length}`);
  assert.equal(s15.rows.length, 9, `Section 15 必须为 9 行，实际为: ${s15.rows.length}`);
  const s15Texts = s15.rows.map((r) => (r.cells[0]?.text || '').trim());
  assert(s15Texts[1].includes('物质或混合物的相关安全'), 'Section 15 第 1 项应为安全法律法规说明');
  assert(s15Texts[2].includes('其它的规定'), 'Section 15 第 2 项应为其它的规定');
  assert(s15Texts[3].includes('符合下列法规要求'), 'Section 15 第 3 项应为符合下列法规要求');
  assert(s15Texts[4].includes('危险化学品安全管理条例'), 'Section 15 第 4 项应为危险化学品安全管理条例');
  assert(s15Texts[5].includes('GB/T 16483'), 'Section 15 第 5 项应为 GB/T 16483');
  assert(s15Texts[6].includes('GB 13690'), 'Section 15 第 6 项应为 GB 13690');
  assert(s15Texts[7].includes('GB 30000'), 'Section 15 第 7 项应为 GB 30000');
  assert(s15Texts[8].includes('GB 15258'), 'Section 15 第 8 项应为 GB 15258');
  console.log(`✓ Section 15 完整 5 项法定法规严格按序呈现，GB 15258 100% 保全`);

  // 11. 全局审计幽灵残留
  const audits = runAutomatedAudits(reloadedEngine, matchResult);
  const ghostIssues = (audits.issues || []).filter((a) => a.type === 'GHOST_RESIDUAL');
  assert.equal(ghostIssues.length, 0, `不能存在幽灵文本残留: ${JSON.stringify(ghostIssues)}`);
  console.log(`✓ 全局审计无任何示范幽灵数据残留`);
}

console.log('\n======================================================');
console.log('🎉 PU-1001 至 PU-1004 全部 Parity 与导出重载闭环断言 100% 通过！');
console.log('======================================================\n');
