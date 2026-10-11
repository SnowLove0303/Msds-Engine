import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../src/msds-db.js';
import { loadDocx } from '../src/docx-engine.js';

function tableRecords(engine) {
  return engine?.records?.filter((record) => record.kind === 'table') || [];
}

async function main() {
  console.log('=== MSDS 3-Way Deep Comparison & Engine Audit ===\n');

  // 1. Get DB Record for PU-2341E
  const db = getDb();
  const row = db.prepare('SELECT * FROM msds_records WHERE file_name LIKE ?').get('%2341E%');
  if (!row) {
    console.error('PU-2341E not found in database!');
    return;
  }
  const rawFacts = JSON.parse(row.raw_facts_json || '{}');
  const matchResult = JSON.parse(row.match_result_json || '{}');

  console.log('DB Record:', row.file_name, 'Model:', row.model);
  console.log('Match Result Summary:', JSON.stringify(matchResult.summary, null, 2));

  // 2. Parse User Ground-Truth Docx (user_correct_2341.docx)
  const peaDocxPath = path.resolve('/app/web/output/user_correct_2341.docx');
  const peaBuffer = fs.readFileSync(peaDocxPath);
  const peaEngine = await loadDocx(peaBuffer.buffer, 'PU-2341E msds_CN 冠志.docx');
  const peaRecords = tableRecords(peaEngine);
  console.log(`\nParsed User Correct 2341 ground truth: ${peaRecords.length} table records.\n`);

  // 3. Read annotations if available
  let annotations = [];
  const annotPath = path.resolve('/app/web/output/annotations.ndjson');
  if (fs.existsSync(annotPath)) {
    const lines = fs.readFileSync(annotPath, 'utf8').split('\n').filter(Boolean);
    annotations = lines.map(l => JSON.parse(l));
    console.log(`Read ${annotations.length} annotations from review bundle.\n`);
  }

  // 4. Detailed comparison section by section
  for (let secNum = 1; secNum <= 16; secNum++) {
    const secStr = String(secNum);
    const peaRec = peaRecords.find(r => r.sectionNumber === secNum);
    const matchSec = matchResult.matchedSections?.find(s => s.sectionNumber === secNum);
    const rawSecFacts = rawFacts[secStr] || rawFacts[secNum] || [];
    const secAnnots = annotations.filter(a => a.sectionNumber === secNum || a.section === `Section ${secNum}` || a.section === secNum || a.sectionKey === `s${secNum}`);

    console.log(`\n======================================================================`);
    console.log(`SECTION ${secNum}: ${peaRec?.title || matchSec?.title || 'N/A'}`);
    console.log(`Ground-Truth (PEA) Rows: ${peaRec?.rows?.length || 0} | Match Engine Rows: ${matchSec?.matchedRows?.length || 0}`);

    if (secAnnots.length > 0) {
      console.log(`\n  📝 [用户批注 (${secAnnots.length} 条)]:`);
      secAnnots.forEach(a => {
        console.log(`    * [${a.category || a.type || 'NOTE'}] 行 ${a.rowNumber || '?'}: ${a.comment || a.note || ''}`);
        if (a.expected) console.log(`      期望 (Expected): "${String(a.expected).replace(/\n/g, '\\n')}"`);
        if (a.actual)   console.log(`      实际 (Actual):   "${String(a.actual).replace(/\n/g, '\\n')}"`);
      });
    }

    const peaRows = peaRec?.rows || [];
    const matchRows = matchSec?.matchedRows || [];

    console.log(`\n  🟢 [用户修正正确版本 (PEA Ground Truth 表格各行)]:`);
    peaRows.forEach((r, idx) => {
      const cellTexts = (r.cells || []).map(c => (c.text || '').trim()).filter(Boolean);
      console.log(`    Row ${idx + 1}: ${cellTexts.join('  |  ').replace(/\n/g, ' ↵ ')}`);
    });

    console.log(`\n  🔴 [当前智能匹配引擎输出 (Match Engine MatchedRows)]:`);
    matchRows.forEach((s, idx) => {
      const key = s.key || s.slotId || '';
      const lbl = s.standardLabel || '';
      const val = s.value || '';
      const st = s.status || '';
      console.log(`    Slot ${idx + 1} [${st} | ${key}]: "${lbl}" => "${val.replace(/\n/g, ' ↵ ')}"`);
    });
  }
}

main().catch(err => {
  console.error('Error running comparison:', err);
});
