import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
const { loadDocx } = await import('../src/docx-engine.js');

async function main() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const engine = await loadDocx(buf, 'cn_tpl.docx');
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  console.log('CN Template Section 8 rows:', s8.rows.length);
  s8.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: "${r.cells[0]?.text}" | "${r.cells[1]?.text || ''}"`);
  });
}
main();
