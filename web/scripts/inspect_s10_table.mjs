import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const zipData = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx');
const zip = await JSZip.loadAsync(zipData);
const docXmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(docXmlStr, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
// Section 10 is table index 9
const s10Tbl = tbls[9];
const rows = Array.from(s10Tbl.getElementsByTagName('w:tr'));
console.log('S10 rows:', rows.length);
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const cells = Array.from(r.getElementsByTagName('w:tc'));
  const c0 = cells[0];
  const p = c0?.getElementsByTagName('w:p')[0];
  const pPr = p?.getElementsByTagName('w:pPr')[0];
  const ind = pPr?.getElementsByTagName('w:ind')[0];
  const runs = Array.from(p?.getElementsByTagName('w:r') || []);
  const runTexts = runs.map(rn => {
    const hasTab = rn.getElementsByTagName('w:tab').length > 0;
    return (rn.textContent || '') + (hasTab ? '<TAB>' : '');
  });
  console.log(`Row ${i}: text="${c0?.textContent?.trim()}"`, 'left=', ind?.getAttribute('w:left'), 'hanging=', ind?.getAttribute('w:hanging'), 'runs=', runTexts);
}
