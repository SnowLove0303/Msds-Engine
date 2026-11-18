import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function compareSec2andSec8() {
  const srcZip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1)_源文件留存.docx'));
  const delZip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));
  const enZip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx'));

  async function getDoc(zip) {
    const xml = await zip.file('word/document.xml').async('string');
    return new DOMParser().parseFromString(xml, 'text/xml');
  }

  const sDoc = await getDoc(srcZip);
  const dDoc = await getDoc(delZip);
  const eDoc = await getDoc(enZip);

  console.log('================ SECTION 8 DETAIL ================');
  const sTbl8 = sDoc.getElementsByTagName('w:tbl')[7];
  const dTbl8 = dDoc.getElementsByTagName('w:tbl')[7];
  const eTbl8 = eDoc.getElementsByTagName('w:tbl')[7];

  console.log('--- SRC Table 8 rows (' + sTbl8.getElementsByTagName('w:tr').length + ') ---');
  const sRows = sTbl8.getElementsByTagName('w:tr');
  for (let r = 0; r < sRows.length; r++) {
    const cells = sRows[r].getElementsByTagName('w:tc');
    const cTexts = [];
    for (let c = 0; c < cells.length; c++) {
      cTexts.push(`C${c}: [${cells[c].textContent?.trim()}]`);
    }
    console.log(`Row ${r}: ${cTexts.join(' | ')}`);
  }

  console.log('\n--- DEL Table 8 rows (' + dTbl8.getElementsByTagName('w:tr').length + ') ---');
  const dRows = dTbl8.getElementsByTagName('w:tr');
  for (let r = 0; r < dRows.length; r++) {
    const cells = dRows[r].getElementsByTagName('w:tc');
    const cTexts = [];
    for (let c = 0; c < cells.length; c++) {
      cTexts.push(`C${c}: [${cells[c].textContent?.trim()}]`);
    }
    console.log(`Row ${r}: ${cTexts.join(' | ')}`);
  }

  console.log('\n--- EN Table 8 rows (' + eTbl8.getElementsByTagName('w:tr').length + ') ---');
  const eRows = eTbl8.getElementsByTagName('w:tr');
  for (let r = 0; r < eRows.length; r++) {
    const cells = eRows[r].getElementsByTagName('w:tc');
    const cTexts = [];
    for (let c = 0; c < cells.length; c++) {
      cTexts.push(`C${c}: [${cells[c].textContent?.trim()}]`);
    }
    console.log(`Row ${r}: ${cTexts.join(' | ')}`);
  }
}

compareSec2andSec8().catch(console.error);
