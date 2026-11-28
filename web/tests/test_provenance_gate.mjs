import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  initProvenanceManifest,
  recordProvenancePhase,
  recordProvenanceDeliverable
} from '../src/provenance-ledger.js';
import { auditPhase0Provenance } from '../src/staged-mechanical-audit.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// 1. 正向测试：完整血缘链 + 匹配交付物 -> 通过
{
  const dir = makeTempDir('msds-prov-ok-');
  const srcFile = path.join(dir, 'source.docx');
  const outDocx = path.join(dir, 'TEST-01 msds_CN 冠志.docx');
  fs.writeFileSync(srcFile, 'mock-source-docx');
  fs.writeFileSync(outDocx, 'mock-output-docx');

  const manifestPath = initProvenanceManifest({
    targetDir: dir,
    runId: 'run_test_01',
    modelCode: 'TEST-01',
    sourcePath: srcFile,
    entrypoint: 'run_standard_production.mjs'
  });
  recordProvenancePhase(manifestPath, 'PHASE_1_CONTEXT1', { data: { sections: 16 } });
  recordProvenancePhase(manifestPath, 'PHASE_2_CONTEXT2', { data: { valid: true } });
  recordProvenancePhase(manifestPath, 'PHASE_5_EXPORT', { data: { count: 1 } });
  recordProvenanceDeliverable(manifestPath, outDocx);

  const res = auditPhase0Provenance({ targetDir: dir, modelCode: 'TEST-01' });
  assert.equal(res.ok, true, `预期通过，实际发现违规: ${JSON.stringify(res.findings)}`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('✅ PASS: 完整血缘链与交付物指纹校验通过');
}

// 2. 负向测试：缺少 .run_manifest.json（模拟绕过标准流程）-> 阻断
{
  const dir = makeTempDir('msds-prov-missing-');
  fs.writeFileSync(path.join(dir, 'TEST-02 msds_CN 冠志.docx'), 'bypassed-docx');
  const res = auditPhase0Provenance({ targetDir: dir, modelCode: 'TEST-02' });
  assert.equal(res.ok, false);
  assert.ok(res.findings.some(f => f.ruleId === 'P0_PROVENANCE_CHAIN'));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('✅ PASS: 缺失 .run_manifest.json 成功触发 P0_PROVENANCE_CHAIN 阻断');
}

// 3. 负向测试：交付物被外部脚本篡改（SHA-256 不匹配）-> 阻断
{
  const dir = makeTempDir('msds-prov-tamper-');
  const outDocx = path.join(dir, 'TEST-03 msds_CN 冠志.docx');
  fs.writeFileSync(outDocx, 'original-docx');
  const manifestPath = initProvenanceManifest({
    targetDir: dir,
    runId: 'run_test_03',
    modelCode: 'TEST-03',
    entrypoint: 'run_standard_production.mjs'
  });
  recordProvenancePhase(manifestPath, 'PHASE_1_CONTEXT1', { data: { ok: 1 } });
  recordProvenancePhase(manifestPath, 'PHASE_2_CONTEXT2', { data: { ok: 1 } });
  recordProvenancePhase(manifestPath, 'PHASE_5_EXPORT', { data: { ok: 1 } });
  recordProvenanceDeliverable(manifestPath, outDocx);

  fs.writeFileSync(outDocx, 'tampered-by-adhoc-script');
  const res = auditPhase0Provenance({ targetDir: dir, modelCode: 'TEST-03' });
  assert.equal(res.ok, false);
  assert.ok(res.findings.some(f => f.ruleId === 'P0_PROVENANCE_CHAIN' && f.measuredDetail.includes('SHA-256')));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('✅ PASS: 交付物外部篡改成功触发 P0_PROVENANCE_CHAIN 阻断');
}

// 4. 负向测试：目标目录存在 ad-hoc 临时脚本 -> 阻断
{
  const dir = makeTempDir('msds-prov-adhoc-');
  const outDocx = path.join(dir, 'TEST-04 msds_CN 冠志.docx');
  fs.writeFileSync(outDocx, 'ok-docx');
  fs.writeFileSync(path.join(dir, 'hack_fix.py'), 'print("bypass")');
  const manifestPath = initProvenanceManifest({
    targetDir: dir,
    runId: 'run_test_04',
    modelCode: 'TEST-04',
    entrypoint: 'run_standard_production.mjs'
  });
  recordProvenancePhase(manifestPath, 'PHASE_1_CONTEXT1', { data: { ok: 1 } });
  recordProvenancePhase(manifestPath, 'PHASE_2_CONTEXT2', { data: { ok: 1 } });
  recordProvenancePhase(manifestPath, 'PHASE_5_EXPORT', { data: { ok: 1 } });
  recordProvenanceDeliverable(manifestPath, outDocx);

  const res = auditPhase0Provenance({ targetDir: dir, modelCode: 'TEST-04' });
  assert.equal(res.ok, false);
  assert.ok(res.findings.some(f => f.ruleId === 'P0_NO_ADHOC_SCRIPTS'));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('✅ PASS: 检测到临时 ad-hoc 脚本成功触发 P0_NO_ADHOC_SCRIPTS 阻断');
}
