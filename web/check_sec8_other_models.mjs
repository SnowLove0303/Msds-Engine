import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkSec8(docxPath) {
  if (!fs.existsSync(docxPath)) return `Not found: ${docxPath}`;
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
  if (!sec8) return 'Sec 8 not found';
  const rows = sec8.getElementsByTagName('w:tr');
  const res = [];
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    const cTexts = [];
    for (let c = 0; c < cells.length; c++) {
      const runs = cells[c].getElementsByTagName('w:t');
      let t = '';
      for (let k = 0; k < runs.length; k++) t += runs[k].textContent;
      cTexts.push(t);
    }
    res.push(`  Row ${r+1}: ${cTexts.map(t => JSON.stringify(t)).join(' | ')}`);
  }
  return res.join('\n');
}

console.log('=== EC-1804 Target CN ===');
console.log(await checkSec8('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));

console.log('\n=== BL-8126 Target CN ===');
console.log(await checkSec8('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx'));
