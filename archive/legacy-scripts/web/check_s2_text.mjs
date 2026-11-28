import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';
import { parseSection2FromSource } from './src/pipeline-engine.js';

async function check() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
  const docx = await loadDocx(fs.readFileSync(p));
  const parsed = parseSection2FromSource(docx);
  console.log('parsed.signalWord:', JSON.stringify(parsed.signalWord));
  console.log('parsed.pictogramText:', JSON.stringify(parsed.pictogramText));
  console.log('parsed:', parsed);
}
check();
