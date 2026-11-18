import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkRow2(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  let sec8 = null;
  for (let i = 0; i < tables.length; i++) {
    if (tables[i].textContent.includes('接触控制') || tables[i].textContent.includes('Exposure control')) {
      sec8 = tables[i];
      break;
    }
  }
  const rows = sec8.getElementsByTagName('w:tr');
  const r2 = rows[1]; // row 2
  const r2Cells = r2.getElementsByTagName('w:tc');
  console.log(`Row 2 cells count: ${r2Cells.length}`);
  for (let i = 0; i < r2Cells.length; i++) {
    console.log(`Cell ${i}:`, r2Cells[i].textContent);
    console.log(`Cell ${i} gridSpan:`, r2Cells[i].getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val'));
  }
}

checkRow2('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');
