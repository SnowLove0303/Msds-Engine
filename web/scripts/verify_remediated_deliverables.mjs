import fs from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

const cnGuanzhiDocx = await loadDocx(fs.readFileSync(`${dir}/EC-1804 msds_CN 冠志.docx`));
const enGuanzhiDocx = await loadDocx(fs.readFileSync(`${dir}/EC-1804 msds_EN Guanzhi.docx`));
const cnGuocaiDocx = await loadDocx(fs.readFileSync(`${dir}/EC-1804 msds_CN 国彩.docx`));
const enGuocaiDocx = await loadDocx(fs.readFileSync(`${dir}/EC-1804 msds_EN Guocai.docx`));

console.log('=== VERIFYING DEFECT 1: English Header Colon ===');
for (const [k, v] of Object.entries(enGuanzhiDocx.supportingXml || {})) {
  if (k.includes('header')) {
    const doc = new DOMParser().parseFromString(v, 'text/xml');
    const ps = Array.from(doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p'));
    ps.forEach(p => {
      const text = p.textContent;
      if (text.includes('Version')) {
        console.log(`  ${k}: "${text}" -> Has full-width colon: ${text.includes('：')}, Has half-width colon: ${text.includes(': ')}`);
        if (text.includes('：')) throw new Error(`English header has full-width colon: ${text}`);
      }
    });
  }
}

console.log('=== VERIFYING DEFECT 2: English Section 1 Title Redundant Numbering ===');
const enS1 = enGuanzhiDocx.records.find(r => r.sectionNumber === 1);
const s1Title = enS1.rows[0].cells[0].text;
console.log(`  English Section 1 Title: "${s1Title}"`);
if (s1Title !== '1. Identification') {
  throw new Error(`English Section 1 title is not "1. Identification": got "${s1Title}"`);
}

console.log('=== VERIFYING DEFECT 3: Chinese Section 3 Row 2 gridSpan=3 ===');
const cnS3 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 3);
const r2 = cnS3.rows[2];
console.log(`  Chinese Section 3 Row 2 cells count: ${r2.cells.length}`);
console.log(`  Chinese Section 3 Row 2 text: ${JSON.stringify(r2.cells.map(c => c.text))}`);
if (r2.cells.length !== 1) {
  throw new Error(`Chinese Section 3 Row 2 was not merged to 1 cell! Cells: ${r2.cells.length}`);
}
const tcPr = r2.cells[0].node.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tcPr')[0];
const gridSpan = tcPr?.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'gridSpan')[0]?.getAttribute('w:val');
console.log(`  gridSpan: ${gridSpan}`);
if (gridSpan !== '3') {
  throw new Error(`Chinese Section 3 Row 2 gridSpan is not 3: got ${gridSpan}`);
}

console.log('=== VERIFYING DEFECT 4: English Section 5.4 Label Conjunction "and" ===');
const enS5 = enGuanzhiDocx.records.find(r => r.sectionNumber === 5);
const s5r4Label = enS5.rows[4].cells[0].text;
console.log(`  English Section 5 Row 4 label: "${s5r4Label}"`);
if (!s5r4Label.includes('precautions and protective equipment')) {
  throw new Error(`English Section 5.4 label missing "and": got "${s5r4Label}"`);
}

console.log('=== VERIFYING DEFECT 5: Chinese Section 15 Modernity Evolution ===');
const cnS15 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 15);
console.log('  Chinese Section 15 rows:');
cnS15.rows.forEach((r, idx) => console.log(`    R${idx}: "${r.cells[0]?.text}"`));
const has344 = cnS15.rows.some(r => /344/i.test(r.cells[0]?.text || ''));
const has591 = cnS15.rows.some(r => /591/i.test(r.cells[0]?.text || ''));
const has20576 = cnS15.rows.some(r => /20576/i.test(r.cells[0]?.text || ''));
const has30000 = cnS15.rows.some(r => /30000/i.test(r.cells[0]?.text || ''));
console.log(`  has344: ${has344}, has591: ${has591}, has20576: ${has20576}, has30000: ${has30000}`);
if (has344 || !has591) throw new Error('Chinese Section 15 still has Decree 344 or missing Decree 591!');
if (has20576 || !has30000) throw new Error('Chinese Section 15 still has GB 20576 or missing GB 30000!');

console.log('=== VERIFYING DEFECT 6: Chinese Section 8.2 Comma Punctuation ===');
const cnS8 = cnGuanzhiDocx.records.find(r => r.sectionNumber === 8);
const r82Val = cnS8.rows[cnS8.rows.length - 1].cells[1]?.text || '';
console.log(`  Chinese Section 8.2 Value: "${r82Val}"`);
if (r82Val.includes('2006/121/EG,')) {
  throw new Error(`Chinese Section 8.2 still contains half-width comma: "${r82Val}"`);
}
if (!r82Val.includes('2006/121/EG，')) {
  throw new Error(`Chinese Section 8.2 does not contain full-width comma: "${r82Val}"`);
}

console.log('\n🌟 ALL 6 AUDIT ASSERTIONS PASS 100%!');
