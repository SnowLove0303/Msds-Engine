import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

for (const f of ['PU-202B msds_CN 冠志.docx', 'PU-202B msds_EN Guanzhi.docx']) {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202B/' + f;
  const buffer = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buffer);
  const xmlStr = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s11 = tbls[10];
  const trs = Array.from(s11.getElementsByTagName('w:tr'));
  console.log(`\n=== [${f}] Row 11 ===`);
  const tcs11 = Array.from(trs[11].getElementsByTagName('w:tc'));
  tcs11.forEach((tc, i) => console.log(`tc[${i}] w=${tc.getElementsByTagName('w:tcW')[0]?.getAttribute('w:val')} span=${tc.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val')} text="${tc.textContent.trim().replace(/\s+/g, ' ')}"`));
  console.log(`\n=== [${f}] Row 12 ===`);
  const tcs12 = Array.from(trs[12].getElementsByTagName('w:tc'));
  tcs12.forEach((tc, i) => console.log(`tc[${i}] w=${tc.getElementsByTagName('w:tcW')[0]?.getAttribute('w:val')} span=${tc.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val')} text="${tc.textContent.trim().replace(/\s+/g, ' ')}"`));
}
