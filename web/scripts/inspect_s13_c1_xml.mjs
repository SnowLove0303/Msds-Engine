import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function run() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tbls = doc.getElementsByTagName('w:tbl');
  const s13 = tbls[12];
  const trs = s13.getElementsByTagName('w:tr');
  const r3 = trs[3];
  const c1 = r3.getElementsByTagName('w:tc')[1];
  console.log('c1 full xml:');
  console.log(c1.toString());
}
run();
