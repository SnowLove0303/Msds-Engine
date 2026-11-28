import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

async function printAllParas(label, path) {
  const buf = fs.readFileSync(path);
  const engine = await loadDocx(buf, 'test.docx');
  const srcS2 = engine.records.find(r => r.sectionNumber === 2);
  const rawParas = [];
  for (let r = 1; r < srcS2.rows.length; r++) {
    for (const cell of srcS2.rows[r].cells) {
      for (const p of cell.paragraphs) {
        const txt = p.runs.map(r => r.text).join('').trim();
        if (txt) rawParas.push(txt);
      }
    }
  }
  console.log(`\n=== All ${rawParas.length} Paras for [${label}] ===`);
  rawParas.forEach((p, i) => console.log(`${i}: ${p}`));
}

async function main() {
  await printAllParas('PU-218A', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx');
}

main().catch(console.error);
