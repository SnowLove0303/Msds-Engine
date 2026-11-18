import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';
import { parseSection2FromSource } from './src/pipeline-engine.js';

async function check() {
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const buf = fs.readFileSync(sourcePath);
  const srcEngine = await loadDocx(buf, 'source.docx');
  const parsed = parseSection2FromSource(srcEngine);
  console.log('parsed result:', parsed);
}

check().catch(console.error);
