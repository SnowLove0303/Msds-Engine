import fs from 'fs';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

async function checkRawParas() {
  const p4902Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';
  const e4902 = await loadDocx(fs.readFileSync(p4902Src));

  const s2Records = e4902.records.filter(r => r.sectionNumber === 2);
  const rawParas = [];
  for (const rec of s2Records) {
    if (rec.rows) {
      for (let r = 1; r < rec.rows.length; r++) {
        for (const cell of rec.rows[r].cells) {
          for (const p of cell.paragraphs) {
            const txt = p.runs.map(r => r.text).join('').trim();
            if (txt) rawParas.push(txt);
          }
        }
      }
    }
  }

  console.log('rawParas length:', rawParas.length);
  rawParas.forEach((p, idx) => console.log(`${idx}: ${p}`));
}

checkRawParas().catch(console.error);
