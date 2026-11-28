import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import path from 'node:path';
import { loadDocx } from './src/docx-engine.js';
import { getDb } from './src/msds-db.js';
import { runSmartMatching, applyMatchResultToEditor } from './src/smart-matching.js';

async function main() {
  console.log('Comparing direct_zip_extracted_pea.docx with user_correct_2341.docx...\n');
  const bufZip = fs.readFileSync('output/direct_zip_extracted_pea.docx');
  const bufPrev = fs.readFileSync('output/user_correct_2341.docx');
  const docZip = await loadDocx(bufZip.buffer, 'zip_pea.docx');
  const docPrev = await loadDocx(bufPrev.buffer, 'prev_gt.docx');

  console.log('Zip PEA table records:', docZip.records.filter(r => r.kind === 'table').length);
  console.log('Prev GT table records:', docPrev.records.filter(r => r.kind === 'table').length);

  for (let s = 1; s <= 16; s++) {
    const rZip = docZip.records.find(r => r.sectionNumber === s);
    const rPrev = docPrev.records.find(r => r.sectionNumber === s);
    const rowsZip = rZip?.rows || [];
    const rowsPrev = rPrev?.rows || [];
    
    let hasDiff = false;
    const diffs = [];
    const maxLen = Math.max(rowsZip.length, rowsPrev.length);
    for (let i = 0; i < maxLen; i++) {
      const zText = (rowsZip[i]?.cells || []).map(c => (c.text || '').trim()).join(' | ');
      const pText = (rowsPrev[i]?.cells || []).map(c => (c.text || '').trim()).join(' | ');
      if (zText !== pText) {
        hasDiff = true;
        diffs.push({ row: i + 1, zip: zText, prev: pText });
      }
    }
    if (hasDiff) {
      console.log(`\n=================== DIFF in Section ${s} ===================`);
      console.log(`Zip rows: ${rowsZip.length} vs Prev rows: ${rowsPrev.length}`);
      diffs.forEach(d => {
        console.log(`  Row ${d.row}:`);
        console.log(`    ZIP:  "${d.zip}"`);
        console.log(`    PREV: "${d.prev}"`);
      });
    } else {
      console.log(`Section ${s}: IDENTICAL (${rowsZip.length} rows)`);
    }
  }
}

main().catch(console.error);
