import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkRowIndents() {
  const zip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl8 = doc.getElementsByTagName('w:tbl')[7];
  const rows = tbl8.getElementsByTagName('w:tr');
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    for (let c = 0; c < cells.length; c++) {
      const p = cells[c].getElementsByTagName('w:p')[0];
      const ind = p?.getElementsByTagName('w:ind')[0];
      const indStr = ind ? ind.toString() : 'no-ind';
      console.log(`Row ${r} Cell ${c}: text="${cells[c].textContent.trim()}", ind=${indStr}`);
    }
  }
}
checkRowIndents().catch(console.error);
