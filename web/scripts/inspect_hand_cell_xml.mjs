import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

async function test() {
  const docPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const engine = await loadDocx(fs.readFileSync(docPath), 'out.docx');
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  const row = s8.rows.find(r => r.cells.some(c => /手部防护/i.test(c.text || '')));
  if (row) {
    console.log("Keys of cell 0:", Object.keys(row.cells[0]));
    console.log("Paragraphs of cell 0:", row.cells[0].paragraphs?.map(p => ({ text: p.text, raw: p.rawText })));
    console.log("Full cell 0:", JSON.stringify(row.cells[0], (k, v) => k === 'element' || k === 'node' ? undefined : v, 2));
  }
}

test().catch(console.error);
