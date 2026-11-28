import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createTopologyPluginSlot } from '../src/topology-plugin-slot.js';
import { inspectTemplateSchema, createWorkSession } from '../src/template-editor.js';
import {
  saveUserTemplate,
  listUserTemplates,
  getUserTemplateById,
  setDefaultUserTemplate,
  deleteUserTemplate,
  saveUserPreset,
  listUserPresets,
  setDefaultUserPreset,
  deleteUserPreset,
  listUserNamingPatterns,
  saveUserNamingPattern,
  setDefaultUserNamingPattern,
  deleteUserNamingPattern,
  closeUserConfigDb
} from '../src/user-config-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CN_TEMPLATE = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-ucfg-db-'));
  const dbPath = path.join(tmpDir, 'user_config_test.db');

  try {
    // 1. Default naming pattern exists with zero company hardcoding
    const initPatterns = listUserNamingPatterns(dbPath);
    assert.equal(initPatterns.length, 1);
    assert.equal(initPatterns[0].id, 'default_standard');
    assert.equal(initPatterns[0].pattern, '{docId}_{lang}_{preset}');

    // 2. Save template + 9-layer built topology into SQLite
    const buf = fs.readFileSync(CN_TEMPLATE);
    const slot = createTopologyPluginSlot();
    await slot.mountTemplate(buf, { templateName: 'cn_sample.docx' });
    const bundle = slot.exportTopologyBundle();
    slot.unmountTemplate();

    const savedTpl = saveUserTemplate({
      name: 'User Custom Template',
      language: 'zh',
      fileName: 'cn_sample.docx',
      docxBuffer: buf,
      topology: bundle,
      isDefault: true
    }, dbPath);

    assert.equal(savedTpl.completenessOk, true);
    assert.equal(savedTpl.sectionsCount, 16);
    assert.equal(listUserTemplates({}, dbPath).length, 1);
    const loadedTplWithBlob = getUserTemplateById(savedTpl.id, { includeBlob: true }, dbPath);
    assert.ok(Buffer.isBuffer(loadedTplWithBlob.docxBuffer) && loadedTplWithBlob.docxBuffer.length === buf.length);
    assert.equal(loadedTplWithBlob.topology.kind, 'MsdsEngineStandardTopology');

    // 3. Save user preset bound to template
    const savedPreset = saveUserPreset({
      name: 'ACME Corp ZH',
      entity: 'ACME',
      language: 'zh',
      targetTemplateId: savedTpl.id,
      headerFooter: { company: 'ACME Chemical Co., Ltd.' },
      isDefault: true
    }, dbPath);
    assert.equal(savedPreset.targetTemplateId, savedTpl.id);
    assert.equal(listUserPresets({ enabledOnly: true }, dbPath).length, 1);

    // 4. Save custom naming pattern & switch default
    const savedNp = saveUserNamingPattern({
      name: 'Date Prefix',
      pattern: '{date}_{docId}_{lang}_{preset}',
      isDefault: true
    }, dbPath);
    assert.equal(savedNp.isDefault, true);
    setDefaultUserNamingPattern('default_standard', dbPath);
    setDefaultUserPreset(savedPreset.id, dbPath);
    setDefaultUserTemplate(savedTpl.id, dbPath);

    // 5. End-to-end resolution via template-editor.js (inspectTemplateSchema & createWorkSession)
    const e2eTpl = saveUserTemplate({
      name: 'E2E SQLite Template',
      language: 'zh',
      fileName: 'e2e_sample.docx',
      docxBuffer: buf,
      topology: bundle,
      isDefault: false
    });
    try {
      const schema = await inspectTemplateSchema(e2eTpl.id);
      assert.equal(schema.templateKey, e2eTpl.id);
      assert.ok(Object.keys(schema.sections).length >= 16);

      const session = await createWorkSession(e2eTpl.id, tmpDir);
      assert.equal(session.templateKey, e2eTpl.id);
      assert.equal(session.isDynamicTopology, true);
      assert.ok(session.engine.records.length >= 16);
    } finally {
      deleteUserTemplate(e2eTpl.id);
      closeUserConfigDb();
    }

    // 6. Cleanup deletions
    deleteUserNamingPattern(savedNp.id, dbPath);
    deleteUserPreset(savedPreset.id, dbPath);
    deleteUserTemplate(savedTpl.id, dbPath);
    assert.equal(listUserTemplates({}, dbPath).length, 0);
    assert.equal(listUserPresets({}, dbPath).length, 0);
    assert.equal(listUserNamingPatterns(dbPath).length, 1);
  } finally {
    closeUserConfigDb(dbPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('✓ test_user_config_db.mjs all assertions passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
