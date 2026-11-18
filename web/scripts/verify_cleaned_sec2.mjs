import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';


const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function checkDocxSec2() {
  const cnGz = path.join(targetDir, 'EC-1804 msds_CN 冠志.docx');
  const enGz = path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx');

  async function dump(filePath, name) {
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const tbl1 = doc.getElementsByTagName('w:tbl')[1];
    const ps = tbl1.getElementsByTagName('w:p');
    console.log(`\n=== ${name} Section 2 Paragraphs (${ps.length}) ===`);
    for (let i = 0; i < ps.length; i++) {
      console.log(`  P${i}: [${ps[i].textContent.trim()}]`);
    }
  }

  await dump(cnGz, 'CN DOCX');
  await dump(enGz, 'EN DOCX');
}

checkDocxSec2().catch(console.error);
