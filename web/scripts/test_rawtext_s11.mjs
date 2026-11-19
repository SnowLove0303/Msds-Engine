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
let rawText = '';
if (s11Rec.node && typeof s11Rec.node.textContent === 'string') {
  rawText = s11Rec.node.textContent;
}
console.log('rawText:', rawText);
const componentMatches = new Set();
const casMatches = rawText.match(/\b\d{2,7}-\d{2}-\d\b/g) || [];
casMatches.forEach(c => componentMatches.add(c));
console.log('casMatches:', casMatches);
const knownComponentKeywords = ['丙二醇丁醚', '二乙二醇丁醚', '溶剂', '添加剂'];
knownComponentKeywords.forEach(kw => {
  if (rawText.includes(kw)) componentMatches.add(kw);
});
console.log('componentMatches:', Array.from(componentMatches));
