import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

const cnDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
const enDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx';

const cnEng = await loadDocx(fs.readFileSync(cnDocxPath));
const enEng = await loadDocx(fs.readFileSync(enDocxPath));

console.log('--- CN Sections Font / Size (Cell 1 values) ---');
cnEng.records.forEach(r => {
  if (r.kind !== 'table') return;
  const sampleRow = r.rows[1] || r.rows[0];
  const c1 = sampleRow.cells[1] || sampleRow.cells[0];
  const sz = c1?.node?.getElementsByTagName('w:sz')?.[0]?.getAttribute('w:val');
  const rFonts = c1?.node?.getElementsByTagName('w:rFonts')?.[0];
  const font = rFonts?.getAttribute('w:eastAsia') || rFonts?.getAttribute('w:ascii') || 'none';
  console.log(`Sec ${r.sectionNumber}: sz=${sz}, font=${font}, text=${c1?.text?.slice(0, 30)}`);
});

console.log('\n--- EN Sections Font / Size (Cell 1 values) ---');
enEng.records.forEach(r => {
  if (r.kind !== 'table') return;
  const sampleRow = r.rows[1] || r.rows[0];
  const c1 = sampleRow.cells[1] || sampleRow.cells[0];
  const sz = c1?.node?.getElementsByTagName('w:sz')?.[0]?.getAttribute('w:val');
  const rFonts = c1?.node?.getElementsByTagName('w:rFonts')?.[0];
  const font = rFonts?.getAttribute('w:ascii') || rFonts?.getAttribute('w:hAnsi') || 'none';
  console.log(`Sec ${r.sectionNumber}: sz=${sz}, font=${font}, text=${c1?.text?.slice(0, 30)}`);
});
