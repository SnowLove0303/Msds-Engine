import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608';
const buf = fs.readFileSync(path.join(targetDir, 'PU-608 msds_EN Guanzhi.docx'));
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const tbl = doc.getElementsByTagName('w:tbl')[2];
const rows = Array.from(tbl.getElementsByTagName('w:tr'));
console.log('--- EN Section 3 Rows ---');
rows.forEach((r, i) => {
  const cells = Array.from(r.getElementsByTagName('w:tc')).map(c => (c.textContent || '').trim().replace(/\s+/g, ' '));
  console.log(`R${i}:`, cells.join(' | '));
});
