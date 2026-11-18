import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';
import { runSmartMatching } from './src/smart-matching.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkS12Match() {
  const srcBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx');
  const src = await loadDocx(srcBuf, 'src');
  const matchResult = runSmartMatching(src.records);
  const s12 = matchResult.matchedSections.find(s => s.sectionNumber === 12);
  console.log('=== S12 MATCHED ROWS ===');
  s12.matchedRows.forEach(r => {
    console.log(`key=${r.key} label="${r.standardLabel}" value="${r.value}" status=${r.status}`);
  });
}
checkS12Match();
