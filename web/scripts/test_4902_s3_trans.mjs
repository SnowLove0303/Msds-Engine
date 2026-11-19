import { loadDocx } from '../src/docx-engine.js';
import { extractSection3ExemptionNotes } from '../src/smart-matching.js';
import { translateSection3Notes } from '../src/context-governor.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx');
const eng = await loadDocx(buf);
const s3 = eng.records.find(r => r.sectionNumber === 3);

const extracted = extractSection3ExemptionNotes(s3);
console.log('=== REAL EXTRACTED NOTES (CN) ===');
console.log(extracted);

console.log('\n=== REAL TRANSLATED NOTES (EN) ===');
const en = translateSection3Notes(extracted);
console.log(en);

const ch = en.match(/[\u4e00-\u9fa5]/g) || [];
console.log(`\nChinese characters count in real translated S3: ${ch.length}`);
if (ch.length > 0) {
  console.log('Untranslated chars:', ch.join(' '));
}
