import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { governContext } from '../src/context-governor.js';
import { writeDeliverableViaEditor } from '../src/editor-writer.js';
import { applyCompanyPreset, TEMPLATE_LIBRARY } from '../src/template-editor.js';
import { loadDocx } from '../src/docx-engine.js';

console.log('🧪 开始终轮集成测试: MSDS-Engine 7 阶通用工作流闭环与预设解耦 (全量终审验证)...');

// 1. 验证 applyCompanyPreset 键匹配与自定义对象支持
console.log('\n--- 1. 验证 applyCompanyPreset 键匹配与自定义对象支持 ---');
const dummySessionZh = { templateKey: 'CN_Guanzhi', engine: { records: [] }, isEnglish: false };
const dummySessionEn = { templateKey: 'EN_Guanzhi', engine: { records: [] }, isEnglish: true };

const testGuanzhi = applyCompanyPreset(dummySessionZh, 'GUANZHI');
console.log('applyCompanyPreset(dummySessionZh, "GUANZHI"):', JSON.stringify(testGuanzhi));
assert.strictEqual(testGuanzhi.success, true);

const testGuocai = applyCompanyPreset(dummySessionZh, 'GUOCAI');
console.log('applyCompanyPreset(dummySessionZh, "GUOCAI"):', JSON.stringify(testGuocai));
assert.strictEqual(testGuocai.success, true);

const testGuanzhiEn = applyCompanyPreset(dummySessionEn, 'GUANZHI');
console.log('applyCompanyPreset(dummySessionEn, "GUANZHI"):', JSON.stringify(testGuanzhiEn));
assert.strictEqual(testGuanzhiEn.success, true);

const customPreset = {
  name: '创新特种聚合物材料有限公司',
  shortName: '创新特材',
  address: '上海市浦东新区张江高科园区碧波路888号',
  tel: '021-88889999',
  fax: '021-88880000'
};
const testCustom = applyCompanyPreset(dummySessionZh, customPreset);
console.log('applyCompanyPreset(dummySessionZh, customPreset):', JSON.stringify(testCustom));
assert.strictEqual(testCustom.success, true);
console.log('✅ 1. applyCompanyPreset 增强匹配与自定义企业预设断言 100% 通过');

// 2. 真实端到端流程验证: 源文件 -> Context1 -> Context2 -> editor-writer 装配
console.log('\n--- 2. 端到端工作流验证 (OS-8970) ---');
const sampleSource = path.resolve('算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx');
console.log('源文件路径:', sampleSource);
assert.ok(fs.existsSync(sampleSource), '源文件必须存在');

// 阶段 2: 零损耗识别 Context1
const t0 = Date.now();
const context1 = await recognizeSourceDocx(sampleSource, path.basename(sampleSource));
const tRec = Date.now() - t0;
console.log(`✅ 阶段 2 (识别 Context1) 耗时: ${tRec}ms, 章节数: ${Object.keys(context1.sections || {}).length}, 组分数: ${context1.components?.length || 0}`);

// 阶段 3: 治理为 Context2
const t1 = Date.now();
const governed = governContext(context1);
const tGov = Date.now() - t1;
console.log(`✅ 阶段 3 (治理 Context2) 耗时: ${tGov}ms`);
console.log('Context2 GHS isHazardous:', governed.cn.ghs.isHazardous);
console.log('Context2 GHS signalWord:', governed.cn.ghs.signalWord);
console.log('Context2 英文组分数:', governed.componentsEn.length);

// 阶段 4: 调用 editor-writer 装配 5 种交付物 (含自定义企业预设样本)
const outDir = path.resolve('output/test_workflow_decoupling');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const variants = [
  { tpl: 'CN_Guanzhi', entity: 'GUANZHI', isEn: false, name: 'OS-8970_test_CN_Guanzhi.docx', ctx: { ...context1, ...governed.cn } },
  { tpl: 'CN_Guocai',  entity: 'GUOCAI',  isEn: false, name: 'OS-8970_test_CN_Guocai.docx', ctx: { ...context1, ...governed.cn } },
  { tpl: 'EN_Guanzhi', entity: 'GUANZHI', isEn: true,  name: 'OS-8970_test_EN_Guanzhi.docx', ctx: { ...context1, ...governed.en, components: governed.componentsEn } },
  { tpl: 'EN_Guocai',  entity: 'GUOCAI',  isEn: true,  name: 'OS-8970_test_EN_Guocai.docx', ctx: { ...context1, ...governed.en, components: governed.componentsEn } },
  { tpl: 'CN_Guanzhi', entity: customPreset, isEn: false, name: 'OS-8970_test_CN_CustomCompany.docx', ctx: { ...context1, ...governed.cn } }
];

const results = [];

for (const v of variants) {
  const outPath = path.join(outDir, v.name);
  const tStart = Date.now();
  const res = await writeDeliverableViaEditor({
    templateKey: v.tpl,
    contextData: v.ctx,
    isEnglish: v.isEn,
    entityId: v.entity,
    outputPath: outPath
  });
  const tWrite = Date.now() - tStart;
  const stat = fs.statSync(outPath);
  console.log(`\n✅ 生成交付物: ${v.name} | 耗时: ${tWrite}ms | 大小: ${stat.size} 字节`);
  assert.ok(stat.size > 10000, `${v.name} 大小必须大于 10KB`);

  // 检查 Section 1、Section 9、Section 14 真实内容
  const buf = fs.readFileSync(outPath);
  const engine = await loadDocx(buf, v.name);
  
  // Section 1 供应商与品名
  const s1 = engine.records.find(r => r.sectionNumber === 1);
  const supplierRow = s1?.rows?.find(r => /供应商名称|Company name|Manufacturer|Name of supplier/i.test(r.cells[0]?.text || ''));
  const supplierVal = (supplierRow?.cells[1]?.text || '').trim();

  const prodRow = s1?.rows?.find(r => /中文名称|产品名称|Product\s*name/i.test(r.cells[0]?.text || ''));
  const prodVal = (prodRow?.cells[1]?.text || '').trim();

  console.log(`   [Section 1 验证] 供应商: "${supplierVal}" | 产品名: "${prodVal}"`);
  assert.ok(supplierVal.length > 0, `[${v.name}] 供应商名称必须有值`);
  assert.ok(prodVal.length > 0, `[${v.name}] 产品名称必须有值`);

  // Section 9 理化特性
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  let s9Filled = 0;
  for (const r of (s9?.rows || []).slice(1)) {
    if ((r.cells[1]?.text || '').trim()) s9Filled++;
  }
  console.log(`   [Section 9 验证] 填入理化特性指标数: ${s9Filled}`);
  if (!v.isEn) {
    assert.ok(s9Filled >= 5, `[${v.name}] 中文版 Section 9 理化指标填入数 (${s9Filled}) 必须 >= 5`);
  }

  // Section 14 运输
  const s14 = engine.records.find(r => r.sectionNumber === 14);
  const roadRow = s14?.rows?.find(r => /公路|Road/i.test(r.cells[0]?.text || ''));
  const roadVal = (roadRow?.cells[1]?.text || '').trim();
  console.log(`   [Section 14 验证] 陆运说明: "${roadVal}"`);
  assert.ok(roadVal.length > 0, `[${v.name}] Section 14 必须有运输说明`);

  // Section 4 keepSections
  const s4 = engine.records.find(r => r.sectionNumber === 4);
  let s4Filled = 0;
  for (const r of (s4?.rows || []).slice(1)) {
    if ((r.cells[1]?.text || '').trim()) s4Filled++;
  }
  console.log(`   [Section 4 keepSections 验证] 急救条款数: ${s4Filled}`);
  assert.ok(s4Filled > 0, `[${v.name}] Section 4 通用条款必须得以保留`);

  results.push({
    name: v.name,
    durationMs: tWrite,
    sizeBytes: stat.size,
    supplierName: supplierVal,
    productName: prodVal,
    s9FilledCount: s9Filled,
    s14Transport: roadVal.substring(0, 30) + (roadVal.length > 30 ? '...' : ''),
    s4Provisions: s4Filled
  });
}

console.log('\n========================================================================================');
console.log('📊 终轮集成测试统计汇总:');
console.table(results);
console.log('========================================================================================');
console.log('🎉 验证执行成功！');
