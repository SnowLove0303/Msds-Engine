import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { executeAdaptiveDeliverablesPipeline, executeEightDeliverablesPipeline } from '../src/pipeline-engine.js';
import { runBipolarBilayerAudit } from '../scripts/audit_bipolar_bilayer.mjs';

const SAMPLE_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A';
const SOURCE_DOCX = path.join(SAMPLE_DIR, 'PU-202A msds_CN 冠志.docx');
const MODEL_CODE = 'PU-202A';

if (!fs.existsSync(SOURCE_DOCX)) {
  console.error(`Source docx not found at ${SOURCE_DOCX}`);
  process.exit(1);
}

const TEST_OUT_BASE = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive';

async function cleanupDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

async function runTests() {
  console.log('========================================================================');
  console.log('       自适应多格式流水线引擎验证 (Adaptive Deliverables Pipeline)        ');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // Test Case 1: 单主体英文 DOCX (1 份)
  // 1 preset (Guanzhi) × 1 language (EN) × 1 format (docx) = 1 file
  // -------------------------------------------------------------------------
  console.log('>>> [Test 1] 单主体英文 DOCX (1 份交付物)');
  const test1Dir = path.join(TEST_OUT_BASE, 'test1_single_en_docx');
  await cleanupDir(test1Dir);

  const res1 = await executeAdaptiveDeliverablesPipeline({
    modelCode: MODEL_CODE,
    cnGroundTruthPath: SOURCE_DOCX,
    presetIds: ['preset_guanzhi_cn'],
    languages: ['EN'],
    formats: ['docx'],
    targetDir: test1Dir
  });

  console.log(`Test 1 Deliverables: ${res1.deliverables.length} files`);
  assert.strictEqual(res1.deliverables.length, 1, 'Test 1 产出物数量必须严格为 1');
  assert.strictEqual(res1.deliverables[0].name, `${MODEL_CODE} msds_EN Guanzhi.docx`);
  assert.strictEqual(res1.deliverables[0].format, 'docx');
  assert(fs.existsSync(res1.deliverables[0].path), 'DOCX 文件物理存在');

  const filesInDir1 = fs.readdirSync(test1Dir).filter(f => !fs.statSync(path.join(test1Dir, f)).isDirectory());
  assert.strictEqual(filesInDir1.length, 1, '交付目录纯净，无其他多余文件');
  console.log('✅ Test 1 PASSED: 单主体英文 DOCX 独立精准导出 (1 份)！\n');

  // -------------------------------------------------------------------------
  // Test Case 2: 单主体双语 Word + PDF (4 份)
  // 1 preset (国彩) × 2 languages (CN, EN) × 2 formats (docx, pdf) = 4 files
  // -------------------------------------------------------------------------
  console.log('>>> [Test 2] 单主体双语 Word + PDF (4 份交付物)');
  const test2Dir = path.join(TEST_OUT_BASE, 'test2_single_preset_bilingual');
  await cleanupDir(test2Dir);

  const res2 = await executeAdaptiveDeliverablesPipeline({
    modelCode: MODEL_CODE,
    cnGroundTruthPath: SOURCE_DOCX,
    presetIds: ['preset_guocai_cn'],
    languages: ['CN', 'EN'],
    formats: ['docx', 'pdf'],
    targetDir: test2Dir
  });

  console.log(`Test 2 Deliverables: ${res2.deliverables.length} files`);
  assert.strictEqual(res2.deliverables.length, 4, 'Test 2 产出物数量必须严格为 4');
  
  const expectedNames2 = [
    `${MODEL_CODE} msds_CN 国彩.docx`,
    `${MODEL_CODE} msds_EN Guocai.docx`,
    `${MODEL_CODE} msds_CN 国彩.pdf`,
    `${MODEL_CODE} msds_EN Guocai.pdf`
  ];
  for (const exp of expectedNames2) {
    const found = res2.deliverables.find(d => d.name === exp);
    assert(found, `交付物 ${exp} 必须在返回结果中`);
    assert(fs.existsSync(path.join(test2Dir, exp)), `文件 ${exp} 物理存在`);
  }

  // 运行自适应审计断言
  const auditRes2 = await runBipolarBilayerAudit(test2Dir, MODEL_CODE, {
    expectedDeliverables: expectedNames2
  });
  assert(auditRes2.success, '自适应 4 份交付物必须通过全量硬性审计！');
  console.log('✅ Test 2 PASSED: 单主体双语 Word + PDF (4 份) 审计全绿！\n');

  // -------------------------------------------------------------------------
  // Test Case 3: 双主体双语 Word + PDF (8 份完整矩阵 & 经典门面兼容)
  // 2 presets (冠志, 国彩) × 2 languages (CN, EN) × 2 formats (docx, pdf) = 8 files
  // -------------------------------------------------------------------------
  console.log('>>> [Test 3] 双主体双语 Word + PDF (8 份完整交付矩阵 & 经典门面向下兼容)');
  const test3Dir = path.join(TEST_OUT_BASE, 'test3_eight_deliverables');
  await cleanupDir(test3Dir);

  const res3 = await executeEightDeliverablesPipeline({
    modelCode: MODEL_CODE,
    cnGroundTruthPath: SOURCE_DOCX,
    targetDir: test3Dir
  });

  console.log(`Test 3 Deliverables: ${res3.deliverables.length} files`);
  assert.strictEqual(res3.deliverables.length, 8, 'Test 3 产出物数量必须严格为 8');

  const expectedNames3 = [
    `${MODEL_CODE} msds_CN 冠志.docx`,
    `${MODEL_CODE} msds_CN 冠志.pdf`,
    `${MODEL_CODE} msds_CN 国彩.docx`,
    `${MODEL_CODE} msds_CN 国彩.pdf`,
    `${MODEL_CODE} msds_EN Guanzhi.docx`,
    `${MODEL_CODE} msds_EN Guanzhi.pdf`,
    `${MODEL_CODE} msds_EN Guocai.docx`,
    `${MODEL_CODE} msds_EN Guocai.pdf`
  ];
  for (const exp of expectedNames3) {
    const found = res3.deliverables.find(d => d.name === exp);
    assert(found, `交付物 ${exp} 必须在返回结果中`);
    assert(fs.existsSync(path.join(test3Dir, exp)), `文件 ${exp} 物理存在`);
  }

  const auditRes3 = await runBipolarBilayerAudit(test3Dir, MODEL_CODE);
  assert(auditRes3.success, '标准 8 格式全景深度审计必须全绿！');
  console.log('✅ Test 3 PASSED: 标准 8 格式交付矩阵与深度审计全绿！\n');

  console.log('🏆 恭喜！所有自适应多格式流水线引擎测试 100% 通过！Exit code 0.');
}

runTests().catch(err => {
  console.error('❌ 测试发生异常:', err);
  process.exit(1);
});
