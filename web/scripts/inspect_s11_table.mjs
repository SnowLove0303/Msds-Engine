import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const zipData = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx');
const zip = await JSZip.loadAsync(zipData);
const docXmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(docXmlStr, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
console.log('Total tables:', tbls.length);

// Find Section 11 table
const s11Tbl = tbls[10]; // table index 10 is section 11
const rows = Array.from(s11Tbl.getElementsByTagName('w:tr'));
console.log('S11 rows:', rows.length);
for (let i = 0; i < Math.min(5, rows.length); i++) {
  const r = rows[i];
  const cells = Array.from(r.getElementsByTagName('w:tc'));
  const c0 = cells[0];
  const p = c0?.getElementsByTagName('w:p')[0];
  const pPr = p?.getElementsByTagName('w:pPr')[0];
  const ind = pPr?.getElementsByTagName('w:ind')[0];
  const indLeft = ind?.getAttribute('w:left');
  const indHanging = ind?.getAttribute('w:hanging');
  const indLeftChars = ind?.getAttribute('w:leftChars');
  const runs = Array.from(p?.getElementsByTagName('w:r') || []);
  const runTexts = runs.map(rn => {
    const hasTab = rn.getElementsByTagName('w:tab').length > 0;
    return (rn.textContent || '') + (hasTab ? '<TAB>' : '');
  });
  console.log(`Row ${i}: left=${indLeft}, hanging=${indHanging}, leftChars=${indLeftChars}, runs=`, runTexts);
}
