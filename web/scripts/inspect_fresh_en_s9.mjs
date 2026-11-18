import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function check() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tables = doc.getElementsByTagName('w:tbl');
  const s9 = tables[8];
  const rows = s9.getElementsByTagName('w:tr');
  console.log('Total rows in freshly generated Section 9:', rows.length);
  for (let r = 0; r < rows.length; r++) {
    const c0 = rows[r].getElementsByTagName('w:tc')[0]?.textContent?.trim();
    const c1 = rows[r].getElementsByTagName('w:tc')[1]?.textContent?.trim();
    console.log(`Row ${r}: [${c0}] -> [${c1}]`);
  }
}
check();
