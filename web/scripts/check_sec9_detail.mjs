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

const s9Src = await parseTable(srcPath, 8);
const s9Cn = await parseTable(path.join(targetDir, 'PU-608 msds_CN 冠志.docx'), 8);
const s9En = await parseTable(path.join(targetDir, 'PU-608 msds_EN Guanzhi.docx'), 8);

console.log('=== SECTION 9 ROW-BY-ROW COMPARISON ===');
for (let i = 0; i < Math.max(s9Src.length, s9Cn.length); i++) {
  const srcR = s9Src[i] ? s9Src[i].join(' | ') : '[MISSING]';
  const cnR = s9Cn[i] ? s9Cn[i].join(' | ') : '[MISSING]';
  const enR = s9En[i] ? s9En[i].join(' | ') : '[MISSING]';
  console.log(`\nRow ${i}:`);
  console.log(`  SRC: ${srcR}`);
  console.log(`  CN : ${cnR}`);
  console.log(`  EN : ${enR}`);
}
