import fs from 'node:fs/promises';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function check() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const buf = await fs.readFile(srcPath);
  const eng = await loadDocx(buf, 'src.docx');
  const s11 = eng.records.find(r => r.sectionNumber === 11);
  console.log('=== SOURCE S11 RAW TEXT ===');
  console.log(s11.rows[1].cells[0].text);
}
check();
