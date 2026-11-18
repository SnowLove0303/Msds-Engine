import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

async function checkS11Rows() {
  const cnBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx');
  const cnEngine = await loadDocx(cnBuf, 'cn.docx');
  const cnS11 = cnEngine.records.find(r => r.sectionNumber === 11);
  console.log('CN S11 rows count:', cnS11.rows.length);

  const enBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_EN Guanzhi.docx');
  const enEngine = await loadDocx(enBuf, 'en.docx');
  const enS11 = enEngine.records.find(r => r.sectionNumber === 11);
  console.log('EN S11 rows count:', enS11.rows.length);
  enS11.rows.forEach((r, idx) => {
    console.log(`  Row ${idx}: ${r.cells.map(c => c.text.slice(0, 50)).join(' | ')}`);
  });
}

checkS11Rows().catch(console.error);
