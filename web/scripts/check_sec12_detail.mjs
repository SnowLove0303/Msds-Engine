import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608';

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

const s12Src = await parseTable('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx', 11);
const s12Cn = await parseTable(path.join(targetDir, 'PU-608 msds_CN 冠志.docx'), 11);
const s12En = await parseTable(path.join(targetDir, 'PU-608 msds_EN Guanzhi.docx'), 11);

console.log('=== SECTION 12 COMPARISON ===');
console.log('--- Source Section 12 ---');
s12Src.forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));
console.log('\n--- CN Section 12 ---');
s12Cn.forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));
console.log('\n--- EN Section 12 ---');
s12En.forEach((r, i) => console.log(`R${i}:`, r.join(' | ')));
