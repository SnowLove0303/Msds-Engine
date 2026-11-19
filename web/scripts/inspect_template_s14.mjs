import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');

const buf = fs.readFileSync(tplPath);
const eng = await loadDocx(buf, 'tpl.docx');
const s14 = eng.records.find(r => r.sectionNumber === 14);
console.log('Section 14 rows in template:');
s14.rows.forEach((r, idx) => {
  console.log(`Row ${idx}: cells=[${r.cells.map(c => `"${c.text || ''}"`).join(', ')}]`);
});
