import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';
import path from 'path';

async function testEn() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';
  const enDocxPath = path.join(dir, 'EC-1804 msds_EN Guanzhi.docx');
  const enEngine = await loadDocx(fs.readFileSync(enDocxPath), 'en.docx');

  console.log("=== EN SECTION 5 ===");
  const s5 = enEngine.records.find(r => r.sectionNumber === 5);
  s5.rows.forEach(r => console.log(`[${r.cells.map(c => c.text).join(' | ')}]`));

  console.log("\n=== EN SECTION 10 ===");
  const s10 = enEngine.records.find(r => r.sectionNumber === 10);
  s10.rows.forEach(r => console.log(`[${r.cells.map(c => c.text).join(' | ')}]`));

  console.log("\n=== EN SECTION 2 ===");
  const s2 = enEngine.records.find(r => r.sectionNumber === 2);
  s2.rows.forEach(r => console.log(`[${r.cells.map(c => c.text).join(' | ')}]`));

  console.log("\n=== EN SECTION 8 ===");
  const s8 = enEngine.records.find(r => r.sectionNumber === 8);
  s8.rows.forEach(r => console.log(`[${r.cells.map(c => c.text).join(' | ')}]`));
}

testEn().catch(console.error);
