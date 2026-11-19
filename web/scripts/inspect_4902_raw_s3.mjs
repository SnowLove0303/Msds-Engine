import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx');
const eng = await loadDocx(buf);
const s3 = eng.records.find(r => r.sectionNumber === 3);
console.log('=== PA-4902 SECTION 3 ROWS ===');
if (s3 && s3.rows) {
  s3.rows.forEach((row, ri) => {
    console.log(`\n--- ROW ${ri} (cells count: ${row.cells.length}) ---`);
    row.cells.forEach((c, ci) => {
      console.log(`[C${ci}]: ${JSON.stringify(c.text)}`);
    });
  });
}
