import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkSec2EnParas() {
  const enGz = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(enGz));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl1 = doc.getElementsByTagName('w:tbl')[1];
  const ps = tbl1.getElementsByTagName('w:p');
  console.log('EN Table 1 Paragraphs count:', ps.length);
  for (let i = 0; i < ps.length; i++) {
    console.log(`P${i}: [${ps[i].textContent.trim()}]`);
  }
}
checkSec2EnParas().catch(console.error);
