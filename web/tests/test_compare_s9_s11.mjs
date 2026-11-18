import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80';
const cnPath = `${targetDir}/OS-9547 PGDA80 msds_CN 冠志.docx`;
const enPath = `${targetDir}/OS-9547 PGDA80 msds_EN Guanzhi.docx`;

const cnEngine = await loadDocx(fs.readFileSync(cnPath), 'cn.docx');
const enEngine = await loadDocx(fs.readFileSync(enPath), 'en.docx');

const cnS9 = cnEngine.records.find(r => r.sectionNumber === 9);
const enS9 = enEngine.records.find(r => r.sectionNumber === 9);
console.log('=== Section 9 ===');
console.log(`CN S9 rows (${cnS9.rows.length}):`);
cnS9.rows.forEach((r, i) => console.log(`  Row ${i}: ${r.cells[0]?.text?.trim()}`));
console.log(`EN S9 rows (${enS9.rows.length}):`);
enS9.rows.forEach((r, i) => console.log(`  Row ${i}: ${r.cells[0]?.text?.trim()}`));

const cnS11 = cnEngine.records.find(r => r.sectionNumber === 11);
const enS11 = enEngine.records.find(r => r.sectionNumber === 11);
console.log('\n=== Section 11 ===');
console.log(`CN S11 rows (${cnS11.rows.length}):`);
cnS11.rows.forEach((r, i) => console.log(`  Row ${i}: ${r.cells[0]?.text?.trim()}`));
console.log(`EN S11 rows (${enS11.rows.length}):`);
enS11.rows.forEach((r, i) => console.log(`  Row ${i}: ${r.cells[0]?.text?.trim()}`));
