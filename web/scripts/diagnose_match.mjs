import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function main() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx';
  const buf = await fs.readFile(srcPath);
  const srcEngine = await loadDocx(buf, 'source.docx');
  const s1 = srcEngine.records.find(r => r.sectionNumber === 1);
  console.log('Source s1 rows:');
  for (const r of s1.rows) {
    console.log(r.cells.map(c => c.text));
  }
  const matchResult = runSmartMatching(srcEngine.records);
  const s1Match = matchResult.matchedSections?.find(s => s.sectionNumber === 1);
  console.log('\nMatched Section 1:');
  for (const r of s1Match?.matchedRows || []) {
    console.log(r.key, '->', JSON.stringify(r.value));
  }
}

main().catch(console.error);
