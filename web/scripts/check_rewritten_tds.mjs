import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkRewrittenTds() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A tds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'PU-2346A_tds.docx');
  for (const rec of engine.records) {
    if (rec.rows) {
      for (const r of rec.rows) {
        const text = r.cells.map(c => c.text?.trim()).join(' | ');
        if (/PH|pH/i.test(text)) {
          console.log('TDS row:', text);
        }
      }
    }
  }
}

checkRewrittenTds().catch(console.error);
