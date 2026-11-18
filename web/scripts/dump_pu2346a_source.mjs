import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function inspectSource() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'PU-2346A.docx');

  console.log('Total records:', engine.records.length);
  for (const [idx, rec] of engine.records.entries()) {
    console.log(`\n=== Record ${idx}: Section ${rec.sectionNumber}, kind=${rec.kind}, rows=${rec.rows?.length} ===`);
    if (rec.rows) {
      for (const r of rec.rows) {
        const c0 = r.cells[0]?.text?.trim() || '';
        const c1 = r.cells[1]?.text?.trim() || '';
        const c2 = r.cells[2]?.text?.trim() || '';
        console.log(`  [${c0}] | [${c1}] ${c2 ? '| [' + c2 + ']' : ''}`);
      }
    } else {
      console.log(`  text: ${rec.text}`);
    }
  }
}

inspectSource().catch(console.error);
