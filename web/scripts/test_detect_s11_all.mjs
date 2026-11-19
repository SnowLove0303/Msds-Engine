import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { detectSection11Paradigm } from '../src/pipeline-engine.js';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
const buf = fs.readFileSync(p);
const eng = await loadDocx(buf, 'pa.docx');

const allS11 = eng.records.filter(r => r.sectionNumber === 11);
console.log('allS11 count:', allS11.length);
allS11.forEach((r, idx) => {
  console.log(`idx=${idx}, kind=${r.kind}, text=${r.text?.slice(0, 40)}`);
  console.log(`res=${detectSection11Paradigm(r)}`);
});
