import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectSec2Formatting() {
  const cnZip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));
  const enZip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx'));

  async function checkDoc(zip, name) {
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const tbl = doc.getElementsByTagName('w:tbl')[1];
    console.log(`\n=== ${name} Section 2 ===`);
    const ps = tbl.getElementsByTagName('w:p');
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const runs = p.getElementsByTagName('w:r');
      let details = [];
      for (let r = 0; r < runs.length; r++) {
        const rElem = runs[r];
        const rPr = rElem.getElementsByTagName('w:rPr')[0];
        const b = rPr ? rPr.getElementsByTagName('w:b').length > 0 : false;
        const sz = rPr ? rPr.getElementsByTagName('w:sz')[0]?.getAttribute('w:val') : 'none';
        const t = rElem.getElementsByTagName('w:t')[0]?.textContent || '';
        details.push(`[${t}](b:${b},sz:${sz})`);
      }
      console.log(`P${i}: ${details.join(' ')}`);
    }
  }

  await checkDoc(cnZip, 'CN Deliverable');
  await checkDoc(enZip, 'EN Deliverable');
}

inspectSec2Formatting().catch(console.error);
