import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608';
const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';

async function parseTable1(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl = doc.getElementsByTagName('w:tbl')[0];
  const rows = Array.from(tbl.getElementsByTagName('w:tr'));
  return rows.map((tr, rIdx) => {
    const cells = Array.from(tr.getElementsByTagName('w:tc'));
    return cells.map(c => (c.textContent || '').trim().replace(/\s+/g, ' '));
  });
}

console.log('--- Source Section 1 ---');
(await parseTable1(srcPath)).forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));

console.log('--- Output Guanzhi Section 1 ---');
(await parseTable1(path.join(targetDir, 'PU-608 msds_CN 冠志.docx'))).forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));

console.log('--- Output Guocai Section 1 ---');
(await parseTable1(path.join(targetDir, 'PU-608 msds_CN 国彩.docx'))).forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));
