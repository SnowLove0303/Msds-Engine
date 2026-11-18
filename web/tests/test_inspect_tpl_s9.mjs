import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const tplEngine = await loadDocx(fs.readFileSync(tplPath), 'tpl.docx');
const s9 = tplEngine.records.find(r => r.sectionNumber === 9);
console.log('CN Template S9 rows count:', s9.rows.length);
s9.rows.forEach((r, i) => console.log(`  Row ${i}: ${r.cells[0]?.text?.trim()} => ${r.cells[1]?.text?.trim()}`));
