import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const buf = fs.readFileSync(tplPath);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
for (let t = 0; t < tbls.length; t++) {
  const txt = tbls[t].textContent || '';
  if (txt.includes('运输信息') || txt.includes('14.')) {
    console.log(`=== Template Table ${t} (Section 14) ===`);
    const trs = Array.from(tbls[t].getElementsByTagName('w:tr'));
    for (let r = 0; r < trs.length; r++) {
      const tcs = Array.from(trs[r].getElementsByTagName('w:tc'));
      console.log(`Row ${r} (${tcs.length} cols):`, tcs.map(c => (c.textContent || '').trim().replace(/\s+/g, ' ')));
    }
  }
}
