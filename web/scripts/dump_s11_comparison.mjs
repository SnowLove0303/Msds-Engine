import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpS11(filePath, label) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
  console.log(`Total tables found: ${tbls.length}`);
  // Section 11 is table index 10
  let s11Tbl = tbls[10];
  if (!s11Tbl) {
    for (let i = 0; i < tbls.length; i++) {
      const text = tbls[i].textContent || '';
      if (/毒理学|Toxicological/i.test(text)) {
        s11Tbl = tbls[i];
        break;
      }
    }
  }
  console.log('========================================================================');
  console.log(`=== ${label} ===`);
  console.log('========================================================================');
  if (!s11Tbl) {
    console.log('Section 11 table NOT FOUND!');
    return;
  }
  const rows = Array.from(s11Tbl.getElementsByTagName('w:tr'));
  console.log('Rows count:', rows.length);
  for (let r = 0; r < rows.length; r++) {
    const cells = Array.from(rows[r].getElementsByTagName('w:tc'));
    console.log(`\n--- Row ${r} (Cells: ${cells.length}) ---`);
    for (let c = 0; c < cells.length; c++) {
      const tc = cells[c];
      const tcPr = tc.getElementsByTagName('w:tcPr')[0];
      const tcW = tcPr?.getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
      const gridSpan = tcPr?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
      const vMerge = tcPr?.getElementsByTagName('w:vMerge')[0]?.getAttribute('w:val');
      const ps = Array.from(tc.getElementsByTagName('w:p'));
      console.log(`  [Cell ${c}] tcW=${tcW}, gridSpan=${gridSpan}, vMerge=${vMerge}, Paragraphs=${ps.length}`);
      for (let p = 0; p < ps.length; p++) {
        const pNode = ps[p];
        const pPr = pNode.getElementsByTagName('w:pPr')[0];
        const jc = pPr?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
        const ind = pPr?.getElementsByTagName('w:ind')[0];
        const indLeft = ind?.getAttribute('w:left');
        const indFirstLine = ind?.getAttribute('w:firstLine');
        const indHanging = ind?.getAttribute('w:hanging');
        const spacing = pPr?.getElementsByTagName('w:spacing')[0];
        const line = spacing?.getAttribute('w:line');
        const lineRule = spacing?.getAttribute('w:lineRule');
        const rNodes = Array.from(pNode.getElementsByTagName('w:r'));
        console.log(`    P[${p}] jc=${jc}, ind(left=${indLeft}, firstLine=${indFirstLine}, hanging=${indHanging}), spacing(line=${line}, rule=${lineRule}), Runs=${rNodes.length}`);
        let fullPText = '';
        for (let ri = 0; ri < rNodes.length; ri++) {
          const rNode = rNodes[ri];
          const rPr = rNode.getElementsByTagName('w:rPr')[0];
          const b = rPr?.getElementsByTagName('w:b')[0];
          const isBold = b ? (b.getAttribute('w:val') !== '0') : false;
          const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
          const rFonts = rPr?.getElementsByTagName('w:rFonts')[0];
          const ascii = rFonts?.getAttribute('w:ascii');
          const eastAsia = rFonts?.getAttribute('w:eastAsia');
          const tText = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
          fullPText += tText;
          console.log(`      R[${ri}]: bold=${isBold}, sz=${sz}, font=${eastAsia}/${ascii}, text="${tText}"`);
        }
        console.log(`      >> Full Paragraph Text: "${fullPText}"`);
      }
    }
  }
}

async function run() {
  await dumpS11('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志 手做改版材料.docx', 'GOLD HANDCRAFT (手做版)');
  await dumpS11('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx', 'GENERATED DELIVERABLE (生成版)');
}

run().catch(console.error);
