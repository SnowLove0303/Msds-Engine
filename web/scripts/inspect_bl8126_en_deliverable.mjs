import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const docxPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_EN Guanzhi.docx";

async function run() {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');

  const tblNodes = doc.getElementsByTagName('w:tbl');
  console.log(`EN Deliverable has ${tblNodes.length} tables.`);

  // Inspect Section 2 (Table 2)
  const tbl2 = tblNodes[1];
  const trList = tbl2.getElementsByTagName('w:tr');
  console.log(`Table 2 has ${trList.length} rows.`);
  for (let r = 0; r < trList.length; r++) {
    const tr = trList[r];
    const tcList = tr.getElementsByTagName('w:tc');
    for (let c = 0; c < tcList.length; c++) {
      const tc = tcList[c];
      const pList = tc.getElementsByTagName('w:p');
      for (let p = 0; p < pList.length; p++) {
        let t = '';
        const tList = pList[p].getElementsByTagName('w:t');
        for (let k = 0; k < tList.length; k++) t += tList[k].textContent || '';
        if (t.trim()) console.log(`  [T2 R${r} C${c} P${p}] ${t.trim()}`);
      }
    }
  }
}

run().catch(console.error);
