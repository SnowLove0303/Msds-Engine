import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const docCn = await loadDocx(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902 msds_CN 冠志.docx'));
const docEn = await loadDocx(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902 msds_EN Guanzhi.docx'));

console.log('=== PA-4902 EN SECTION 2 ===');
const s2En = docEn.records.find(r => r.sectionNumber === 2);
s2En?.rows?.forEach((r, ri) => console.log(`R${ri}:`, r.cells.map(c => c.text).join(' | ')));

console.log('\n=== PA-4902 EN SECTION 3 ===');
const s3En = docEn.records.find(r => r.sectionNumber === 3);
s3En?.rows?.forEach((r, ri) => console.log(`R${ri}:`, r.cells.map(c => c.text).join(' | ')));

console.log('\n=== PA-4902 CN SECTION 9 ROWS COUNT ===');
const s9Cn = docCn.records.find(r => r.sectionNumber === 9);
console.log('Rows count:', s9Cn?.rows?.length);
s9Cn?.rows?.forEach((r, ri) => console.log(`R${ri}:`, r.cells[0]?.text));

console.log('\n=== PA-4902 CN SECTION 11 ===');
const s11Cn = docCn.records.find(r => r.sectionNumber === 11);
s11Cn?.rows?.forEach((r, ri) => console.log(`R${ri}:`, r.cells.map(c => c.text).join(' | ')));
