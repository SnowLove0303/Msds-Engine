import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';
import { detectNonHazardousComposite } from './src/smart-matching.js';

async function check() {
  const cnBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx');
  const cnEngine = await loadDocx(cnBuf, 'cn.docx');
  const res = detectNonHazardousComposite(cnEngine.records, {});
  console.log('detectNonHazardousComposite:', res);
}

check().catch(console.error);
