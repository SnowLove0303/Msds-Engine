import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const srcPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";
const outCnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";
const outEnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_EN Guanzhi.docx";

async function loadTables(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tblNodes = doc.getElementsByTagName('w:tbl');
  const tables = [];
  for (let t = 0; t < tblNodes.length; t++) {
    const tbl = tblNodes[t];
    const trList = tbl.getElementsByTagName('w:tr');
    const rows = [];
    for (let r = 0; r < trList.length; r++) {
      const tr = trList[r];
      const tcList = tr.getElementsByTagName('w:tc');
      const cells = [];
      for (let c = 0; c < tcList.length; c++) {
        const tc = tcList[c];
        const pList = tc.getElementsByTagName('w:p');
        const paras = [];
        for (let p = 0; p < pList.length; p++) {
          let tStr = '';
          const tList = pList[p].getElementsByTagName('w:t');
          for (let k = 0; k < tList.length; k++) tStr += tList[k].textContent || '';
          if (tStr.trim()) paras.push(tStr.trim());
        }
        cells.push(paras.join('\n'));
      }
      rows.push(cells);
    }
    tables.push(rows);
  }
  return { doc, tables };
}

async function audit() {
  const src = await loadTables(srcPath);
  const outCn = await loadTables(outCnPath);
  const outEn = await loadTables(outEnPath);

  console.log('=== AUDITING BL-8126 ALL 16 SECTIONS ===\n');

  for (let s = 1; s <= 16; s++) {
    const sIdx = s - 1;
    console.log(`\n========================================`);
    console.log(`>>> SECTION ${s} AUDIT`);
    console.log(`========================================`);

    const srcT = src.tables[sIdx] || [];
    const cnT = outCn.tables[sIdx] || [];
    const enT = outEn.tables[sIdx] || [];

    console.log(`Rows count: Source=${srcT.length}, OutputCN=${cnT.length}, OutputEN=${enT.length}`);

    // Print all rows of Output CN and Output EN
    console.log(`--- Output CN Rows ---`);
    cnT.forEach((r, idx) => console.log(`  R${idx}: ${JSON.stringify(r)}`));

    console.log(`--- Output EN Rows ---`);
    enT.forEach((r, idx) => console.log(`  R${idx}: ${JSON.stringify(r)}`));

    console.log(`--- Source Rows ---`);
    srcT.forEach((r, idx) => console.log(`  R${idx}: ${JSON.stringify(r)}`));
  }
}

audit().catch(console.error);
