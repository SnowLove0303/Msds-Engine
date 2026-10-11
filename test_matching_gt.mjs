import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './src/msds-db.js';
import { loadDocx } from './src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from './src/smart-matching.js';

async function test() {
  console.log('Testing upgraded smart matching against ground truth...');
  const db = getDb();
  const row = db.prepare('SELECT * FROM msds_records WHERE file_name LIKE ?').get('%2341E%');
  if (!row) {
    console.error('PU-2341E not found in database');
    return;
  }
  const rawFacts = JSON.parse(row.raw_facts_json || '[]');
  const inspectorRecords = Array.isArray(rawFacts) ? rawFacts : (rawFacts.records || []);
  console.log('Loaded inspector records:', inspectorRecords.length);

  // 1. Run smart matching
  const matchResult = runSmartMatching(inspectorRecords);
  console.log('Match Result Summary:', JSON.stringify(matchResult.summary, null, 2));

  // 2. Load template docx
  const tplBuffer = fs.readFileSync('public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const editorEngine = await loadDocx(tplBuffer.buffer, 'output.docx');

  // 3. Apply match result to editor
  const applyRes = applyMatchResultToEditor(matchResult, editorEngine);
  console.log('Apply result:', applyRes);

  // 4. Compare with Ground Truth
  const peaBuffer = fs.readFileSync('output/user_correct_2341.docx');
  const gtEngine = await loadDocx(peaBuffer.buffer, 'gt.docx');

  const targetSec = process.argv[2] ? parseInt(process.argv[2]) : null;

  console.log('\n=== SECTION-BY-SECTION COMPARISON WITH GROUND TRUTH ===\n');
  let passCount = 0;
  let failCount = 0;

  for (let s = 1; s <= 16; s++) {
    if (targetSec && s !== targetSec) continue;
    const editorRec = editorEngine.records.find(r => r.sectionNumber === s);
    const gtRec = gtEngine.records.find(r => r.sectionNumber === s);
    const eRows = editorRec?.rows || [];
    const gRows = gtRec?.rows || [];
    const maxLen = Math.max(eRows.length, gRows.length);
    let secFails = 0;
    const rowResults = [];
    for (let i = 0; i < maxLen; i++) {
      const eText = (eRows[i]?.cells || []).map(c => (c.text || '').trim()).join('  |  ').replace(/\n/g, ' ↵ ');
      const gText = (gRows[i]?.cells || []).map(c => (c.text || '').trim()).join('  |  ').replace(/\n/g, ' ↵ ');
      const matchMark = eText === gText ? '✅' : '❌';
      if (matchMark === '✅') {
        passCount++;
      } else {
        failCount++;
        secFails++;
      }
      rowResults.push({ i, matchMark, eText, gText });
    }
    console.log(`--- SECTION ${s} (Editor Rows: ${eRows.length} | GT Rows: ${gRows.length}) [Fails: ${secFails}] ---`);
    for (const r of rowResults) {
      console.log(`  Row ${r.i + 1}: ${r.matchMark}`);
      if (r.matchMark === '❌') {
        console.log(`    Editor: "${r.eText}"`);
        console.log(`    GT:     "${r.gText}"`);
      }
    }
  }
  console.log(`\nTOTAL: Passed ${passCount}, Failed ${failCount}`);
}

test().catch(console.error);

