import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function test() {
  const docPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const engine = await loadDocx(fs.readFileSync(docPath), 'out.docx');
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  const row = s8.rows.find(r => r.cells.some(c => /手部防护/i.test(c.text || '')));
  if (row) {
    const node = row.cells[0].node;
    console.log("Cell 0 outerHTML / xml:", node.outerHTML || new dom.window.XMLSerializer().serializeToString(node));
    const node1 = row.cells[1]?.node;
    if (node1) {
      console.log("Cell 1 outerHTML / xml:", node1.outerHTML || new dom.window.XMLSerializer().serializeToString(node1));
    }
  }
}

test().catch(console.error);
