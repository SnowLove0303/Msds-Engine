import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkRow3() {
  const zip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl8 = doc.getElementsByTagName('w:tbl')[7];
  const r3 = tbl8.getElementsByTagName('w:tr')[3];
  console.log('Row 3 XML:\n', r3.toString());
}
checkRow3().catch(console.error);
