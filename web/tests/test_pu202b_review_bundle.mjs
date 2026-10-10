import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import jsdom from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const { JSDOM } = jsdom;
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function test() {
  console.log('=== 开始验证 PU-202B 审阅批注 11 项全量闭环 ===\n');

  const pSrc = 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/1-1 单组份水性聚氨酯树脂 PU/PU-202B/PU-202B msds_CN 冠志.docx';
  const pTpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';

  const [srcBuf, tplBuf] = await Promise.all([fs.readFile(pSrc), fs.readFile(pTpl)]);
  const srcDoc = await loadDocx(srcBuf, 'PU-202B.docx');
  const tplDoc = await loadDocx(tplBuf, 'Template.docx');

  // 1. 运行智能匹配
  const matchRes = runSmartMatching(srcDoc.records);
  assert.equal(matchRes.success, true);

  // 批注 2: GHS 象形图检出
  const s2 = matchRes.matchedSections.find(s => s.sectionNumber === 2);
  const picItem = s2.matchedRows.find(r => r.key === 'pictogram');
  console.log('1. 批注 2 (GHS象形图检出):', picItem?.value, 'drawingNode exists?', !!picItem?.drawingNode);
  assert.equal(picItem?.value, '[象形图]');
  assert.ok(picItem?.drawingNode, '必须提取到 drawingNode');

  // 批注 3: 防范说明 P308+P313 保持同行
  const precItem = s2.matchedRows.find(r => r.key === 'precautionary_statements');
  console.log('2. 批注 3 (P308+P313同行):', precItem?.value.includes('P308+P313') || precItem?.value.includes('P308+ P313'));
  assert.ok(!precItem.value.includes('P308+\n'), 'P308+P313 严禁被折行拆分！');

  // 批注 5: Section 11 急性毒性分流
  const s11 = matchRes.matchedSections.find(s => s.sectionNumber === 11);
  const oralItem = s11.matchedRows.find(r => r.key === 'acute_toxicity_oral');
  const inhItem = s11.matchedRows.find(r => r.key === 'acute_toxicity_inhalation');
  const dermItem = s11.matchedRows.find(r => r.key === 'acute_toxicity_dermal');
  console.log('3. 批注 5 (急性毒性分流):', { oral: oralItem?.value, inh: inhItem?.value, derm: dermItem?.value });
  assert.ok(oralItem?.value.includes('4,150mg/kg'), '经口 LD50 必须提取成功');
  assert.ok(inhItem?.value.includes('5.1mg/l'), '吸入 LC50 必须提取成功');
  assert.ok(dermItem?.value.includes('5,000mg/kg'), '经皮 LD50 必须提取成功');

  // 批注 6: 生殖毒性与致畸性细分
  const repFert = s11.matchedRows.find(r => r.key === 'reproductive_fertility');
  const repTerato = s11.matchedRows.find(r => r.key === 'reproductive_teratogenicity');
  console.log('4. 批注 6 (生殖毒性与致畸性分流):', { fert: repFert?.value, terato: repTerato?.value });
  assert.ok(repFert?.value.includes('损坏生育的风险'), '生育力必须匹配');
  assert.ok(repTerato?.value.includes('致畸效应') || repTerato?.value.includes('胎儿'), '致畸形必须匹配');

  // 批注 7: STOT 与附加信息解耦
  const stotSingle = s11.matchedRows.find(r => r.key === 'stot_single');
  const addInfo = s11.matchedRows.find(r => r.key === 'additional_info');
  console.log('5. 批注 7 (STOT与附加信息):', { stot: stotSingle?.value, addInfo: addInfo?.value });
  assert.ok(stotSingle?.value.includes('呼吸道刺激'), 'STOT 必须匹配呼吸道刺激');
  assert.ok(addInfo?.value.includes('经皮吸收危险'), '附加信息必须匹配经皮吸收危险');

  // 批注 1 & 10: Section 12 生态毒性与 EC50 分流
  const s12 = matchRes.matchedSections.find(s => s.sectionNumber === 12);
  const ecoItem = s12.matchedRows.find(r => r.key === 'ecotoxicity');
  const persItem = s12.matchedRows.find(r => r.key === 'persistence');
  const otherAdv = s12.matchedRows.find(r => r.key === 'other_adverse_effects');
  console.log('6. 批注 1 & 10 (生态毒性与其他不利影响分流):', {
    ecotoxicity: ecoItem?.value,
    other_adverse_effects: otherAdv?.value
  });
  assert.ok(ecoItem?.value.includes('虹鳟'), '生态毒性必须包含鱼类');
  assert.ok(ecoItem?.value.includes('藻类') && ecoItem?.value.includes('大型溞'), '生态毒性必须包含藻类与大型溞');
  assert.equal(otherAdv?.value, '无数据资料。', '其他不利影响必须干净归位为无数据资料。');

  // 批注 11: 持久性和降解性前缀补全
  console.log('7. 批注 11 (降解性前缀):', persItem?.value);
  assert.ok(persItem?.value.startsWith('生物降解性：'), '必须保留或补全“生物降解性：”前缀');

  // 2. 写入模板编辑器 (applyMatchResultToEditor)
  const applyRes = applyMatchResultToEditor(matchRes, tplDoc);
  assert.equal(applyRes.success, true);

  // 模板 Section 2 象形图验证
  const sec2Tpl = tplDoc.records.find(r => r.sectionNumber === 2 && r.kind === 'table');
  const picRowTpl = sec2Tpl.rows.find(r => r.cells.some(c => /象形图/i.test(c.text || '')));
  console.log('8. 模板 Section 2 象形图行文本:', picRowTpl?.cells[1]?.text);
  assert.equal(picRowTpl?.cells[1]?.text, '[象形图]');

  // 模板 Section 3 子成分居中验证
  const sec3Tpl = tplDoc.records.find(r => r.sectionNumber === 3 && r.kind === 'table');
  console.log('9. 批注 4 (Section 3 组分列与表头水平居中):');
  sec3Tpl.rows.slice(3).forEach((r, idx) => {
    r.cells.forEach((c, cIdx) => {
      const xml = new XMLSerializer().serializeToString(c.node);
      assert.ok(xml.includes('w:jc') && xml.includes('center'), `Row ${idx+3} Cell ${cIdx} 必须水平居中`);
    });
  });
  console.log('   Section 3 所有组分单元格与表头全部水平居中成功！');

  // 模板 Section 11 急性毒性行保留与致畸形保全
  const sec11Tpl = tplDoc.records.find(r => r.sectionNumber === 11 && r.kind === 'table');
  console.log('10. 模板 Section 11 端点清单:');
  sec11Tpl.rows.forEach((r, idx) => {
    console.log(`   Row ${idx}: ${r.cells.map(c => c.text.replace(/\\n/g, ' ')).join(' | ')}`);
  });
  const hasAcute = sec11Tpl.rows.some(r => r.cells.some(c => /急性毒性/i.test(c.text || '')));
  assert.ok(hasAcute, 'Section 11 急性毒性行绝对不可丢失！');
  const hasTerato = sec11Tpl.rows.some(r => r.cells.some(c => /致畸形/i.test(c.text || '')));
  assert.ok(hasTerato, 'Section 11 致畸形行绝对不可丢失！');
  const hasStot = sec11Tpl.rows.some(r => r.cells.some(c => /特异性靶器官系统毒性/i.test(c.text || '')));
  assert.ok(hasStot, 'Section 11 STOT 行必须存在');

  // 模板 Section 12 承接语与说明行 Row 1 / Row 2 验证
  const sec12Tpl = tplDoc.records.find(r => r.sectionNumber === 12 && r.kind === 'table');
  console.log('11. 模板 Section 12 说明行与端点清单:');
  sec12Tpl.rows.forEach((r, idx) => {
    console.log(`   Row ${idx}: ${r.cells.map(c => c.text.replace(/\\n/g, ' ')).join(' | ')}`);
  });
  assert.ok(sec12Tpl.rows[1].cells[0].text.includes('该产品无可用的生态毒理学研究。'), 'Section 12 Row 1 必须为产品生态说明语');
  assert.ok(sec12Tpl.rows[2].cells[0].text.includes('生态毒理学数据：'), 'Section 12 Row 2 必须为组分生态承接语');

  // 3. 导出 ArrayBuffer 并回读验证
  console.log('\n12. 导出 DOCX 并校验二进制与图片完整性...');
  const outBuf = await tplDoc.exportArrayBuffer();
  assert.ok(outBuf.byteLength > 10000, '导出的 DOCX 大小必须正常');

  const reloaded = await loadDocx(outBuf, 'Exported.docx');
  const reSec2 = reloaded.records.find(r => r.sectionNumber === 2 && r.kind === 'table');
  const rePicRow = reSec2.rows.find(r => r.cells.some(c => /象形图/i.test(c.text || '')));
  const reDrawing = rePicRow.cells[1].node.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'drawing')[0];
  assert.ok(reDrawing, '回读后的文档必须真实包含象形图 <w:drawing> 节点');
  console.log('✅ 回读 DOCX 验证通过：象形图真实嵌入成功！');

  console.log('\n🎉 PU-202B 全部 11 项审阅批注 100% 验证通过！');
}

test().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
