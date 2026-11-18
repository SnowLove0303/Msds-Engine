import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('text'), 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  console.log('Source Section 9:');
  const s9 = tbls[8];
  const trs = s9.getElementsByTagName('w:tr');
  for (let i = 0; i < trs.length; i++) {
    const r = trs[i];
    const cells = r.getElementsByTagName('w:tc');
    const t0 = cells[0]?.textContent?.trim();
    const t1 = cells[1]?.textContent?.trim();
    console.log(`${t0} -> ${t1}`);
  }
}

main().catch(console.error);
