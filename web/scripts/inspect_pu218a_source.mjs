import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'src.docx');
  const s11 = engine.records.find(r => r.sectionNumber === 11);
  console.log('PU-218A source Section 11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });
}
main();
