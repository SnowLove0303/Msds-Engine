import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
const buf = fs.readFileSync(p);
const eng = await loadDocx(buf, 'pa3654.docx');

for (const secNum of [1, 8, 11, 13, 14, 15]) {
  const recs = eng.records.filter(r => r.sectionNumber === secNum);
  console.log(`\n=================== Section ${secNum} ===================`);
  recs.forEach((r, idx) => {
    console.log(`[Record ${idx}]: title="${r.title}", kind="${r.kind}"`);
    if (r.rows) {
      r.rows.forEach((row, rIdx) => {
        console.log(`  Row ${rIdx}: [${row.cells.map(c => `"${(c.text || '').trim()}"`).join(', ')}]`);
      });
    } else {
      console.log(`  Text: ${r.text}`);
    }
  });
}
