import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { getDb } from '../src/msds-db.js';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function testAll() {
  const db = getDb();
  const records = db.prepare('SELECT id, model, docx_path FROM msds_records').all();
  console.log('Total records in msds_repo.db:', records.length);
  const tplBuf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');

  let passed = 0;
  let failed = 0;
  const sampleModels = ['PU-1007', 'PU-1102', 'PU-202A', 'PU-202B', 'PU-2060', 'PU-2186', 'PU-2305', 'PU-2340', 'PU-2341E'];

  for (const model of sampleModels) {
    const rec = records.find(r => r.model.includes(model));
    if (!rec) {
      console.log('Model not found in db:', model);
      continue;
    }
    try {
      const srcBuf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/data/' + rec.docx_path);
      const srcDoc = await loadDocx(srcBuf, rec.model + '.docx');
      const tplDoc = await loadDocx(tplBuf, 'tpl.docx');
      const matchRes = runSmartMatching(srcDoc.records);
      const applyRes = applyMatchResultToEditor(matchRes, tplDoc);
      const s2 = tplDoc.records.find(r => r.sectionNumber === 2 && r.kind === 'table');
      const s3 = tplDoc.records.find(r => r.sectionNumber === 3 && r.kind === 'table');
      const s8 = tplDoc.records.find(r => r.sectionNumber === 8 && r.kind === 'table');
      const s9 = tplDoc.records.find(r => r.sectionNumber === 9 && r.kind === 'table');
      const s11 = tplDoc.records.find(r => r.sectionNumber === 11 && r.kind === 'table');
      console.log(`[PASS] ${model.padEnd(10)}: Sec2 rows=${s2.rows.length}, Sec3 comps=${s3.rows.length - 4}, Sec8 rows=${s8.rows.length}, Sec9 rows=${s9.rows.length}, Sec11 rows=${s11.rows.length}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${model}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\nSummary: Passed=${passed}, Failed=${failed}`);
}
testAll();
