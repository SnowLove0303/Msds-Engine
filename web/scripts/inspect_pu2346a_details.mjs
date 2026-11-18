import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkS9() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'PU-2346A.docx');

  const s9 = engine.records.find(r => r.sectionNumber === 9);
  console.log('=== Section 9 ===');
  if (s9) {
    for (const r of s9.rows) {
      console.log(r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
    }
  }

  const s2 = engine.records.find(r => r.sectionNumber === 2);
  console.log('\n=== Section 2 ===');
  if (s2) {
    for (const r of s2.rows) {
      console.log(r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
    }
  }

  const s3 = engine.records.find(r => r.sectionNumber === 3);
  console.log('\n=== Section 3 ===');
  if (s3) {
    for (const r of s3.rows) {
      console.log(r.cells.map(c => c.text?.trim()).join(' | '));
    }
  }

  const s11 = engine.records.find(r => r.sectionNumber === 11);
  console.log('\n=== Section 11 ===');
  if (s11) {
    console.log('s11 rows count:', s11.rows.length);
    for (const r of s11.rows) {
      console.log(r.cells.map(c => c.text?.trim().slice(0, 50)).join(' | '));
    }
  }
}

checkS9().catch(console.error);
