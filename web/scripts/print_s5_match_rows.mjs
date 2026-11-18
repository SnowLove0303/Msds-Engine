import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';
import fs from 'fs';

async function test() {
  const srcFile = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
  const srcEngine = await loadDocx(fs.readFileSync(srcFile), 'src.docx');
  const matchResult = runSmartMatching(srcEngine.records);
  const s5 = matchResult.matchedSections.find(s => s.sectionNumber === 5);
  console.log(JSON.stringify(s5.matchedRows, null, 2));
}

test().catch(console.error);
