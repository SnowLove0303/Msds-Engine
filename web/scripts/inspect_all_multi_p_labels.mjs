import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function check() {
  const buf = fs.readFileSync('public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tables = doc.getElementsByTagName('w:tbl');
  for (let i = 0; i < tables.length; i++) {
    const rows = tables[i].getElementsByTagName('w:tr');
    for (let r = 0; r < rows.length; r++) {
      const c0 = rows[r].getElementsByTagName('w:tc')[0];
      if (c0) {
        const ps = c0.getElementsByTagName('w:p');
        if (ps.length > 1) {
          console.log(`Table ${i}, Row ${r}: ${ps.length} paragraphs`);
          for (let pIdx = 0; pIdx < ps.length; pIdx++) {
            console.log(`   p[${pIdx}]: [${ps[pIdx].textContent.trim()}]`);
          }
        }
      }
    }
  }
}
check();
