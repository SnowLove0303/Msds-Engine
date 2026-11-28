import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

const cnDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
const eng = await loadDocx(fs.readFileSync(cnDocxPath));

console.log('--- CN Sections Value Cells Bold Status ---');
eng.records.forEach(r => {
  if (r.kind !== 'table') return;
  const sampleRow = r.rows[1] || r.rows[0];
  const c1 = sampleRow.cells[1] || sampleRow.cells[0];
  const bs = c1?.node?.getElementsByTagName('w:b');
  const hasBold = bs && bs.length > 0 && bs[0].getAttribute('w:val') !== '0';
  console.log(`Sec ${r.sectionNumber}: bold=${hasBold}, text=${c1?.text?.slice(0, 30)}`);
});
