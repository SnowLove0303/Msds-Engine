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

const s4Src = await parseTable(srcPath, 3);
const s4Cn = await parseTable(path.join(targetDir, 'PU-608 msds_CN 冠志.docx'), 3);
const s4En = await parseTable(path.join(targetDir, 'PU-608 msds_EN Guanzhi.docx'), 3);

console.log('=== SECTION 4 COMPARISON ===');
for (let i = 0; i < Math.max(s4Src.length, s4Cn.length); i++) {
  console.log(`\nRow ${i}:`);
  console.log(`  SRC: ${s4Src[i] ? s4Src[i].join(' | ') : '[MISSING]'}`);
  console.log(`  CN : ${s4Cn[i] ? s4Cn[i].join(' | ') : '[MISSING]'}`);
  console.log(`  EN : ${s4En[i] ? s4En[i].join(' | ') : '[MISSING]'}`);
}
