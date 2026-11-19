import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');

const cnBuf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx');
const enBuf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_EN Guanzhi.docx');

const cnEng = await loadDocx(cnBuf, 'cn');
const enEng = await loadDocx(enBuf, 'en');

const s8Cn = cnEng.records.find(r => r.sectionNumber === 8);
console.log('CN Section 8 total rows:', s8Cn.rows.length);
s8Cn.rows.forEach((r, idx) => {
  console.log(`Row ${idx} (${r.cells.length} cells): ${r.cells.map(c => c.text).join(' | ')}`);
});

const s8En = enEng.records.find(r => r.sectionNumber === 8);
console.log('\nEN Section 8 total rows:', s8En.rows.length);
s8En.rows.forEach((r, idx) => {
  console.log(`Row ${idx} (${r.cells.length} cells): ${r.cells.map(c => c.text).join(' | ')}`);
});

