import fs from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';
const cnGuanzhiDocx = await loadDocx(fs.readFileSync(`${dir}/EC-1804 msds_CN 冠志.docx`));

console.log('=== 1. Checking Section 2 punctuation ===');
const cnS2 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 2);
const s2Text = cnS2.rows[1].cells[0].text;
console.log('S2 text snippet:', s2Text.slice(0, 100));
const s2HasFullPunct = /对水环境有慢性危害[，,]\s*类别\s*3\s*[（(]H412[）)]/.test(s2Text) && s2Text.includes('，') && s2Text.includes('（');
console.log('S2 has full punctuation:', s2HasFullPunct);
if (!s2HasFullPunct) throw new Error('Section 2 Chinese punctuation failed!');

console.log('=== 2. Checking Section 5.2 and 5.3 periods ===');
const cnS5 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 5);
console.log('5.2 val:', cnS5.rows[2].cells[1].text);
console.log('5.3 val:', cnS5.rows[3].cells[1].text);
if (!cnS5.rows[2].cells[1].text.endsWith('。')) throw new Error('5.2 lacks period!');
if (!cnS5.rows[3].cells[1].text.endsWith('。')) throw new Error('5.3 lacks period!');

console.log('=== 3. Checking Section 13 period ===');
const cnS13 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 13);
const s13Val = cnS13.rows[cnS13.rows.length - 1].cells[1].text;
console.log('S13 val snippet:', s13Val.slice(0, 80));
if (!s13Val.includes('“滴干”）。')) throw new Error('Section 13 lacks period after 滴干!');

console.log('=== 4. Checking Section 8 dash spacing ===');
const cnS8 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 8);
const r5 = cnS8.rows[5].cells[0].text;
const r6 = cnS8.rows[6].cells[0].text;
const r7 = cnS8.rows[7].cells[0].text;
console.log('R5:', r5);
console.log('R6:', r6);
console.log('R7:', r7);
if (!r5.includes('– FKM') || !r6.includes('– IIR') || !r7.includes('– NBR')) {
  throw new Error('Section 8 glove dashes not unified!');
}

console.log('\n🌟 ALL 4 REFINEMENT ASSERTIONS PASS 100%!');
