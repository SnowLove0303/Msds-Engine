import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function extractDocxTables(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = dom.getElementsByTagName('w:tbl');
  const result = [];

  for (let t = 0; t < tbls.length; t++) {
    const tbl = tbls[t];
    const rows = tbl.getElementsByTagName('w:tr');
    const tableData = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = row.getElementsByTagName('w:tc');
      const rowData = [];
      for (let c = 0; c < cells.length; c++) {
        const text = Array.from(cells[c].getElementsByTagName('w:t'))
          .map(tNode => tNode.textContent)
          .join('');
        rowData.push(text.trim());
      }
      tableData.push(rowData);
    }
    result.push(tableData);
  }
  return result;
}

async function dumpBilingual() {
  const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-3 水性聚碳化二亚胺交联剂 OS/OS-8503DMM/OS-8503DMM msds_CN 冠志.docx';
  const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-3 水性聚碳化二亚胺交联剂 OS/OS-8503DMM/OS-8503DMM msds_EN Guanzhi.docx';

  const cnTables = await extractDocxTables(cnPath);
  const enTables = await extractDocxTables(enPath);

  console.log(`CN Tables: ${cnTables.length}, EN Tables: ${enTables.length}`);

  for (let t = 0; t < cnTables.length; t++) {
    const cnT = cnTables[t];
    const enT = enTables[t];
    console.log(`\n========================================================================`);
    console.log(`>>> Section Table ${t + 1} (CN rows: ${cnT.length}, EN rows: ${enT?.length || 0})`);
    console.log(`========================================================================`);

    const maxRows = Math.max(cnT.length, enT?.length || 0);
    for (let r = 0; r < maxRows; r++) {
      const cnRow = cnT[r] || ['[MISSING ROW]'];
      const enRow = enT?.[r] || ['[MISSING ROW]'];
      console.log(`[R${r}] CN: ${JSON.stringify(cnRow)}`);
      console.log(`     EN: ${JSON.stringify(enRow)}`);
    }
  }
}

dumpBilingual().catch(console.error);
