import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function printSrcSec2() {
  const srcZip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1)_源文件留存.docx'));
  const xml = await srcZip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl = doc.getElementsByTagName('w:tbl')[1];
  console.log('--- SRC S2 FULL XML SNIPPETS ---');
  const ps = tbl.getElementsByTagName('w:p');
  for (let i = 0; i < ps.length; i++) {
    console.log(`P${i}: [${ps[i].textContent}]`);
  }
}
printSrcSec2().catch(console.error);
