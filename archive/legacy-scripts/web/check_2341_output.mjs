import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import { getDb } from './src/msds-db.js';
import { loadDocx } from './src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './src/smart-matching.js';

async function main() {
  const db = getDb();
  const row = db.prepare('SELECT * FROM msds_records WHERE file_name LIKE ?').get('%2341E%');
  const rawFacts = JSON.parse(row.raw_facts_json || '[]');
  const inspectorRecords = Array.isArray(rawFacts) ? rawFacts : (rawFacts.records || []);

  const matchResult = runSmartMatching(inspectorRecords);
  const tplBuffer = fs.readFileSync('public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const editorEngine = await loadDocx(tplBuffer.buffer, 'editor_output.docx');
  applyMatchResultToEditor(matchResult, editorEngine);

  for (const s of [1, 2, 3, 4, 8, 9, 11, 12]) {
    const rec = editorEngine.records.find(r => r.sectionNumber === s);
    console.log(`\n=================== CURRENT EDITOR SECTION ${s}: ${rec?.title} (${rec?.rows?.length} rows) ===================`);
    (rec?.rows || []).forEach((r, idx) => {
      const texts = (r.cells || []).map(c => (c.text || '').trim()).join('  |  ').replace(/\n/g, ' ↵ ');
      console.log(`  Row ${idx + 1}: ${texts}`);
    });
  }
}

main().catch(console.error);
