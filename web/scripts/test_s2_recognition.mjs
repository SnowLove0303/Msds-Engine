import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { parseSection2Text, extractSection2GhsBlocks } = await import('../src/smart-matching.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourcePath);
const srcEngine = await loadDocx(buf);
const s2 = srcEngine.records.find(r => r.sectionNumber === 2);

console.log('--- Raw S2 Table Text ---');
const rawText = s2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
console.log(rawText);

console.log('\n--- parseSection2Text Result ---');
if (parseSection2Text) {
  const parsed = parseSection2Text(rawText);
  console.log(JSON.stringify(parsed, null, 2));
}

console.log('\n--- extractSection2GhsBlocks Result ---');
if (extractSection2GhsBlocks) {
  const blocks = extractSection2GhsBlocks(rawText);
  console.log(JSON.stringify(blocks, null, 2));
}
