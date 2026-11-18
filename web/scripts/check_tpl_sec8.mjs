import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function parseTbl8(p) {
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl = doc.getElementsByTagName('w:tbl')[7];
  return Array.from(tbl.getElementsByTagName('w:tr')).map(tr => 
    Array.from(tr.getElementsByTagName('w:tc')).map(tc => (tc.textContent || '').trim().replace(/\s+/g, ' '))
  );
}

const cnTpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const enTpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

console.log('--- CN Template Section 8 ---');
(await parseTbl8(cnTpl)).forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));

console.log('\n--- EN Template Section 8 ---');
(await parseTbl8(enTpl)).forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));
