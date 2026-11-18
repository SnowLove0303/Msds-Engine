import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkS9Detail() {
  const srcBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx');
  const src = await loadDocx(srcBuf, 'src');
  const outBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志.docx');
  const out = await loadDocx(outBuf, 'out');
  const gtBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志 (手动调整）.docx');
  const gt = await loadDocx(gtBuf, 'gt');

  console.log('=== S9 SOURCE ===');
  src.records.find(r => r.sectionNumber === 9).rows.forEach((r, i) => {
    console.log(`S9-R${i}: ${r.cells.map(c => c.text).join(' | ')}`);
  });

  console.log('\n=== S9 OUTPUT ===');
  out.records.find(r => r.sectionNumber === 9).rows.forEach((r, i) => {
    console.log(`OUT-R${i}: ${r.cells.map(c => c.text).join(' | ')}`);
  });

  console.log('\n=== S9 GT ===');
  gt.records.find(r => r.sectionNumber === 9).rows.forEach((r, i) => {
    console.log(`GT-R${i}: ${r.cells.map(c => c.text).join(' | ')}`);
  });
}
checkS9Detail();
