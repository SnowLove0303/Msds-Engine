import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpGeneratedS11(docxPath) {
  console.log('=== DUMPING GENERATED S11 FOR:', docxPath);
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const tbl = tbls[10]; // Section 11
  const trs = tbl.getElementsByTagName('w:tr');
  console.log('Total rows:', trs.length);

  for (let r = 0; r < trs.length; r++) {
    const row = trs[r];
    const cells = row.getElementsByTagName('w:tc');
    const cellDescs = [];
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const ps = cell.getElementsByTagName('w:p');
      const pTexts = [];
      for (let p = 0; p < ps.length; p++) {
        pTexts.push(ps[p].textContent);
      }
      cellDescs.push(`[Cell ${c}] (${ps.length}p): "${pTexts.join(' // ')}"`);
    }
    console.log(`Row ${r} (${cells.length} cells): ${cellDescs.join(' | ')}`);
  }
}

dumpGeneratedS11('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx');
dumpGeneratedS11('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.docx');
