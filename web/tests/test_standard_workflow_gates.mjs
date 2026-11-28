import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  fetchAvailableUserPresets,
  fetchAvailableNamingPatterns,
  validateWorkflowRequirements,
  formatDeliverableBaseName,
  runUniversalDeliverableAudit,
  produceStandardDeliverables
} from '../src/production-orchestrator.js';
import { saveNamingPattern, deleteNamingPattern } from '../src/msds-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const CN_TEMPLATE = path.join(REPO_ROOT, 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
const KIT_RUNNER = path.join(REPO_ROOT, '体系交接文档/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs');

async function main() {
  // 1. Fetch presets from DB/API
  const presets = await fetchAvailableUserPresets();
  assert.ok(Array.isArray(presets) && presets.length > 0, 'Should fetch available user presets from DB/API');

  // 2. Stage 0 mechanical gate blocks unconfirmed runs
  assert.throws(
    () => validateWorkflowRequirements({ confirmRequirements: false, presets: [presets[0].id], formats: ['docx'], languages: ['zh'] }),
    /WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED/,
    'Should reject when confirmRequirements is false'
  );
  assert.throws(
    () => validateWorkflowRequirements({ confirmRequirements: true, presets: [], formats: ['docx'], languages: ['zh'] }),
    /WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED/,
    'Should reject when presets is empty'
  );

  // 3. Confirmed Stage 0 + --prepareOnly produces Context 1 dual artifacts (JSON + 1:1 MD) & Context 2 review
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-std-wf-gates-'));
  try {
    const prep = await produceStandardDeliverables({
      sourceFilePath: CN_TEMPLATE,
      modelCode: 'GATE-TEST',
      targetDir: tmpDir,
      presets: [presets[0].id],
      formats: ['docx', 'pdf'],
      languages: ['zh', 'en'],
      confirmRequirements: true,
      prepareOnly: true
    });

    assert.equal(prep.status, 'AWAITING_AGENT_PROOFREAD');
    assert.equal(prep.requiresAgentTranslation, true);
    assert.ok(fs.existsSync(prep.context1JsonPath), 'Should emit Context 1 universal JSON');
    assert.ok(fs.existsSync(prep.context1MdPath), 'Should emit Context 1 1:1 recognition MD');
    assert.ok(fs.existsSync(prep.reviewMdPath), 'Should emit Context 2 review MD');
    assert.ok(fs.readFileSync(prep.context1MdPath, 'utf8').includes('<table>'), 'Context 1 MD must preserve 1:1 table markup');

    // 4. Kit CLI --listPresets works cleanly
    const listRes = spawnSync('node', [KIT_RUNNER, '--listPresets'], { encoding: 'utf8' });
    assert.equal(listRes.status, 0, `--listPresets failed: ${listRes.stderr}`);
    const parsedList = JSON.parse(listRes.stdout);
    assert.ok(parsedList.count >= 1, 'Kit --listPresets should list at least 1 preset');

    // 5. Scenario-agnostic checks: arbitrary language ('ja'), 'none' preset, generic naming, and single-file universal audit
    const customReq = validateWorkflowRequirements({
      confirmRequirements: true,
      presets: ['none'],
      formats: ['docx'],
      languages: ['ja']
    });
    assert.deepEqual(customReq, { presets: ['none'], formats: ['docx'], languages: ['ja'] });
    assert.equal(
      formatDeliverableBaseName({ docId: 'SPEC-2026', lang: 'ja', presetLabel: 'none' }),
      'SPEC-2026_JA'
    );

    const singleAudit = await runUniversalDeliverableAudit({
      generatedDocxPaths: [CN_TEMPLATE],
      deliverables: [CN_TEMPLATE],
      pdfConverterUsed: false
    });
    assert.equal(singleAudit.ok, true, `Universal single-deliverable audit should pass: ${singleAudit.failures.join(', ')}`);
    assert.equal(singleAudit.docxAudit[0].completeness, '9/9');

    // 6. Reusable user-defined naming patterns (DB + CLI --listNamingPatterns + {date} token)
    const customPattern = saveNamingPattern({
      name: 'Test Custom Date Format',
      pattern: '{date}_{docId}_{lang}_{preset}',
      description: 'Test reusable naming preset'
    });
    try {
      const patterns = await fetchAvailableNamingPatterns();
      assert.ok(patterns.some(p => p.id === customPattern.id), 'Saved naming pattern should be discoverable');
      assert.equal(
        formatDeliverableBaseName({
          docId: 'DOC-01',
          lang: 'en',
          presetLabel: 'ACME',
          outputNamePattern: customPattern.pattern,
          dateStr: '2026-11-29'
        }),
        '2026-11-29_DOC-01_EN_ACME'
      );

      const listNpRes = spawnSync('node', [KIT_RUNNER, '--listNamingPatterns'], { encoding: 'utf8' });
      assert.equal(listNpRes.status, 0, `--listNamingPatterns failed: ${listNpRes.stderr}`);
      const parsedNp = JSON.parse(listNpRes.stdout);
      assert.ok(parsedNp.count >= 1, 'Kit --listNamingPatterns should list at least 1 pattern');
    } finally {
      deleteNamingPattern(customPattern.id);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('✓ test_standard_workflow_gates.mjs all assertions passed');
}

main().catch((err) => {
  process.stderr.write((err?.stack || err?.message || String(err)) + '\n');
  process.exit(1);
});
