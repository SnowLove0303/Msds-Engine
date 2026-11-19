import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
const buf = fs.readFileSync(p);
const eng = await loadDocx(buf, 'pa.docx');

const s11Rec = eng.records.find(r => r.sectionNumber === 11);
const rawText = JSON.stringify(s11Rec, (key, value) => {
  if (key === 'node' || key === 'record' || key === 'table' || key === 'parent') return undefined;
  return value;
});
console.log('rawText length:', rawText.length);
const cas = rawText.match(/\b\d{2,7}-\d{2}-\d\b/g);
console.log('cas in json:', cas);
const knownComponentKeywords = ['丙二醇丁醚', '二乙二醇丁醚', '溶剂', '添加剂'];
console.log('kw:', knownComponentKeywords.filter(k => rawText.includes(k)));
