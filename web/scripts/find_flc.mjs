import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('text'), 'text/xml');
  const inds = doc.getElementsByTagName('w:ind');
  for (let i = 0; i < inds.length; i++) {
    const ind = inds[i];
    const flc = ind.getAttribute('w:firstLineChars') || ind.getAttribute('firstLineChars');
    if (flc) {
      console.log(`Found firstLineChars="${flc}" in paragraph:`, ind.parentNode?.parentNode?.textContent?.slice(0, 80));
    }
  }
}

main().catch(console.error);
