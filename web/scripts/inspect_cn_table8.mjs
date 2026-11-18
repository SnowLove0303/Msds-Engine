import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectTable8(docxPath) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const entry = zip.file('word/document.xml');
  const xml = await entry.async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  for (let t = 0; t < tables.length; t++) {
    const tbl = tables[t];
    const text = tbl.textContent || '';
    if (text.includes('接触控制') || text.includes('Exposure control')) {
      console.log(`\n================ Table 8 in ${docxPath} ================`);
      const rows = tbl.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        console.log(`\n--- Row ${r} (cells: ${cells.length}) ---`);
        for (let c = 0; c < cells.length; c++) {
          const cell = cells[c];
          const paras = cell.getElementsByTagName('w:p');
          const pTexts = [];
          for (let p = 0; p < paras.length; p++) {
            const pElem = paras[p];
            const runs = pElem.getElementsByTagName('w:r');
            let runDetails = [];
            for (let rn = 0; rn < runs.length; rn++) {
              const rElem = runs[rn];
              const rPr = rElem.getElementsByTagName('w:rPr')[0];
              const b = rPr ? rPr.getElementsByTagName('w:b').length > 0 : false;
              const sz = rPr ? rPr.getElementsByTagName('w:sz')[0]?.getAttribute('w:val') : 'none';
              const t = rElem.getElementsByTagName('w:t')[0]?.textContent || '';
              if (t) {
                runDetails.push(`"${t}"(b:${b},sz:${sz})`);
              }
            }
            if (runDetails.length > 0) {
              pTexts.push(runDetails.join(' + '));
            }
          }
          console.log(`  Cell ${c}: ${pTexts.join(' | ')}`);
        }
      }
    }
  }
}

async function main() {
  const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  await inspectTable8(cnPath);
}

main().catch(err => console.error(err));
