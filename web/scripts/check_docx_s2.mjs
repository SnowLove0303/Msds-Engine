import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkDocxSec2() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 国彩.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl1 = doc.getElementsByTagName('w:tbl')[1];
  const ps = tbl1.getElementsByTagName('w:p');
  for (let i = 0; i < ps.length; i++) {
    console.log(`P${i}: ${ps[i].textContent}`);
  }
}
checkDocxSec2().catch(console.error);
