import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function check() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tbls = doc.getElementsByTagName('w:tbl');
  const s11 = tbls[10];
  const r3 = s11.getElementsByTagName('w:tr')[3];
  const ps = r3.getElementsByTagName('w:p');
  for (let i = 0; i < ps.length; i++) {
    console.log(`P${i}:`);
    for (const c of Array.from(ps[i].childNodes)) {
      if (c.nodeName === 'w:pPr') continue;
      if (c.nodeName === 'w:r') {
        for (const rc of Array.from(c.childNodes)) {
          if (rc.nodeName === 'w:t') console.log(`  text: [${rc.textContent}]`);
          if (rc.nodeName === 'w:br') console.log(`  <br/>`);
        }
      }
    }
  }
}
check();
