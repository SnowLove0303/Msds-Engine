import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const outCnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";
const outEnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_EN Guanzhi.docx";

async function loadT(p, idx) {
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbl = doc.getElementsByTagName('w:tbl')[idx];
  const trs = tbl.getElementsByTagName('w:tr');
  const rows = [];
  for (let r = 0; r < trs.length; r++) {
    const tcs = trs[r].getElementsByTagName('w:tc');
    const cells = [];
    for (let c = 0; c < tcs.length; c++) {
      let t = '';
      const ts = tcs[c].getElementsByTagName('w:t');
      for (let k = 0; k < ts.length; k++) t += ts[k].textContent || '';
      cells.push(t.trim());
    }
    rows.push(cells);
  }
  return rows;
}

async function run() {
  console.log('CN Table 13:');
  console.log(JSON.stringify(await loadT(outCnPath, 12), null, 2));
  console.log('EN Table 13:');
  console.log(JSON.stringify(await loadT(outEnPath, 12), null, 2));
}

run();
