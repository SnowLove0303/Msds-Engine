import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourceDocxPath);
const cnEngine = await loadDocx(buf, 'cn.docx');

function extractComponentsFromCnS3(cnS3) {
  if (!cnS3 || cnS3.rows.length < 5) return [];
  const rawRows = [];
  for (let i = 4; i < cnS3.rows.length; i++) {
    const r = cnS3.rows[i];
    const c0 = (r.cells[0]?.text || '').trim();
    const c1 = (r.cells[1]?.text || '').trim();
    const c2 = (r.cells[2]?.text || '').trim();
    if (c0.includes('\n')) {
      const names = c0.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const casList = c1.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const concList = c2.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      for (let k = 0; k < names.length; k++) {
        rawRows.push({
          name: names[k],
          cas: casList[k] || casList[0] || '',
          conc: concList[k] || concList[0] || ''
        });
      }
    } else if (c0) {
      rawRows.push({ name: c0, cas: c1, conc: c2 });
    }
  }
  return rawRows;
}

const comps = extractComponentsFromCnS3(cnEngine.records.find(r => r.sectionNumber === 3));
console.log('Extracted components:', JSON.stringify(comps, null, 2));
