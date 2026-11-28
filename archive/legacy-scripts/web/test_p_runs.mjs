import fs from 'fs';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const eng = await loadDocx(fs.readFileSync('算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx'));
const s2 = eng.records.find(r => r.sectionNumber === 2);
const c = s2.rows[1].cells[0];

console.log('--- Current EN Section 2 Paragraphs and Runs ---');
c.paragraphs.forEach((p, pIdx) => {
  const pTxt = p.runs.map(r => r.text).join('');
  console.log(`P${pIdx} [total: "${pTxt}"]:`);
  p.runs.forEach((r, rIdx) => {
    const hasB = r.node?.getElementsByTagName('w:b')?.length > 0;
    console.log(`   R${rIdx}: [bold=${hasB}] "${r.text}"`);
  });
});
