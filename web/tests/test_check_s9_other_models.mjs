import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const pa4780 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01 水性丙烯酸分散体 PA/PA-4780/PA-4780 msds_CN 冠志.docx';
if (fs.existsSync(pa4780)) {
  const eng = await loadDocx(fs.readFileSync(pa4780), 'pa.docx');
  const s9 = eng.records.find(r => r.sectionNumber === 9);
  console.log('PA-4780 S9 rows count:', s9.rows.length);
}
const pu608 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-608/PU-608 msds_CN 冠志.docx';
if (fs.existsSync(pu608)) {
  const eng = await loadDocx(fs.readFileSync(pu608), 'pu.docx');
  const s9 = eng.records.find(r => r.sectionNumber === 9);
  console.log('PU-608 S9 rows count:', s9.rows.length);
}
