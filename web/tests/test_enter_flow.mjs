import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  loadDocx,
  clearSectionValues,
  applySemanticOverrides,
  updateHeaderFooterData,
  PresetStore
} = await import('../src/docx-engine.js');

function tableRecords(engine) {
  return engine?.records?.filter((record) => record.kind === 'table') || [];
}

function engineBuffer(engine) {
  return engine.originalBytes.buffer.slice(engine.originalBytes.byteOffset, engine.originalBytes.byteOffset + engine.originalBytes.byteLength);
}

const templatePath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const buf = fs.readFileSync(templatePath);
const normalEngine = await loadDocx(buf, '正式模板_MSDS_CN_冠志(1).docx');

const presets = PresetStore.loadPresets();
const p = presets[0];
console.log('Testing preset:', p.name);

try {
  const rawBuf = engineBuffer(normalEngine);
  const docxName = (p.targetTemplate || 'template') + '.docx';
  const presetEngine = await loadDocx(rawBuf, docxName);

  for (const rec of tableRecords(presetEngine)) {
    clearSectionValues(rec);
  }
  if (p.fieldOverrides) {
    applySemanticOverrides(presetEngine, p.fieldOverrides);
  }
  if (p.headerFooterOverrides) {
    updateHeaderFooterData(presetEngine, p.headerFooterOverrides);
  }

  console.log('SUCCESS! presetEngine created with records:', presetEngine.records.length);
} catch (e) {
  console.error('ERROR in enterPresetEditing flow:', e);
}
