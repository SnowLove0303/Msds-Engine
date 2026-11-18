import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { decomposeCellPairToFacts } = await import('../src/pipeline-engine.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourcePath);
const srcEngine = await loadDocx(buf);
const s14 = srcEngine.records.find(r => r.sectionNumber === 14);

console.log('s14 rows count:', s14.rows.length);
s14.rows.forEach((r, idx) => {
  console.log(`\nRow ${idx+1}: cells count = ${r.cells.length}`);
  r.cells.forEach((c, cIdx) => console.log(`  Cell ${cIdx+1}: "${c.text.trim()}"`));
  const pairs = decomposeCellPairToFacts(r.cells[0], r.cells[1], r, 14);
  console.log('  Pairs:', pairs);
});
