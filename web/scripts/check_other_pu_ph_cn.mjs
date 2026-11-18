import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkOtherPuCn() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'PU-218A.docx');
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    for (const r of s9.rows) {
      const lbl = r.cells[0]?.text?.trim();
      const val = r.cells[1]?.text?.trim();
      if (/pH/i.test(lbl)) {
        console.log('PU-218A CN pH:', lbl, '-->', val);
      }
    }
  }
}

checkOtherPuCn().catch(console.error);
