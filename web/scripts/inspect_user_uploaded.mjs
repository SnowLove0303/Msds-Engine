import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const uploadedPath = 'C:/Users/Administrator/.gemini/antigravity/brain/0de56448-63c4-4aba-b1c2-58a349e28746/.user_uploaded/media_1793861950582_103ea337.docx';
  const buf = await fs.readFile(uploadedPath);
  const engine = await loadDocx(buf, 'user_uploaded.docx');
  console.log('User uploaded docx records count:', engine.records.length);
  for (const r of engine.records) {
    if (!r.rows || r.rows.length === 0) continue;
    console.log(`\n=== Section ${r.sectionNumber}: ${r.rows[0]?.cells?.[0]?.text} === (${r.rows.length} rows)`);
    for (let i = 0; i < Math.min(r.rows.length, 5); i++) {
      console.log(`  Row ${i}:`, r.rows[i].cells?.map(c => c.text?.slice(0, 50)));
    }
  }
}
main();
