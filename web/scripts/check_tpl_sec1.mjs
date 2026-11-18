import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const buf = fs.readFileSync(tplPath);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const tbl = doc.getElementsByTagName('w:tbl')[0];
const rows = Array.from(tbl.getElementsByTagName('w:tr'));
console.log('--- Template Section 1 Rows ---');
rows.forEach((r, i) => {
  const cells = Array.from(r.getElementsByTagName('w:tc')).map(c => (c.textContent || '').trim().replace(/\s+/g, ' '));
  console.log(`R${i}:`, cells.join(' | '));
});
