import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkPu2346Rewrite() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346/PU-2346 msds_CN 冠志.docx';
  try {
    const buf = await fs.readFile(p);
    const engine = await loadDocx(buf, 'PU-2346.docx');
    const s9 = engine.records.find(r => r.sectionNumber === 9);
    console.log('=== PU-2346 Rewrite CN S9 ===');
    for (const r of s9.rows) {
      if (/pH/i.test(r.cells[0]?.text || '')) {
        console.log(r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
      }
    }
  } catch (e) {
    console.log('PU-2346 rewrite not found');
  }

  const pEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346/PU-2346 msds_EN Guanzhi.docx';
  try {
    const buf = await fs.readFile(pEn);
    const engine = await loadDocx(buf, 'PU-2346_en.docx');
    const s9 = engine.records.find(r => r.sectionNumber === 9);
    console.log('=== PU-2346 Rewrite EN S9 ===');
    for (const r of s9.rows) {
      if (/pH/i.test(r.cells[0]?.text || '')) {
        console.log(r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
      }
    }
  } catch (e) {
    console.log('PU-2346 rewrite EN not found');
  }
}

checkPu2346Rewrite().catch(console.error);
