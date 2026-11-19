import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
const buf = fs.readFileSync(p);
const eng = await loadDocx(buf, 'pa.docx');

const allS11 = eng.records.filter(r => r.sectionNumber === 11);
const section11FactsOrRecords = allS11[1];

console.log('typeof:', typeof section11FactsOrRecords);
console.log('isMultiComponentComposite:', section11FactsOrRecords?.isMultiComponentComposite);
console.log('isMultiComponentS11:', section11FactsOrRecords?.isMultiComponentS11);
console.log('isArray:', Array.isArray(section11FactsOrRecords));
console.log('text:', section11FactsOrRecords?.text);

let rawText = '';
if (typeof section11FactsOrRecords === 'string') {
  rawText = section11FactsOrRecords;
} else if (Array.isArray(section11FactsOrRecords)) {
  rawText = section11FactsOrRecords.map(item => (typeof item === 'string' ? item : (item?.text || (item?.rows ? item.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ') : '')))).join(' ');
} else if (section11FactsOrRecords.text && typeof section11FactsOrRecords.text === 'string') {
  rawText = section11FactsOrRecords.text;
} else if (section11FactsOrRecords.rows && Array.isArray(section11FactsOrRecords.rows)) {
  rawText = section11FactsOrRecords.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ');
}
console.log('Evaluated rawText:', rawText);
const componentMatches = new Set();
const casMatches = rawText.match(/\b\d{2,7}-\d{2}-\d\b/g) || [];
casMatches.forEach(c => componentMatches.add(c));
console.log('casMatches:', casMatches);
const knownComponentKeywords = ['丙二醇丁醚', '二乙二醇丁醚', '溶剂', '添加剂'];
knownComponentKeywords.forEach(kw => {
  if (rawText.includes(kw)) componentMatches.add(kw);
});
console.log('componentMatches size:', componentMatches.size);
if (componentMatches.size >= 2) {
  console.log('Result: PARADIGM_1_FULL_WIDTH_MERGED');
} else {
  console.log('Result: PARADIGM_2_STANDARD_SLOTS');
}
