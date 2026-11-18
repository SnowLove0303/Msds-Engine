import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 msds_CN 冠志.docx';
  const buf = await fs.promises.readFile(p);
  const engine = await loadDocx(buf);
  console.log('Tables in output docx:', engine.records.filter(r => r.kind === 'table').length);
  for (const r of engine.records.filter(r => r.kind === 'table')) {
    console.log(`Table ${r.id} (secNum: ${r.sectionNumber}, title: ${r.title}) rows: ${r.rows.length}`);
    if (r.sectionNumber === 1) {
      console.log('  Section 1 rows:');
      for (const row of r.rows) {
        console.log(`    ${row.cells.map(c => c.text).join(' | ')}`);
      }
    }
  }
}

main().catch(console.error);
