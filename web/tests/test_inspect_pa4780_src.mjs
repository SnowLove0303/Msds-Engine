import fs from 'fs';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const docPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4780/PA-4780 msds_CN 冠志_源文件留存.docx';
const eng = await loadDocx(fs.readFileSync(docPath), 'src.docx');
const s9 = eng.records.find(r => r.sectionNumber === 9);
const s11 = eng.records.find(r => r.sectionNumber === 11);
console.log('PA-4780 ORIGINAL SOURCE S9 rows count:', s9?.rows.length);
console.log('PA-4780 ORIGINAL SOURCE S11 rows count:', s11?.rows.length);
