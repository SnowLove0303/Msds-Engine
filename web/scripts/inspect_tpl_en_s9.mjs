import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates';
const files = fs.readdirSync(dir);
const enFile = files.find(f => f.includes('EN'));
console.log('Found EN template:', enFile);

const buf = fs.readFileSync(path.join(dir, enFile));
const doc = await loadDocx(buf);
const s9 = doc.records.find(r => r.sectionNumber === 9);
console.log('EN Template S9 rows count:', s9?.rows?.length);
s9?.rows?.forEach((r, idx) => console.log(`  Row ${idx}:`, r.cells.map(c => c.text || '').join(' | ')));
