import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx';
  const filePathEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_EN Guanzhi.docx';
  
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('text'), 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  
  console.log('=== CN SECTIONS ===');
  console.log('Sec 4:', JSON.stringify(tbls[3].textContent));
  console.log('Sec 5:', JSON.stringify(tbls[4].textContent));
  console.log('Sec 6:', JSON.stringify(tbls[5].textContent));
  console.log('Sec 7:', JSON.stringify(tbls[6].textContent));
  console.log('Sec 13:', JSON.stringify(tbls[12].textContent));
  console.log('Sec 15:', JSON.stringify(tbls[14].textContent));
  console.log('Sec 16:', JSON.stringify(tbls[15].textContent));

  const zipEn = await JSZip.loadAsync(fs.readFileSync(filePathEn));
  const docEn = new DOMParser().parseFromString(await zipEn.file('word/document.xml').async('text'), 'text/xml');
  const tblsEn = docEn.getElementsByTagName('w:tbl');
  console.log('\n=== EN SECTIONS ===');
  console.log('Sec 6 EN:', JSON.stringify(tblsEn[5].textContent));
  console.log('Sec 13 EN:', JSON.stringify(tblsEn[12].textContent));
  console.log('Sec 15 EN:', JSON.stringify(tblsEn[14].textContent));
  console.log('Sec 16 EN:', JSON.stringify(tblsEn[15].textContent));
}

main().catch(console.error);
