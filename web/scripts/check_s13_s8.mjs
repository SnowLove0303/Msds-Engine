import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function checkS13andS8() {
  const cnPath = path.join(targetDir, 'EC-1804 msds_CN 冠志.docx');
  const enPath = path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx');

  // Check CN S13 (Table 12)
  const cnZip = await JSZip.loadAsync(fs.readFileSync(cnPath));
  const cnXml = await cnZip.file('word/document.xml').async('string');
  const cnDoc = new DOMParser().parseFromString(cnXml, 'text/xml');
  const tblsCn = cnDoc.getElementsByTagName('w:tbl');
  for (let t = 0; t < tblsCn.length; t++) {
    if (tblsCn[t].textContent.includes('废弃处置') || tblsCn[t].textContent.includes('13.')) {
      console.log(`\n=== CN Table ${t} (Section 13) ===`);
      const ps = tblsCn[t].getElementsByTagName('w:p');
      for (let p = 0; p < ps.length; p++) {
        const jc = ps[p].getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
        console.log(`  P${p}: jc="${jc}", text="${ps[p].textContent.trim().slice(0, 40)}"`);
      }
    }
  }

  // Check EN S8 (Table 7)
  const enZip = await JSZip.loadAsync(fs.readFileSync(enPath));
  const enXml = await enZip.file('word/document.xml').async('string');
  const enDoc = new DOMParser().parseFromString(enXml, 'text/xml');
  const tblsEn = enDoc.getElementsByTagName('w:tbl');
  for (let t = 0; t < tblsEn.length; t++) {
    if (tblsEn[t].textContent.includes('Exposure control') || tblsEn[t].textContent.includes('8.')) {
      console.log(`\n=== EN Table ${t} (Section 8) ===`);
      const ps = tblsEn[t].getElementsByTagName('w:p');
      for (let p = 0; p < ps.length; p++) {
        const rPr = ps[p].getElementsByTagName('w:rPr')[0];
        const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
        console.log(`  P${p}: sz="${sz}", text="${ps[p].textContent.trim().slice(0, 40)}"`);
      }
    }
  }
}

checkS13andS8().catch(console.error);
