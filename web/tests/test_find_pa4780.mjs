import fs from 'fs';
import path from 'path';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const base = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版';
const dirs = fs.readdirSync(base);
for (const d of dirs) {
  if (d.includes('02-1')) {
    const sub = path.join(base, d, 'PA-4780');
    if (fs.existsSync(sub)) {
      const files = fs.readdirSync(sub);
      console.log('PA-4780 dir found! Files:', files);
      const docPath = path.join(sub, 'PA-4780 msds_CN 冠志.docx');
      if (fs.existsSync(docPath)) {
        const eng = await loadDocx(fs.readFileSync(docPath), 'pa.docx');
        const s9 = eng.records.find(r => r.sectionNumber === 9);
        const s11 = eng.records.find(r => r.sectionNumber === 11);
        console.log('PA-4780 CN S9 rows count:', s9?.rows.length);
        console.log('PA-4780 CN S11 rows count:', s11?.rows.length);
      }
    }
  }
}
