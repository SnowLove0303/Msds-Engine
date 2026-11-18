import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourceDocxPath);
const cnEngine = await loadDocx(buf, 'cn.docx');

const s3 = cnEngine.records.find(r => r.sectionNumber === 3);
console.log('CN Section 3 rows:');
s3.rows.forEach((r, idx) => {
  console.log(`Row ${idx}:`, r.cells.map(c => c.text));
});
