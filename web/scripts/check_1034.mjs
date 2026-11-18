import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkSample(d) {
  const pCn = `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/${d}/${d} msds_CN 冠志.docx`;
  const pEn = `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/${d}/${d} msds_EN Guanzhi.docx`;
  try {
    const buf = await fs.readFile(pCn);
    const engine = await loadDocx(buf, 'cn.docx');
    const s9 = engine.records.find(r => r.sectionNumber === 9);
    console.log(`=== ${d} CN S9 ===`);
    for (const r of s9.rows) {
      if (/pH/i.test(r.cells[0]?.text || '')) {
        console.log(' ', r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
      }
    }
  } catch (e) {
    console.log(`${d} cn not found`);
  }

  try {
    const buf = await fs.readFile(pEn);
    const engine = await loadDocx(buf, 'en.docx');
    const s9 = engine.records.find(r => r.sectionNumber === 9);
    console.log(`=== ${d} EN S9 ===`);
    for (const r of s9.rows) {
      if (/pH/i.test(r.cells[0]?.text || '')) {
        console.log(' ', r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
      }
    }
  } catch (e) {
    console.log(`${d} en not found`);
  }
}

async function run() {
  await checkSample('PU-1034');
  await checkSample('PU-1036');
}

run().catch(console.error);
