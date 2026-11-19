import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('../算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx');
const eng = await loadDocx(buf);
const s3 = eng.records.filter(r => r.sectionNumber === 3);
for (const r of s3) {
  if (r.rows) {
    r.rows.forEach((row, ri) => {
      row.cells.forEach((c, ci) => {
        console.log(`R${ri}C${ci}: ${c.text}`);
      });
    });
  } else {
    console.log('TXT:', r.text);
  }
}
