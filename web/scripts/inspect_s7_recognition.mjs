import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { safeColonSplit, resolveSlotBySemantics } from '../src/smart-matching.js';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx';
  const buf = await fs.promises.readFile(p);
  const srcEngine = await loadDocx(buf);

  for (let s = 1; s <= 16; s++) {
    const sRecs = srcEngine.records.filter(r => r.sectionNumber === s);
    const pairs = [];
    for (const rec of sRecs) {
      if (rec.rows) {
        for (const row of rec.rows) {
          if (row.index === 0 && row.cells.length === 1) continue;
          const c0 = row.cells[0]?.text || '';
          const c1 = row.cells[1]?.text || '';
          pairs.push({ rawLabel: c0, rawValue: c1 });
        }
      } else if (rec.text) {
        const lines = rec.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          const split = safeColonSplit(line);
          if (split && split.isColon) {
            pairs.push({ rawLabel: split.label, rawValue: split.value });
          } else if (!/^\s*\d+\s*[\.、]/.test(line)) {
            pairs.push({ rawLabel: '', rawValue: line });
          }
        }
      }
    }
    console.log(`Section ${s} (${pairs.length} pairs):`, pairs.slice(0, 3));
  }
}

main().catch(console.error);
