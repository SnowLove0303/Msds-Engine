import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const OUT = 'F:/MSDS覆写/MSDS deepseek 工作区/PA-3617_msds_CN_冠志_覆写版.docx';
const eng = await loadDocx(await fs.promises.readFile(OUT), 'out.docx');
const sec = (n) => eng.records.find((r) => r.kind === 'table' && r.sectionNumber === n);
const show = (n) => {
  const r = sec(n);
  console.log(`== S${n} rows=${r.rows.length}`);
  for (const row of r.rows) {
    console.log(' R' + row.index + ': ' + row.cells.map((c) => (c.labelText ? 'L:' + c.labelText.slice(0, 26) : '') + (c.valueText ? ' V:' + c.valueText.slice(0, 60).replace(/\n/g, ' / ') : '')).join(' | '));
  }
};
[1, 2, 3, 8, 9, 11, 12, 15].forEach(show);
const h = eng.records.find((r) => r.part === 'word/header1.xml' && r.kind === 'table');
console.log('header:', JSON.stringify(h.rows[0].cells.map((c) => c.text)));
const f = eng.records.find((r) => r.part === 'word/footer1.xml' && r.kind === 'table');
console.log('footer0:', JSON.stringify(f.rows[0].cells.map((c) => c.text)));
const bad = ['PEA-4139', '二乙二醇单丁醚', '112-34-5', '六亚甲基', '丙二醇甲醚醋酸酯', 'H227', 'H316', '591号', 'GB 30000', 'GB 15258'];
const full = eng.records.map((r) => r.searchText || '').join('\n');
for (const b of bad) console.log(b, '->', full.includes(b) ? 'FOUND残留' : 'ok');
