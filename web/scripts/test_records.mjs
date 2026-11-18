import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { translateSection9Item } from '../src/pipeline-engine.js';

async function main() {
  const buf = await fs.promises.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx');
  const engine = await loadDocx(buf);
  const t2 = engine.records.find(r => r.id === 'word/document.xml-table-2');

  const items = [];
  const firstRowText = (t2.rows[0]?.cells?.[0]?.text || '').trim();
  const startIdx = /^(?:9\s*[\.、]|理化特性|physical)/i.test(firstRowText) ? 1 : 0;
  for (let rIdx = startIdx; rIdx < t2.rows.length; rIdx++) {
    const row = t2.rows[rIdx];
    const c0 = row.cells[0];
    const c1 = row.cells[1];
    if (!c0) continue;
    items.push({
      rawLabel: (c0.text || '').trim(),
      rawValue: (c1?.text || '').trim()
    });
  }

  console.log(`Extracted ${items.length} items:`);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const tr = translateSection9Item(i + 1, it.rawLabel, it.rawValue);
    console.log(`[${i + 1}] CN: ${it.rawLabel} = ${it.rawValue} | EN: ${tr.enLabel} = ${tr.enVal}`);
  }
}

main().catch(console.error);
