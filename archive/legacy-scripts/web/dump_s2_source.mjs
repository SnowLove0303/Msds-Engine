import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736';
const files = fs.readdirSync(dir);
console.log('Files in source dir:', files);

for (const fn of files) {
  if (!fn.endsWith('.docx') || fn.startsWith('~$')) continue;
  const fp = path.join(dir, fn);
  console.log('========================================');
  console.log('SOURCE FILE:', fn);
  console.log('========================================');
  const buf = fs.readFileSync(fp);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  for (let tIdx = 0; tIdx < tables.length; tIdx++) {
    const tbl = tables[tIdx];
    const text = tbl.textContent || '';
    if (text.includes('危险性') || text.includes('GHS')) {
      console.log(`--- Table ${tIdx} ---`);
      const trs = Array.from(tbl.getElementsByTagName('w:tr'));
      trs.forEach((tr, rIdx) => {
        const tcs = Array.from(tr.getElementsByTagName('w:tc'));
        const rowTexts = tcs.map(tc => {
          const ps = Array.from(tc.getElementsByTagName('w:p'));
          return ps.map(p => (p.textContent || '').trim()).filter(Boolean).join(' | ');
        });
        console.log(`  Row ${rIdx}: ${JSON.stringify(rowTexts)}`);
      });
    }
  }
}
