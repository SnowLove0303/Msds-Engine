import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx, W_NS } from '../src/docx-engine.js';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx');
  const engine = await loadDocx(buf);
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  s9.rows.forEach((r, i) => {
    console.log(`Row ${i} (${r.cells.length} cells):`);
    r.cells.forEach((c, ci) => {
      console.log(`  Cell ${ci}: '${c.text}'`);
    });
  });
}

main().catch(console.error);
