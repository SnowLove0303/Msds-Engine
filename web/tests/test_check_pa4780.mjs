import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const pa4780 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 水性丙烯酸乳液 PA/PA-4780/PA-4780 msds_CN 冠志.docx';
const eng = await loadDocx(fs.readFileSync(pa4780), 'pa.docx');
const s9 = eng.records.find(r => r.sectionNumber === 9);
const s11 = eng.records.find(r => r.sectionNumber === 11);
console.log('PA-4780 S9 rows count:', s9.rows.length);
console.log('PA-4780 S11 rows count:', s11.rows.length);
