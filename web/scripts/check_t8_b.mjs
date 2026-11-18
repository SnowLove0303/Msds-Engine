import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const outCnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";

async function run() {
  const buf = fs.readFileSync(outCnPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl8 = doc.getElementsByTagName('w:tbl')[7];
  const trs = tbl8.getElementsByTagName('w:tr');
  const ser = new XMLSerializer();
  for (let r = 0; r < trs.length; r++) {
    const tcs = trs[r].getElementsByTagName('w:tc');
    if (tcs.length > 1) {
      const c1 = tcs[1];
      const c1Xml = ser.serializeToString(c1);
      const isBold = /<w:b(?:[\s\/>])/.test(c1Xml) && !/<w:b\s+w:val="false"/.test(c1Xml);
      console.log(`Table 8 Row ${r} Cell 1 text="${(c1.textContent || '').trim()}" isBold=${isBold}`);
    }
  }
}

run();
