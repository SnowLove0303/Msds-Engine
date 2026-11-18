import fs from 'fs';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const tpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';
const eng = await loadDocx(fs.readFileSync(tpl), 'en_tpl.docx');
const s11 = eng.records.find(r => r.sectionNumber === 11);
console.log('EN Template S11 rows:');
s11.rows.forEach((r, idx) => {
  console.log(`Row ${idx}: "${r.cells[0]?.text}" => "${r.cells[r.cells.length - 1]?.text}"`);
});
