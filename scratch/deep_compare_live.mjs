import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './web/src/msds-db.js';
import { loadDocx } from './web/src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './web/src/smart-matching.js';

async function main() {
  console.log('=== LIVE DEEP AUDIT: CURRENT ENGINE VS USER CORRECT 2341 (PEA-4139) ===\n');
  const db = getDb();
  const row = db.prepare('SELECT * FROM msds_records WHERE file_name LIKE ?').get('%2341E%');
  if (!row) {
    console.error('PU-2341E not found in database!');
    return;
  }
  const rawFacts = JSON.parse(row.raw_facts_json || '[]');
  const inspectorRecords = Array.isArray(rawFacts) ? rawFacts : (rawFacts.records || []);
  console.log('Loaded PU-2341E raw facts:', inspectorRecords.length, 'records');

  // 1. Run live smart matching
  const matchResult = runSmartMatching(inspectorRecords);

  // 2. Load standard template docx
  const tplBuffer = fs.readFileSync('web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const editorEngine = await loadDocx(tplBuffer.buffer, 'editor_output.docx');

  // 3. Apply match result to editor
  const applyRes = applyMatchResultToEditor(matchResult, editorEngine);
  console.log('Apply result:', applyRes);

  // 4. Load User Correct PEA-4139 ground truth docx
  const peaBuffer = fs.readFileSync('scratch/review_bundle_extracted/PEA-4139 msds_CN 冠志.docx');
  const peaEngine = await loadDocx(peaBuffer.buffer, 'pea_gt.docx');

  // 5. Compare Section by Section
  for (let s = 1; s <= 16; s++) {
    const eRec = editorEngine.records.find(r => r.sectionNumber === s);
    const pRec = peaEngine.records.find(r => r.sectionNumber === s);

    const eRows = eRec?.rows || [];
    const pRows = pRec?.rows || [];

    const diffs = [];
    const maxLen = Math.max(eRows.length, pRows.length);
    for (let i = 0; i < maxLen; i++) {
      const eRow = eRows[i];
      const pRow = pRows[i];
      const eText = (eRow?.cells || []).map(c => (c.text || '').trim()).join('  |  ');
      const pText = (pRow?.cells || []).map(c => (c.text || '').trim()).join('  |  ');
      if (eText !== pText) {
        diffs.push({
          row: i + 1,
          eRowExists: Boolean(eRow),
          pRowExists: Boolean(pRow),
          editor: eText,
          pea: pText
        });
      }
    }

    if (diffs.length > 0) {
      console.log(`\n****************************************************************`);
      console.log(`[DIFF FOUND] SECTION ${s}: ${eRec?.title || pRec?.title || 'Section ' + s}`);
      console.log(`Editor Rows: ${eRows.length} vs User PEA Rows: ${pRows.length} (Mismatched rows: ${diffs.length})`);
      diffs.forEach(d => {
        console.log(`  --------------------------------------------------`);
        console.log(`  Row ${d.row}:`);
        console.log(`    [当前匹配引擎实际回填 (Editor)]:`);
        console.log(`    "${d.editor.replace(/\n/g, ' ↵ ')}"`);
        console.log(`    [用户基本正确版期望 (PEA-4139)]:`);
        console.log(`    "${d.pea.replace(/\n/g, ' ↵ ')}"`);
      });
    } else {
      console.log(`[MATCH 100%] SECTION ${s}: ${eRec?.title || 'Section ' + s} (${eRows.length} rows matched)`);
    }
  }
}

main().catch(console.error);
