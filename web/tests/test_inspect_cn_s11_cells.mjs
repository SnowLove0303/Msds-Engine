import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80';
const cnPath = `${targetDir}/OS-9547 PGDA80 msds_CN 冠志.docx`;
const eng = await loadDocx(fs.readFileSync(cnPath), 'cn.docx');
const s11 = eng.records.find(r => r.sectionNumber === 11);
s11.rows.forEach((r, i) => console.log(`Row ${i}: "${r.cells[0]?.text?.trim()}" => "${r.cells[1]?.text?.trim()}"`));
