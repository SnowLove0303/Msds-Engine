import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const docxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
const buf = fs.readFileSync(docxPath);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const tables = doc.getElementsByTagName('w:tbl');
const t15 = tables[14];

const rows = t15.getElementsByTagName('w:tr');
for (let i = 1; i < rows.length; i++) {
  console.log(`\n--- Row ${i} XML:`);
  console.log(new XMLSerializer().serializeToString(rows[i]));
}
