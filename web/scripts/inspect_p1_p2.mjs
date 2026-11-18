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
  const trs = s11.getElementsByTagName('w:tr');
  const r3 = trs[3];
  const ps = r3.getElementsByTagName('w:p');

  console.log('P1 xml:', ps[1].toString());
  console.log('P2 xml:', ps[2].toString());
}
run();
