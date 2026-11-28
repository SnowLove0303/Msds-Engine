import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectAllTables(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    const rows = tbl.getElementsByTagName('w:tr');
    console.log(`\n================ Table ${i + 1} (Rows: ${rows.length}) ================`);
    for (let r = 0; r < Math.min(rows.length, 6); r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      const cTexts = [];
      for (let c = 0; c < cells.length; c++) {
        const runs = cells[c].getElementsByTagName('w:t');
        let t = '';
        for (let k = 0; k < runs.length; k++) t += runs[k].textContent;
        cTexts.push(t);
      }
      console.log(`  Row ${r+1}: ${cTexts.map(t => JSON.stringify(t)).join(' | ')}`);
    }
    if (rows.length > 6) {
      console.log(`  ... [${rows.length - 6} more rows]`);
      const lastRow = rows[rows.length - 1];
      const cells = lastRow.getElementsByTagName('w:tc');
      const cTexts = [];
      for (let c = 0; c < cells.length; c++) {
        const runs = cells[c].getElementsByTagName('w:t');
        let t = '';
        for (let k = 0; k < runs.length; k++) t += runs[k].textContent;
        cTexts.push(t);
      }
      console.log(`  Row ${rows.length}: ${cTexts.map(t => JSON.stringify(t)).join(' | ')}`);
    }
  }
}

inspectAllTables('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');
