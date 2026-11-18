import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608';
const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';

async function parseTable(filePath, secIndex) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl = doc.getElementsByTagName('w:tbl')[secIndex];
  const rows = Array.from(tbl.getElementsByTagName('w:tr'));
  return rows.map((tr, rIdx) => {
    const cells = Array.from(tr.getElementsByTagName('w:tc'));
    return cells.map(c => (c.textContent || '').trim().replace(/\s+/g, ' '));
  });
}

for (const sec of [12, 13, 14, 15]) {
  const sSrc = await parseTable(srcPath, sec);
  const sCn = await parseTable(path.join(targetDir, 'PU-608 msds_CN 冠志.docx'), sec);
  const sEn = await parseTable(path.join(targetDir, 'PU-608 msds_EN Guanzhi.docx'), sec);
  console.log(`\n=== SECTION ${sec + 1} COMPARISON ===`);
  for (let i = 0; i < Math.max(sSrc.length, sEn.length); i++) {
    console.log(`Row ${i}:`);
    console.log(`  SRC: ${sSrc[i] ? sSrc[i].join(' | ') : '[MISSING]'}`);
    console.log(`  CN : ${sCn[i] ? sCn[i].join(' | ') : '[MISSING]'}`);
    console.log(`  EN : ${sEn[i] ? sEn[i].join(' | ') : '[MISSING]'}`);
  }
}
