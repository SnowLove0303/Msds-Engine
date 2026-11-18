import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkDocx() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_EN Guanzhi.docx';
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));

  tbls.forEach((tbl, tIdx) => {
    const trs = Array.from(tbl.getElementsByTagName('w:tr'));
    trs.forEach((tr, rIdx) => {
      const text = tr.textContent;
      if (/[\u4e00-\u9fa5]/.test(text)) {
        console.log(`Table ${tIdx + 1}, Row ${rIdx + 1} has Chinese:`);
        const tcs = Array.from(tr.getElementsByTagName('w:tc'));
        tcs.forEach((tc, cIdx) => {
          const tcText = tc.textContent.trim();
          if (/[\u4e00-\u9fa5]/.test(tcText)) {
            console.log(`  Col ${cIdx + 1}: ${tcText}`);
          }
        });
      }
    });
  });
}

checkDocx().catch(console.error);
