import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { safeColonSplit, sanitizeTypographyAndSymbols, SECTION_SLOT_REGISTRY, resolveSlotBySemantics } from '../src/smart-matching.js';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx';
  const buf = await fs.promises.readFile(p);
  const srcEngine = await loadDocx(buf);

  for (let s of [1, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16]) {
    const sRecs = srcEngine.records.filter(r => r.sectionNumber === s);
    const rawPairs = [];
    for (const rec of sRecs) {
      if (rec.rows) {
        for (const row of rec.rows) {
          if (row.index === 0 && row.cells.length === 1) continue;
          rawPairs.push({ rawLabel: row.cells[0]?.text || '', rawValue: row.cells[1]?.text || '' });
        }
      } else if (rec.text) {
        const lines = rec.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (/^\s*\d+\s*[\.、]/.test(line) && line.length < 30) continue;
          const cs = safeColonSplit(line);
          if (cs.hasColon && cs.label) {
            rawPairs.push({ rawLabel: cs.label, rawValue: cs.value });
          } else {
            rawPairs.push({ rawLabel: '', rawValue: line });
          }
        }
      }
    }
    console.log(`=== Section ${s} (${rawPairs.length} pairs) ===`);
    for (const pair of rawPairs) {
      const slot = resolveSlotBySemantics(pair.rawLabel || pair.rawValue, s);
      console.log(`  [${pair.rawLabel || 'NO_LABEL'}] -> val="${pair.rawValue.slice(0, 40)}" | slot=${slot?.slot?.key} (conf=${slot?.confidence})`);
    }
  }
}

main().catch(console.error);
