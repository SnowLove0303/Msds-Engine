import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function extractDocxText(filePath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  return tables.map((tbl, tIdx) => {
    const rows = Array.from(tbl.getElementsByTagName('w:tr'));
    return rows.map((tr, rIdx) => {
      const cells = Array.from(tr.getElementsByTagName('w:tc'));
      return cells.map(c => (c.textContent || '').trim().replace(/\s+/g, ' '));
    });
  });
}

async function compare() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';
  const outPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';

  const srcTables = await extractDocxText(srcPath);
  const outTables = await extractDocxText(outPath);

  console.log(`Source tables: ${srcTables.length}, Output tables: ${outTables.length}`);

  for (let t = 0; t < Math.max(srcTables.length, outTables.length); t++) {
    const sT = srcTables[t] || [];
    const oT = outTables[t] || [];
    console.log(`\n=================== TABLE ${t + 1} ===================`);
    console.log(`Source rows: ${sT.length}, Output rows: ${oT.length}`);
    
    // Print row differences
    const maxR = Math.max(sT.length, oT.length);
    for (let r = 0; r < maxR; r++) {
      const sR = sT[r] ? sT[r].join(' | ') : '[MISSING ROW]';
      const oR = oT[r] ? oT[r].join(' | ') : '[MISSING ROW]';
      if (sR !== oR) {
        console.log(`--- Row ${r} Diff ---`);
        console.log(`  SRC: ${sR.slice(0, 160)}`);
        console.log(`  OUT: ${oR.slice(0, 160)}`);
      }
    }
  }
}

compare().catch(console.error);
