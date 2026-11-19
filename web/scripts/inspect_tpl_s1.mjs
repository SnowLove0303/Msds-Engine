import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const buf = fs.readFileSync(tplPath);
const doc = await loadDocx(buf, 'tpl.docx');
const s1 = doc.records.find(r => r.sectionNumber === 1);

console.log('Template Section 1 rows:');
s1.rows.forEach((r, idx) => {
  console.log(`Row ${idx}: ` + r.cells.map(c => c.text.trim()).join(' | '));
});
