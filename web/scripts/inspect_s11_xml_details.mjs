import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function run() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tbls = doc.getElementsByTagName('w:tbl');
  const s11 = tbls[10];
  const trs11 = s11.getElementsByTagName('w:tr');
  const r3 = trs11[3];
  const ps = r3.getElementsByTagName('w:p');

  for (let i = 0; i < ps.length; i++) {
    console.log(`=== P[${i}] ===`);
    const pPr = ps[i].getElementsByTagName('w:pPr')[0];
    const spacing = pPr?.getElementsByTagName('w:spacing')[0];
    console.log('spacing:', spacing ? spacing.toString() : 'none');
    const runs = ps[i].getElementsByTagName('w:r');
    for (let r = 0; r < runs.length; r++) {
      const text = runs[r].getElementsByTagName('w:t')[0]?.textContent;
      const br = runs[r].getElementsByTagName('w:br').length;
      console.log(`  r[${r}]: br=${br}, text="${text}"`);
    }
  }
}
run();
