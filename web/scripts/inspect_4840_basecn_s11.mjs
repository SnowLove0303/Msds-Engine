import { buildBaseChineseEngine } from '../src/pipeline-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx');
const baseCn = await buildBaseChineseEngine({
  modelCode: 'PA-4840',
  cnGroundTruthBuffer: buf
});
const s11 = baseCn.records.find(r => r.sectionNumber === 11);
console.log('Rows count:', s11.rows.length);
s11.rows.forEach((r, ri) => {
  console.log(`Row ${ri}: [${r.cells.map(c => c.text).join(' | ')}]`);
});
