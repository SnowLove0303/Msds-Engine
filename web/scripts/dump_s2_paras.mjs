import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608';
const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';

async function dumpParas(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl = doc.getElementsByTagName('w:tbl')[1];
  const paras = Array.from(tbl.getElementsByTagName('w:p'));
  return paras.map(p => (p.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
}

console.log('--- Source Section 2 Paragraphs ---');
(await dumpParas(srcPath)).forEach((p, i) => console.log(`P${i}:`, p));

console.log('\n--- Output CN Guanzhi Section 2 Paragraphs ---');
(await dumpParas(path.join(targetDir, 'PU-608 msds_CN 冠志.docx'))).forEach((p, i) => console.log(`P${i}:`, p));

console.log('\n--- Output EN Guanzhi Section 2 Paragraphs ---');
(await dumpParas(path.join(targetDir, 'PU-608 msds_EN Guanzhi.docx'))).forEach((p, i) => console.log(`P${i}:`, p));
