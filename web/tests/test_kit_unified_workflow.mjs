import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const KIT_RUNNER = path.join(REPO_ROOT, '体系交接文档/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs');
const KIT_RUNNER_STD = path.join(REPO_ROOT, '标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs');
const KIT_AUDIT_PREP = path.join(REPO_ROOT, '体系交接文档/MSDS_Studio_Agent_Test_Kit/run_three_task_audit_prep.mjs');
const CN_TEMPLATE = path.join(REPO_ROOT, 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx');

function main() {
  assert.ok(fs.existsSync(KIT_RUNNER), 'Canonical Kit runner must exist');
  assert.ok(fs.existsSync(KIT_RUNNER_STD), 'Standardized Kit runner must exist');
  assert.equal(fs.readFileSync(KIT_RUNNER, 'utf8'), fs.readFileSync(KIT_RUNNER_STD, 'utf8'), 'Both Kit runners must stay synchronized');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-kit-wf-'));
  try {
    const recRes = spawnSync('node', [
      KIT_RUNNER,
      '--recognizeOnly',
      `--source=${CN_TEMPLATE}`,
      `--targetDir=${tmpDir}`
    ], { encoding: 'utf8' });
    assert.equal(recRes.status, 0, `Kit --recognizeOnly failed: ${recRes.stderr}`);

    const recJsonPath = path.join(tmpDir, '正式模板_MSDS_CN_冠志(1)_universal_recognition.json');
    const recMdPath = path.join(tmpDir, '正式模板_MSDS_CN_冠志(1)_recognition_result.md');
    assert.ok(fs.existsSync(recJsonPath), 'Should emit universal recognition JSON');
    assert.ok(fs.existsSync(recMdPath), 'Should emit 1:1 recognition MD');
    const recJson = JSON.parse(fs.readFileSync(recJsonPath, 'utf8'));
    assert.equal(recJson.tables.length, 16);
    assert.ok(fs.readFileSync(recMdPath, 'utf8').includes('<table>'));

    const topoRes = spawnSync('node', [
      KIT_RUNNER,
      '--buildTopology',
      `--template=${CN_TEMPLATE}`,
      `--targetDir=${tmpDir}`
    ], { encoding: 'utf8' });
    assert.equal(topoRes.status, 0, `Kit --buildTopology failed: ${topoRes.stderr}`);
    const topoJsonPath = path.join(tmpDir, '正式模板_MSDS_CN_冠志(1)_built_topology.json');
    assert.ok(fs.existsSync(topoJsonPath), 'Should emit built topology bundle');
    const topoBundle = JSON.parse(fs.readFileSync(topoJsonPath, 'utf8'));
    assert.equal(topoBundle.completenessCheck.ok, true);
    assert.equal(topoBundle.completenessCheck.passedCount, 9);

    const auditDir = path.join(tmpDir, 'audit_prep');
    const auditRes = spawnSync('node', [
      KIT_AUDIT_PREP,
      '--universalAudit',
      `--source=${CN_TEMPLATE}`,
      `--target=${CN_TEMPLATE}`,
      `--template=${CN_TEMPLATE}`,
      `--outDir=${auditDir}`
    ], { encoding: 'utf8' });
    assert.equal(auditRes.status, 0, `Kit --universalAudit failed: ${auditRes.stderr}`);
    assert.ok(fs.existsSync(path.join(auditDir, 'source_content_1to1.md')));
    assert.ok(fs.existsSync(path.join(auditDir, 'target_topology_9layer.json')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('✓ test_kit_unified_workflow.mjs all assertions passed');
}

main();
