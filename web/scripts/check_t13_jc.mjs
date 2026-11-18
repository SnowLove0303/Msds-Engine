import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const outCnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";

async function run() {
  const buf = fs.readFileSync(outCnPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl13 = doc.getElementsByTagName('w:tbl')[12];
  const jcs = tbl13.getElementsByTagName('w:jc');
  for (let i = 0; i < jcs.length; i++) {
    console.log(`Table 13 w:jc #${i}: val="${jcs[i].getAttribute('w:val')}"`);
  }
}

run();
