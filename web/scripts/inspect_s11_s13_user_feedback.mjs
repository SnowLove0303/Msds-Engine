import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function run() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tbls = doc.getElementsByTagName('w:tbl');

  console.log('=== SECTION 11 ===');
  const s11 = tbls[10];
  const trs11 = s11.getElementsByTagName('w:tr');
  const r3 = trs11[3];
  const ps11 = r3.getElementsByTagName('w:p');
  console.log('s11 row 3 total p:', ps11.length);
  for (let i = 0; i < ps11.length; i++) {
    const text = ps11[i].textContent;
    const brs = ps11[i].getElementsByTagName('w:br').length;
    console.log(`p[${i}]: (len=${text.length}, brs=${brs}) text snippet: ${text.substring(0, 100)}`);
  }

  // Also check child elements of p[0] in s11
  console.log('\n--- S11 Detail of p[0] runs/breaks ---');
  const runsAndBrs = [];
  for (const child of Array.from(ps11[0].childNodes)) {
    if (child.nodeName === 'w:r') {
      const t = child.textContent;
      const hasBr = child.getElementsByTagName('w:br').length > 0;
      runsAndBrs.push(hasBr ? '<br/>' : `[${t}]`);
    } else if (child.nodeName === 'w:br') {
      runsAndBrs.push('<br/>');
    }
  }
  console.log(runsAndBrs.join(' '));

  console.log('\n=== SECTION 13 ===');
  const s13 = tbls[12];
  const trs13 = s13.getElementsByTagName('w:tr');
  console.log('s13 total tr:', trs13.length);
  for (let r = 0; r < trs13.length; r++) {
    const cells = trs13[r].getElementsByTagName('w:tc');
    console.log(`\n--- Row ${r} (cells=${cells.length}) ---`);
    for (let c = 0; c < cells.length; c++) {
      const ps = cells[c].getElementsByTagName('w:p');
      for (let p = 0; p < ps.length; p++) {
        const jc = ps[p].getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
        const ind = ps[p].getElementsByTagName('w:ind')[0];
        const left = ind?.getAttribute('w:left');
        const text = ps[p].textContent;
        console.log(`  c[${c}] p[${p}]: jc=${jc}, left=${left}, text snippet: [${text.substring(0, 120)}]`);
      }
    }
  }
}
run();
