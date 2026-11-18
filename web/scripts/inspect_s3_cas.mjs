import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { validateCasChecksum } from '../src/cas-validator.js';

async function main() {
  const pCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 msds_CN 冠志.docx';
  const pEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 msds_EN Guanzhi.docx';
  const engineCn = await loadDocx(await fs.promises.readFile(pCn));
  const engineEn = await loadDocx(await fs.promises.readFile(pEn));

  const s3Cn = engineCn.records.find(r => r.sectionNumber === 3);
  console.log('CN Section 3 rows:');
  for (let r = 0; r < s3Cn.rows.length; r++) {
    const row = s3Cn.rows[r];
    const cas = (row.cells[1]?.text || '').trim();
    const res = validateCasChecksum(cas);
    console.log(`  Row ${r}: cells=${row.cells.map(c => c.text).join(' | ')} -> cas="${cas}", valid=${res.valid}, reason=${res.reason}`);
  }

  const s3En = engineEn.records.find(r => r.sectionNumber === 3);
  console.log('EN Section 3 rows:');
  for (let r = 0; r < s3En.rows.length; r++) {
    const row = s3En.rows[r];
    const cas = (row.cells[1]?.text || '').trim();
    const res = validateCasChecksum(cas);
    console.log(`  Row ${r}: cells=${row.cells.map(c => c.text).join(' | ')} -> cas="${cas}", valid=${res.valid}, reason=${res.reason}`);
  }
}

main().catch(console.error);
