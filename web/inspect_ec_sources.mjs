import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

for (const model of ['EC-1802', 'EC-1803']) {
  const p = `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/${model}/${model} msds_CN 冠志.docx`;
  const eng = await loadDocx(fs.readFileSync(p));
  console.log(`\n=================== ${model} Existing DOCX ===================`);
  const s1 = eng.records.find(r => r.sectionNumber === 1);
  console.log('Sec 1:', s1?.rows.map(r => r.cells.map(c => c.text).join(' | ')));
  const s2 = eng.records.find(r => r.sectionNumber === 2);
  console.log('Sec 2:', s2?.rows.map(r => r.cells.map(c => c.text).join(' | ')));
  const s3 = eng.records.find(r => r.sectionNumber === 3);
  console.log('Sec 3 rows:', s3?.rows.length);
  s3?.rows.forEach((r, idx) => console.log(`  r${idx}:`, r.cells.map(c => c.text).join(' | ')));
  const s9 = eng.records.find(r => r.sectionNumber === 9);
  console.log('Sec 9 rows:', s9?.rows.length);
  s9?.rows.slice(0, 5).forEach((r, idx) => console.log(`  r${idx}:`, r.cells.map(c => c.text).join(' | ')));
}
