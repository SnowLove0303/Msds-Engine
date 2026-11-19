import fs from 'fs';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

async function checkS2Records() {
  const p4902Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';
  const e4902 = await loadDocx(fs.readFileSync(p4902Src));

  const s2Records = e4902.records.filter(r => r.sectionNumber === 2);
  console.log('s2Records count:', s2Records.length);
  for (const rec of s2Records) {
    console.log('Record kind:', rec.kind, 'rows:', rec.rows?.length);
    if (rec.rows) {
      rec.rows.forEach((r, idx) => {
        console.log(`Row ${idx}:`, r.cells.map(c => c.text).join(' | '));
      });
    }
  }
}

checkS2Records().catch(console.error);
