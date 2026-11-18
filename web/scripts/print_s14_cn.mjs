import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function printTable14Cn() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
  const s14 = tbls[13]; // Table 14
  const trs = Array.from(s14.getElementsByTagName('w:tr'));
  trs.forEach((tr, rIdx) => {
    const tcs = Array.from(tr.getElementsByTagName('w:tc'));
    console.log(`Row ${rIdx + 1}:`);
    tcs.forEach((tc, cIdx) => {
      console.log(`  Col ${cIdx + 1}: ${tc.textContent.trim()}`);
    });
  });
}

printTable14Cn().catch(console.error);
