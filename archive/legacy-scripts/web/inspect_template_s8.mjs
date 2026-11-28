import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

// Let's check TEMPLATE_PATHS or the template docx
const templatePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1704/EP-1704 msds_CN 冠志_源文件留存.docx';
const eng = await loadDocx(fs.readFileSync(templatePath));
const s8 = eng.records.find(r => r.sectionNumber === 8);
console.log('--- Template Section 8 Rows ---');
s8.rows.forEach((r, idx) => {
  const c0 = r.cells[0]?.text || '';
  const c1 = r.cells[1]?.text || '';
  const c2 = r.cells[2]?.text || '';
  const c3 = r.cells[3]?.text || '';
  console.log(`Row ${idx + 1} (${r.cells.length} cells): [${c0}] | [${c1}] ${c2 ? '| [' + c2 + ']' : ''} ${c3 ? '| [' + c3 + ']' : ''}`);
});
