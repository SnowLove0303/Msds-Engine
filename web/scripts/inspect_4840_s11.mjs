import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx');
const eng = await loadDocx(buf);
const s11 = eng.records.filter(r => r.sectionNumber === 11);
for (const r of s11) {
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
