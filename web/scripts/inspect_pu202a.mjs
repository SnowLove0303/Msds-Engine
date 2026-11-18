import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-202A';
  const files = await fs.readdir(dir);
  console.log('PU-202A files:', files);

  const cnFile = files.find(f => f.includes('CN') && f.endsWith('.docx'));
  if (cnFile) {
    const buf = await fs.readFile(`${dir}/${cnFile}`);
    const engine = await loadDocx(buf, cnFile);
    const s11 = engine.records.find(r => r.sectionNumber === 11);
    console.log(`\n=== PU-202A CN Section 11 (${s11.rows.length} rows) ===`);
    s11.rows.forEach((r, idx) => {
      console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
    });
  }

  const enFile = files.find(f => f.includes('EN') && f.endsWith('.docx'));
  if (enFile) {
    const buf = await fs.readFile(`${dir}/${enFile}`);
    const engine = await loadDocx(buf, enFile);
    const s11 = engine.records.find(r => r.sectionNumber === 11);
    console.log(`\n=== PU-202A EN Section 11 (${s11.rows.length} rows) ===`);
    s11.rows.forEach((r, idx) => {
      console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
    });
  }
}
main();
