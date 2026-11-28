import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectDoc(docxPath) {
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
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    const rowInfo = [];
    for (let c = 0; c < cells.length; c++) {
      const tc = cells[c];
      const ps = tc.getElementsByTagName('w:p');
      const pArr = [];
      for (let p = 0; p < ps.length; p++) {
        const runs = ps[p].getElementsByTagName('w:r');
        let pTxt = '';
        const runDetails = [];
        for (let k = 0; k < runs.length; k++) {
          const t = runs[k].getElementsByTagName('w:t')[0]?.textContent || '';
          const b = runs[k].getElementsByTagName('w:b').length > 0;
          runDetails.push({ t, b });
          pTxt += t;
        }
        pArr.push({ pTxt, runDetails });
      }
      rowInfo.push(pArr);
    }
    console.log(`Row ${r + 1}:`);
    rowInfo.forEach((cell, cIdx) => {
      console.log(`  Cell ${cIdx}: ${JSON.stringify(cell.map(p => p.pTxt).join(' // '))}`);
    });
  }
}

console.log('=== SOURCE EP-1736 ===');
await inspectDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');

console.log('\n=== GENERATED CN EP-1736 ===');
await inspectDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');

console.log('\n=== GENERATED EN EP-1736 ===');
await inspectDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx');
