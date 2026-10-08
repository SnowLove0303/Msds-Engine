import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../web/src/docx-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkEn() {
  const buf = await fs.readFile('web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const engine = await loadDocx(buf, '正式模板_MSDS_EN_冠志(1).docx');
  for (const r of engine.records) {
    if (r.kind === 'table') {
      console.log(`\n=== EN Section ${r.sectionNumber} ===`);
      for (let i = 0; i < Math.min(r.rows.length, 12); i++) {
        const row = r.rows[i];
        const cells = row.cells.map(c => `[${c.text || ''}]`).join(' | ');
        console.log(`  R${i} (cells=${row.cells.length}): ${cells}`);
      }
    }
  }
}
checkEn().catch(console.error);
