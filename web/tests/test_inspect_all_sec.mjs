import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import fs from 'fs';
import { loadDocx } from '../src/docx-engine.js';

// Let's inspect all text in the CN source Section 1 to 16 to see if there are other unmapped terms
const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const buf = fs.readFileSync(srcPath);
const cnEngine = await loadDocx(buf, 'cn.docx');

console.log('CN Engine sections:');
cnEngine.records.forEach(r => {
  console.log(`Sec ${r.sectionNumber}: ${r.title} (${r.rows?.length || 0} rows)`);
});
