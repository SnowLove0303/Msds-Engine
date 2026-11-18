import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkP4P5() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl1 = doc.getElementsByTagName('w:tbl')[1];
  const ps = tbl1.getElementsByTagName('w:p');
  for (let i = 0; i < ps.length; i++) {
    const text = ps[i].textContent;
    if (text.includes('象形图') || text.includes('信号词')) {
      console.log(`P${i} text: "${text}"`);
      console.log(`P${i} XML:\n${ps[i].toString()}\n`);
    }
  }
}
checkP4P5().catch(console.error);
