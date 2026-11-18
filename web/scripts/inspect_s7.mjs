import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const pCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 msds_CN 冠志.docx';
  const engineCn = await loadDocx(await fs.promises.readFile(pCn));
  const s7 = engineCn.records.find(r => r.sectionNumber === 7);
  console.log('Section 7 rows:');
  for (const row of s7.rows) {
    console.log('  ' + row.cells.map(c => c.text).join(' | '));
  }
}

main().catch(console.error);
