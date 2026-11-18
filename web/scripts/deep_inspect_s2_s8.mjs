import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function deepInspect(docxPath) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  console.log(`\n======================================================`);
  console.log(`FILE: ${docxPath}`);
  console.log(`======================================================`);

  for (let t = 0; t < tables.length; t++) {
    const tbl = tables[t];
    const text = tbl.textContent || '';
    if (text.includes('危险') || text.includes('Hazards')) {
      console.log(`\n--- SECTION 2 TABLE XML SNIPPETS ---`);
      const rows = tbl.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        console.log(`Row ${r}:`);
        const ps = rows[r].getElementsByTagName('w:p');
        for (let p = 0; p < ps.length; p++) {
          console.log(`  P${p}: ${ps[p].toString()}`);
        }
      }
    }
    if (text.includes('接触控制') || text.includes('Exposure control')) {
      console.log(`\n--- SECTION 8 TABLE XML SNIPPETS ---`);
      const rows = tbl.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        console.log(`Row ${r}:`);
        const cells = rows[r].getElementsByTagName('w:tc');
        for (let c = 0; c < cells.length; c++) {
          console.log(`  Cell ${c} tcPr: ${cells[c].getElementsByTagName('w:tcPr')[0]?.toString()}`);
          const ps = cells[c].getElementsByTagName('w:p');
          for (let p = 0; p < ps.length; p++) {
            console.log(`    P${p}: ${ps[p].toString()}`);
          }
        }
      }
    }
  }
}

async function main() {
  const cnGz = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const enGz = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';
  await deepInspect(cnGz);
  await deepInspect(enGz);
}

main().catch(err => console.error(err));
