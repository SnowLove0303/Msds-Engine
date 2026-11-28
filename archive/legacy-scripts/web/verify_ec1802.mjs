import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

const cnDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1802/EC-1802 msds_CN 冠志.docx';
const enDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1802/EC-1802 msds_EN Guanzhi.docx';

const cnEng = await loadDocx(fs.readFileSync(cnDocxPath));
const enEng = await loadDocx(fs.readFileSync(enDocxPath));

const cnS8 = cnEng.records.find(r => r.sectionNumber === 8);
console.log('--- EC-1802 CN Section 8 Rows ---');
cnS8.rows.forEach((r, idx) => {
  const c0 = r.cells[0]?.text || '';
  const c1 = r.cells[1]?.text || '';
  const c1Sz = r.cells[1]?.node?.getElementsByTagName('w:sz')?.[0]?.getAttribute('w:val') || 'none';
  const c1Bold = r.cells[1]?.node?.getElementsByTagName('w:b')?.length > 0;
  console.log(`Row ${idx + 1}: [${c0}] | [${c1}] (sz=${c1Sz}, bold=${c1Bold})`);
});

const enS8 = enEng.records.find(r => r.sectionNumber === 8);
console.log('\n--- EC-1802 EN Section 8 Rows ---');
enS8.rows.forEach((r, idx) => {
  const c0 = r.cells[0]?.text || '';
  const c1 = r.cells[1]?.text || '';
  const c1Sz = r.cells[1]?.node?.getElementsByTagName('w:sz')?.[0]?.getAttribute('w:val') || 'none';
  const c1Bold = r.cells[1]?.node?.getElementsByTagName('w:b')?.length > 0;
  console.log(`Row ${idx + 1}: [${c0}] | [${c1}] (sz=${c1Sz}, bold=${c1Bold})`);
});

const cnS2 = cnEng.records.find(r => r.sectionNumber === 2);
console.log('\n--- EC-1802 CN Section 2 text ---');
console.log(cnS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n'));

const enS2 = enEng.records.find(r => r.sectionNumber === 2);
console.log('\n--- EC-1802 EN Section 2 text ---');
console.log(enS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n'));
