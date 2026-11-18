import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-6088E/PU-6088E msds_CN 冠志.docx');
  const engine = await loadDocx(buf, 'test.docx');
  const s11 = engine.records.find(r => r.sectionNumber === 11);
  console.log('Section 11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });
}
main();
