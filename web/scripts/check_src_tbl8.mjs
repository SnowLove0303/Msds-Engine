import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkSrcTable8() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1)_源文件留存.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl8 = doc.getElementsByTagName('w:tbl')[7];
  console.log('SRC Table 8 Rows:', tbl8.getElementsByTagName('w:tr').length);
  const rows = tbl8.getElementsByTagName('w:tr');
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    console.log(`Row ${r} (cells: ${cells.length}):`);
    for (let c = 0; c < cells.length; c++) {
      console.log(`  C${c}: [${cells[c].textContent.trim().replace(/\r?\n/g, ' ')}]`);
    }
  }
}
checkSrcTable8().catch(console.error);
