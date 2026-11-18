import { JSDOM } from 'jsdom';
import fs from 'fs';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

const buf = fs.readFileSync(sourceDocxPath);
const srcDoc = await loadDocx(buf);
const s11 = srcDoc.records.find(r => r.sectionNumber === 11);
console.log('Source S11 rows count:', s11?.rows?.length);
s11?.rows?.forEach((r, idx) => {
  console.log(`Src Row ${idx}:`, r.cells.map(c => c.text || '').join(' | '));
});
