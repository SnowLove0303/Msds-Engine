import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

async function check() {
  const cnBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx');
  const cnEngine = await loadDocx(cnBuf, 'cn.docx');
  const s2 = cnEngine.records.find((r) => r.sectionNumber === 2);
  const s2Text = s2 ? s2.rows.map((r) => (r.cells || []).map((c) => c.text || '').join(' ')).join(' ') : '';
  console.log('s2Text sample:', s2Text.slice(0, 300));
  console.log('matches "根据GHS不属于危害化学品":', /根据GHS不属于危害化学品/i.test(s2Text));
  console.log('matches "不属于危害化学品":', /不属于危害化学品/i.test(s2Text));
  console.log('matches "不属于危险":', /不属于危险/i.test(s2Text));
  console.log('matches "GHS危险性类别[:：]?\\s*无":', /GHS危险性类别[:：]?\s*无/i.test(s2Text));
  console.log('matches "not classified":', /not classified/i.test(s2Text));
}

check().catch(console.error);
