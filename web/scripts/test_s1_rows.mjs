import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx';
const buf = fs.readFileSync(srcPath);
const doc = await loadDocx(buf, 'src.docx');
const res = runSmartMatching(doc.records);

for (let i = 0; i < res.matchedSections[0].matchedRows.length; i++) {
  const r = res.matchedSections[0].matchedRows[i];
  console.log(`Row ${i} [${r.key} / ${r.standardLabel}]: "${r.value}" (status: ${r.status})`);
}
