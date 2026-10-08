import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const files = [
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1007 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3617 MSDS-CN 国彩.docx'
];

for (const f of files) {
  const buf = await fs.readFile(f);
  const eng = await loadDocx(buf, path.basename(f));
  console.log(`\n=== FILE: ${path.basename(f)} ===`);
  for (const r of eng.records.filter(r => r.kind === 'table')) {
    for (const row of r.rows) {
      if (row.cells.length === 1) {
        const c = row.cells[0];
        console.log(`Sec ${r.sectionNumber} Row ${row.index}: kind=${c.kind}, label='${c.labelText.slice(0, 20)}', val='${c.valueText.slice(0, 30)}', full='${c.text.slice(0, 40).replace(/\n/g, ' ')}'`);
      }
    }
  }
}
