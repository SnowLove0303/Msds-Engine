import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('text'), 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  console.log('Section 1 CN textContent:');
  console.log(JSON.stringify(tbls[0].textContent));
}

main().catch(console.error);
