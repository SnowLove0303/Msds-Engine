import fs from 'fs';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const eng = await loadDocx(fs.readFileSync('算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx'));
const s2 = eng.records.find(r => r.sectionNumber === 2);
console.log('=== EN Section 2 XML ===');
console.log(new globalThis.XMLSerializer().serializeToString(s2.rows[1].cells[0].node));

const s15 = eng.records.find(r => r.sectionNumber === 15);
console.log('\n=== EN Section 15 Row 2 XML ===');
console.log(new globalThis.XMLSerializer().serializeToString(s15.rows[2].cells[0].node));
console.log('\n=== EN Section 15 Row 3 XML ===');
console.log(new globalThis.XMLSerializer().serializeToString(s15.rows[3].cells[0].node));
