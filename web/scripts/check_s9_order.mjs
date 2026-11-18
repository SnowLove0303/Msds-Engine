import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const tplEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

async function checkS9Order() {
  const zip = await JSZip.loadAsync(fs.readFileSync(tplEn));
  const docXml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(docXml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  for (let t = 0; t < tbls.length; t++) {
    const tblTxt = tbls[t].textContent || '';
    if (tblTxt.includes('Physical and chemical properties')) {
      const trs = tbls[t].getElementsByTagName('w:tr');
      for (let r = 0; r < trs.length; r++) {
        const rowTxt = trs[r].textContent?.trim().replace(/\s+/g, ' ') || '';
        console.log(`Row ${r}: ${rowTxt}`);
      }
    }
  }
}

checkS9Order().catch(console.error);
