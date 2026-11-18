import fs from 'fs';
import path from 'path';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const base = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版';
const dirs = fs.readdirSync(base);
let docPath = '';
for (const d of dirs) {
  if (d.includes('02-1')) {
    docPath = path.join(base, d, 'PA-4780', 'PA-4780 msds_CN 冠志.docx');
    break;
  }
}
const eng = await loadDocx(fs.readFileSync(docPath), 'pa.docx');
const s9 = eng.records.find(r => r.sectionNumber === 9);
console.log('PA-4780 CN S9 rows count:', s9.rows.length);
s9.rows.forEach((r, i) => console.log(`  Row ${i}: ${r.cells[0]?.text?.trim()} => ${r.cells[1]?.text?.trim()}`));
