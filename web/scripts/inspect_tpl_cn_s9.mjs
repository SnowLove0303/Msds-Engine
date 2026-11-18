import { JSDOM } from 'jsdom';
import fs from 'fs';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/custom/TPL_GUANZHI_CN.docx');
const doc = await loadDocx(buf);
const s9 = doc.records.find(r => r.sectionNumber === 9);
console.log('TPL_GUANZHI_CN Section 9 rows count:', s9?.rows?.length);
s9?.rows?.forEach((r, idx) => console.log(`  Row ${idx}:`, r.cells.map(c => c.text || '').join(' | ')));
