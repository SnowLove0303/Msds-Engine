import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function verifyOutput(filePath, name) {
  console.log(`\n================== AUDITING ${name} ==================`);
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tbls.length; i++) {
    const txt = tbls[i].textContent;
    if (txt.includes('固体含量') || txt.includes('Solid content')) {
      const rows = tbls[i].getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const rowTxt = rows[r].textContent.replace(/\s+/g, ' ').trim();
        if (rowTxt.includes('9.22') || rowTxt.includes('Solid') || rowTxt.includes('固体含量')) {
          const cells = rows[r].getElementsByTagName('w:tc');
          console.log(`\nRow ${r} (${rowTxt})`);
          
          // Audit Label Cell (Cell 0)
          console.log('--- Cell 0 (Label) ---');
          const p = cells[0].getElementsByTagName('w:p')[0];
          const pPr = p?.getElementsByTagName('w:pPr')[0];
          const ind = pPr?.getElementsByTagName('w:ind')[0];
          const tabs = pPr?.getElementsByTagName('w:tabs')[0];
          const spacing = pPr?.getElementsByTagName('w:spacing')[0];
          console.log(`  ind: left=${ind?.getAttribute('w:left')}, hanging=${ind?.getAttribute('w:hanging')}`);
          console.log(`  has tabs element: ${!!tabs}`);
          console.log(`  spacing: line=${spacing?.getAttribute('w:line')}`);
          
          const runs = Array.from(cells[0].getElementsByTagName('w:r'));
          runs.forEach((run, ri) => {
            const t = run.getElementsByTagName('w:t')[0]?.textContent || '';
            const sz = run.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
            const b = run.getElementsByTagName('w:b').length > 0;
            const rFonts = run.getElementsByTagName('w:rFonts')[0];
            const ascii = rFonts?.getAttribute('w:ascii');
            const hAnsi = rFonts?.getAttribute('w:hAnsi');
            const eastAsia = rFonts?.getAttribute('w:eastAsia');
            console.log(`  Run ${ri}: text="${t}", sz=${sz}, b=${b}, fonts: ascii=${ascii}, hAnsi=${hAnsi}, eastAsia=${eastAsia}`);
          });

          // Audit Value Cell (Cell 1)
          if (cells[1]) {
            console.log('--- Cell 1 (Value) ---');
            const runs1 = Array.from(cells[1].getElementsByTagName('w:r'));
            runs1.forEach((run, ri) => {
              const t = run.getElementsByTagName('w:t')[0]?.textContent || '';
              const sz = run.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
              const b = run.getElementsByTagName('w:b').length > 0;
              console.log(`  Run ${ri}: text="${t}", sz=${sz}, b=${b}`);
            });
          }
        }
      }
      break;
    }
  }
}

async function run() {
  await verifyOutput('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志.docx', '中文冠志产出');
  await verifyOutput('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_EN Guanzhi.docx', '英文冠志产出');
}
run();
