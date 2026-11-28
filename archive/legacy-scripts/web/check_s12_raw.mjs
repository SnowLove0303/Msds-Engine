import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkS12Candidates() {
  const srcBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx');
  const src = await loadDocx(srcBuf, 'src');
  const s12 = src.records.find(r => r.sectionNumber === 12);
  console.log('=== S12 SOURCE ROWS ===');
  s12.rows.forEach((r, i) => {
    console.log(`Row ${i}: cells=${r.cells.length} text=${JSON.stringify(r.cells.map(c => c.text))}`);
  });
}
checkS12Candidates();
