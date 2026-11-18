import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

async function test() {
  const tplBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tpl = await loadDocx(tplBuf, 'tpl.docx');
  const r5 = tpl.records.find(r => r.sectionNumber === 5);
  console.log("=== TPL SECTION 5 ROWS ===");
  r5.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });

  console.log("\n=== TPL SECTION 10 ROWS ===");
  const r10 = tpl.records.find(r => r.sectionNumber === 10);
  r10.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });

  console.log("\n=== TPL SECTION 2 ROWS ===");
  const r2 = tpl.records.find(r => r.sectionNumber === 2);
  r2.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });

  console.log("\n=== TPL SECTION 8 ROWS ===");
  const r8 = tpl.records.find(r => r.sectionNumber === 8);
  r8.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });
}

test().catch(console.error);
