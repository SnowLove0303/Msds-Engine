import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpAllSectionsFormat(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    const rows = tbl.getElementsByTagName('w:tr');
    console.log(`\n=== Table ${i+1} (${rows[0]?.textContent?.trim()?.slice(0, 30)}) ===`);
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      if (cells.length < 2) continue;
      const valCell = cells[cells.length - 1];
      const runs = valCell.getElementsByTagName('w:r');
      for (let k = 0; k < runs.length; k++) {
        const rNode = runs[k];
        const rPr = rNode.getElementsByTagName('w:rPr')[0];
        const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
        const b = rPr?.getElementsByTagName('w:b').length > 0;
        const font = rPr?.getElementsByTagName('w:rFonts')[0]?.getAttribute('w:ascii') || rPr?.getElementsByTagName('w:rFonts')[0]?.getAttribute('w:eastAsia') || 'default';
        const t = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
        if (t.trim()) {
          console.log(`  Row ${r+1}: "${cells[0].textContent.trim().slice(0, 15)}" -> Val: "${t.slice(0, 25)}" | sz=${sz} (${sz/2}pt) | bold=${b} | font=${font}`);
        }
      }
    }
  }
}

await dumpAllSectionsFormat('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');
