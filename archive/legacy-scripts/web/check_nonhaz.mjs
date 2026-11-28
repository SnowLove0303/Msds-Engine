import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';
import { detectNonHazardousComposite } from './src/pipeline-engine.js';
import { runSmartMatching } from './src/smart-matching.js';

async function check() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx');
  const engine = await loadDocx(buf, 'test.docx');
  const matchResult = runSmartMatching(engine.records);
  console.log('matchResult.facts?.isNonHazardousComposite:', matchResult.facts?.isNonHazardousComposite);
  const detected = detectNonHazardousComposite(engine.records, {});
  console.log('detectNonHazardousComposite:', detected);
}

check().catch(console.error);
