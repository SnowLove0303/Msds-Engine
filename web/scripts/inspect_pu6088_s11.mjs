import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-303A/PU-303A msds_CN 冠志.docx';
  const buf = await fs.readFile(cnPath);
  const engine = await loadDocx(buf, 'test.docx');
  const s11 = engine.records.find(r => r.sectionNumber === 11);
  console.log('PU-303A CN Section 11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });

  const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-303A/PU-303A msds_EN Guanzhi.docx';
  const enBuf = await fs.readFile(enPath);
  const enEngine = await loadDocx(enBuf, 'test_en.docx');
  const enS11 = enEngine.records.find(r => r.sectionNumber === 11);
  console.log('PU-303A EN Section 11 rows count:', enS11.rows.length);
  enS11.rows.forEach((r, idx) => {
    console.log(`EN Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });
}
main();
