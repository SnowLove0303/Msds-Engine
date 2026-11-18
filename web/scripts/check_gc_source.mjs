import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkGcSource() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 国彩.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'gc.docx');
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  console.log('=== PU-2346A 国彩 S9 ===');
  for (const r of s9.rows) {
    if (/pH/i.test(r.cells[0]?.text || '')) {
      console.log(r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
    }
  }
}

checkGcSource().catch(console.error);
