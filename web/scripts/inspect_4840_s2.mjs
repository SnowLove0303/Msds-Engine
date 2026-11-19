import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840';
const files = fs.readdirSync(dir);
const target = files.find(f => f.includes('源文件留存.docx')) || files.find(f => f.endsWith('.docx'));

const buf = fs.readFileSync(path.join(dir, target));
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
