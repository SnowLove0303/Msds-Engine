import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkEn(filePath) {
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  for (let i = 0; i < tbls.length; i++) {
    const txt = tbls[i].textContent.replace(/\s+/g, ' ');
    if (txt.includes('Physical and chemical properties') || txt.includes('Appearance')) {
      console.log(`Table ${i}: ${txt.slice(0, 100)}`);
      const trs = tbls[i].getElementsByTagName('w:tr');
      for (let r = 0; r < trs.length; r++) {
        const trTxt = trs[r].textContent.replace(/\s+/g, ' ').trim();
        if (trTxt.includes('9.1') || trTxt.includes('9.22')) {
          console.log(`  Row ${r}: ${trTxt}`);
          const tcs = trs[r].getElementsByTagName('w:tc');
          console.log('    Cell 0 XML:', tcs[0]?.toString());
        }
      }
    }
  }
}
checkEn('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
