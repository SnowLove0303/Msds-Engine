import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkAllRows(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  let sec8 = tables[7];
  const rows = sec8.getElementsByTagName('w:tr');
  console.log(`Table 8 Rows count: ${rows.length}`);
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    const cInfo = [];
    for (let c = 0; c < cells.length; c++) {
      const tc = cells[c];
      const span = tc.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val') || '1';
      const runs = tc.getElementsByTagName('w:t');
      let txt = '';
      for (let k = 0; k < runs.length; k++) txt += runs[k].textContent;
      cInfo.push(`[Cell ${c} (span=${span})]: "${txt}"`);
    }
    console.log(`Row ${r + 1} (${cells.length} cells): ${cInfo.join(' | ')}`);
  }
}

checkAllRows('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');
