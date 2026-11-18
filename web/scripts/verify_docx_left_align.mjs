import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const buf = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608\\PU-608 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  console.log('Total tables:', tables.length);

  // 1. Check Section 2 (Table index 1)
  const tbl2 = tables[1];
  const rows2 = Array.from(tbl2.getElementsByTagNameNS(W_NS, 'tr'));
  console.log('\n--- Section 2.5 Check ---');
  const r6 = rows2[6];
  if (r6) {
    const c1 = r6.getElementsByTagNameNS(W_NS, 'tc')[1];
    const ps = Array.from(c1.getElementsByTagNameNS(W_NS, 'p'));
    console.log('Section 2.5 paragraph count:', ps.length);
    ps.forEach((p, idx) => {
      const text = (p.textContent || '').trim();
      const jc = p.getElementsByTagNameNS(W_NS, 'jc')[0]?.getAttributeNS(W_NS, 'val');
      const ind = p.getElementsByTagNameNS(W_NS, 'ind')[0];
      const hasInd = !!ind;
      console.log(`  P${idx}: jc=${jc}, hasInd=${hasInd}, text='${text.slice(0, 45)}'`);
    });
  }

  // 2. Check Section 13 (Table index 12)
  const tbl13 = tables[12];
  const rows13 = Array.from(tbl13.getElementsByTagNameNS(W_NS, 'tr'));
  console.log('\n--- Section 13 Check ---');
  console.log('Section 13 total rows:', rows13.length);
  rows13.forEach((row, idx) => {
    const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
    const firstP = row.getElementsByTagNameNS(W_NS, 'p')[0];
    const jc = firstP?.getElementsByTagNameNS(W_NS, 'jc')[0]?.getAttributeNS(W_NS, 'val');
    console.log(`  Row ${idx} cells: ${cells.length}, jc=${jc}, text: '${(row.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 75)}'`);
  });

  // 3. Scan all value cells in all tables for any 'both' or 'distribute'
  console.log('\n--- Value Cells Justification Scan ---');
  let nonLeftCount = 0;
  let totalValPs = 0;
  tables.forEach((tbl, tIdx) => {
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    rows.forEach((row, rIdx) => {
      if (rIdx === 0) return; // header
      const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length >= 2) {
        for (let i = 1; i < cells.length; i++) {
          const ps = Array.from(cells[i].getElementsByTagNameNS(W_NS, 'p'));
          ps.forEach(p => {
            totalValPs++;
            const jc = p.getElementsByTagNameNS(W_NS, 'jc')[0]?.getAttributeNS(W_NS, 'val');
            if (jc !== 'left') {
              console.log(`  [NON-LEFT] Table ${tIdx+1} Row ${rIdx} Cell ${i} has jc='${jc}': '${p.textContent.slice(0, 30)}'`);
              nonLeftCount++;
            }
          });
        }
      }
    });
  });
  console.log(`Total Value Paragraphs: ${totalValPs}, Non-left count: ${nonLeftCount}`);
}

main().catch(console.error);
