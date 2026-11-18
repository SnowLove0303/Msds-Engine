import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkEnTable8() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl8 = doc.getElementsByTagName('w:tbl')[7];
  const rows = tbl8.getElementsByTagName('w:tr');
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    for (let c = 0; c < cells.length; c++) {
      const pElem = cells[c].getElementsByTagName('w:p')[0];
      const ind = pElem?.getElementsByTagName('w:ind')[0]?.toString() || 'no-ind';
      const runs = cells[c].getElementsByTagName('w:r');
      const bolds = [];
      for (let rn = 0; rn < runs.length; rn++) {
        const b = runs[rn].getElementsByTagName('w:b').length > 0;
        bolds.push(b);
      }
      console.log(`Row ${r} Cell ${c}: text="${cells[c].textContent.trim()}", ind=${ind}, bolds=${bolds.join(',')}`);
    }
  }
}
checkEnTable8().catch(console.error);
