import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplBuf = await fs.readFile(tplPath);
  const tplEngine = await loadDocx(tplBuf, 'tpl.docx');
  const s11 = tplEngine.records.find(r => r.sectionNumber === 11);
  console.log('Template Section 11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });

  const tplEnPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const tplEnBuf = await fs.readFile(tplEnPath);
  const tplEnEngine = await loadDocx(tplEnBuf, 'tpl_en.docx');
  const s11En = tplEnEngine.records.find(r => r.sectionNumber === 11);
  console.log('\nEN Template Section 11 rows count:', s11En.rows.length);
  s11En.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });
}
main();
