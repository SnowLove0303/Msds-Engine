import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkFonts(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    const text = tbl.textContent;
    let secName = `Table ${i+1}`;
    if (text.includes('物料及供应商标识')) secName = 'Section 1';
    else if (text.includes('危险性概述')) secName = 'Section 2';
    else if (text.includes('急救措施')) secName = 'Section 4';
    else if (text.includes('消防措施')) secName = 'Section 5';
    else if (text.includes('接触控制') || text.includes('Exposure control')) secName = 'Section 8';
    else if (text.includes('物理和化学特性')) secName = 'Section 9';
    else if (text.includes('稳定性和反应性')) secName = 'Section 10';
    else continue;

    console.log(`\n================ ${secName} ================`);
    const rows = tbl.getElementsByTagName('w:tr');
    for (let r = 0; r < Math.min(rows.length, 7); r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      if (cells.length < 2) continue; // skip header or single-cell
      const valCell = cells[cells.length - 1]; // value cell
      const runs = valCell.getElementsByTagName('w:r');
      const runInfo = [];
      for (let k = 0; k < runs.length; k++) {
        const rNode = runs[k];
        const rPr = rNode.getElementsByTagName('w:rPr')[0];
        const rFonts = rPr?.getElementsByTagName('w:rFonts')[0];
        const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
        const b = rPr?.getElementsByTagName('w:b').length > 0;
        const ascii = rFonts?.getAttribute('w:ascii');
        const eastAsia = rFonts?.getAttribute('w:eastAsia');
        const hAnsi = rFonts?.getAttribute('w:hAnsi');
        const t = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
        runInfo.push(`[${JSON.stringify(t)}: sz=${sz}, b=${b}, font=${ascii}/${eastAsia}]`);
      }
      const labelText = cells[0].textContent.trim();
      console.log(`  Row ${r+1} Label: ${JSON.stringify(labelText)}`);
      console.log(`         Value Runs: ${runInfo.join(' ')}`);
    }
  }
}

console.log('=== CHECKING EP-1736 CN DELIVERABLE FONTS ===');
await checkFonts('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');
