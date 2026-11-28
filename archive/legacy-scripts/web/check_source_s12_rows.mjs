import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkSourceS12(filePath, name) {
  console.log(`\n================== ${name} ==================`);
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tbls.length; i++) {
    const txt = tbls[i].textContent;
    if (txt.includes('生态') || txt.includes('Ecological') || txt.includes('12.')) {
      const rows = tbls[i].getElementsByTagName('w:tr');
      console.log(`Found Section 12 Table ${i}, total rows: ${rows.length}`);
      for (let r = 0; r < rows.length; r++) {
        const rowText = rows[r].textContent.replace(/\s+/g, ' ').trim();
        const cells = rows[r].getElementsByTagName('w:tc');
        console.log(`  Row ${r} (cells=${cells.length}): "${rowText}"`);
        if (r < 5) {
          for (let c = 0; c < cells.length; c++) {
            const pTexts = Array.from(cells[c].getElementsByTagName('w:p')).map(p => p.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
            console.log(`    Cell ${c} paragraphs:`, pTexts);
          }
        }
      }
      break;
    }
  }
}

async function run() {
  await checkSourceS12('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 国彩_源文件留存.docx', 'PU-202A 国彩源文件留存');
  await checkSourceS12('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志_源文件留存.docx', 'PU-202A 冠志源文件留存');
}
run();
