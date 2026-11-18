import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpDocxTables(docxPath) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const entry = zip.file('word/document.xml');
  if (!entry) return null;
  const xml = await entry.async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  const result = [];
  for (let t = 0; t < tables.length; t++) {
    const tbl = tables[t];
    const rows = tbl.getElementsByTagName('w:tr');
    const tableData = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = row.getElementsByTagName('w:tc');
      const rowData = [];
      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        const paras = cell.getElementsByTagName('w:p');
        const textParts = [];
        for (let p = 0; p < paras.length; p++) {
          const runs = paras[p].getElementsByTagName('w:r');
          let pText = '';
          for (let rn = 0; rn < runs.length; rn++) {
            const ts = runs[rn].getElementsByTagName('w:t');
            for (let i = 0; i < ts.length; i++) {
              pText += ts[i].textContent || '';
            }
          }
          if (pText.trim()) textParts.push(pText.trim());
        }
        rowData.push(textParts.join(' \n '));
      }
      tableData.push(rowData);
    }
    result.push(tableData);
  }
  return result;
}

async function main() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1)_源文件留存.docx';
  const cnOutPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const enOutPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';

  console.log('=== SOURCE DOCUMENT ===');
  const srcTables = await dumpDocxTables(srcPath);
  srcTables.forEach((tbl, idx) => {
    const header = tbl[0] ? tbl[0].join(' | ') : '';
    if (header.includes('危险') || header.includes('2') || header.includes('接触') || header.includes('8') || header.includes('防护')) {
      console.log(`\n--- Source Table ${idx + 1}: ${header} ---`);
      tbl.forEach((row, rIdx) => console.log(`  Row ${rIdx}: ${row.map(c => `[${c}]`).join(' | ')}`));
    }
  });

  console.log('\n=== CN DELIVERABLE (冠志) ===');
  const cnTables = await dumpDocxTables(cnOutPath);
  cnTables.forEach((tbl, idx) => {
    const header = tbl[0] ? tbl[0].join(' | ') : '';
    if (header.includes('危险') || header.includes('2.') || header.includes('接触') || header.includes('8.') || header.includes('防护')) {
      console.log(`\n--- CN Deliverable Table ${idx + 1}: ${header} ---`);
      tbl.forEach((row, rIdx) => console.log(`  Row ${rIdx}: ${row.map(c => `[${c}]`).join(' | ')}`));
    }
  });

  console.log('\n=== EN DELIVERABLE (Guanzhi) ===');
  const enTables = await dumpDocxTables(enOutPath);
  enTables.forEach((tbl, idx) => {
    const header = tbl[0] ? tbl[0].join(' | ') : '';
    if (header.includes('Hazard') || header.includes('2.') || header.includes('Exposure') || header.includes('8.') || header.includes('Protection')) {
      console.log(`\n--- EN Deliverable Table ${idx + 1}: ${header} ---`);
      tbl.forEach((row, rIdx) => console.log(`  Row ${rIdx}: ${row.map(c => `[${c}]`).join(' | ')}`));
    }
  });
}

main().catch(err => console.error(err));
