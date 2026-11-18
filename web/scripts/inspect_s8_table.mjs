import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const zipData = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx');
const zip = await JSZip.loadAsync(zipData);
const docXmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(docXmlStr, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
// Table 7 is Section 8 (0-indexed: tbl 0=S1, 1=S2, 2=S3, 3=S4, 4=S5, 5=S6, 6=S7, 7=S8)
const s8Tbl = tbls[7];
const rows = Array.from(s8Tbl.getElementsByTagName('w:tr'));
console.log('S8 rows:', rows.length);
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const cells = Array.from(r.getElementsByTagName('w:tc'));
  const c0 = cells[0];
  const ps = Array.from(c0?.getElementsByTagName('w:p') || []);
  const p0 = ps[0];
  const pPr = p0?.getElementsByTagName('w:pPr')[0];
  const ind = pPr?.getElementsByTagName('w:ind')[0];
  const indAttrs = {};
  if (ind) {
    for (let a = 0; a < ind.attributes.length; a++) {
      const attr = ind.attributes[a];
      indAttrs[attr.name] = attr.value;
    }
  }
  const runs = Array.from(p0?.getElementsByTagName('w:r') || []);
  const runTexts = runs.map(rn => {
    const hasTab = rn.getElementsByTagName('w:tab').length > 0;
    return (rn.textContent || '') + (hasTab ? '<TAB>' : '');
  });
  console.log(`Row ${i}: text="${c0?.textContent?.trim()}"`, 'ind=', indAttrs, 'runs=', runTexts);
}
