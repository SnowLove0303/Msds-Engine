import JSZip from 'jszip';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

async function checkS2() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s2 = tbls[1];
  console.log('Section 2 text:\n', s2.textContent);
}
checkS2().catch(console.error);
