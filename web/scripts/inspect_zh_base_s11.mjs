import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const buffer = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/templates/zh_base.docx');
const zip = await JSZip.loadAsync(buffer);
const xmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
const tbls = doc.getElementsByTagName('w:tbl');
const s11 = tbls[10];
const trs = Array.from(s11.getElementsByTagName('w:tr'));

console.log('=== zh_base.docx Section 11 行结构 ===');
trs.forEach((tr, i) => {
  const tcs = Array.from(tr.getElementsByTagName('w:tc'));
  console.log(`Row ${i} (tcs=${tcs.length}): ${tr.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)}`);
});
