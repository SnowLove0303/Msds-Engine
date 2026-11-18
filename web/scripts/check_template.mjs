import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkTemplate(tplPath) {
  const data = fs.readFileSync(tplPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  
  console.log(`\n================ TEMPLATE: ${tplPath} ================`);
  for (let i = 0; i < tbls.length; i++) {
    const text = tbls[i].textContent || '';
    if (text.includes('危险') || text.includes('Hazards')) {
      console.log(`--- Table ${i}: Section 2 ---`);
      const rows = tbls[i].getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].getElementsByTagName('w:tc');
        for (let c = 0; c < cells.length; c++) {
          console.log(`  Row ${r} Cell ${c}: ${cells[c].textContent.trim().replace(/\s+/g, ' ')}`);
        }
      }
    }
    if (text.includes('接触控制') || text.includes('Exposure control')) {
      console.log(`--- Table ${i}: Section 8 ---`);
      const rows = tbls[i].getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].getElementsByTagName('w:tc');
        for (let c = 0; c < cells.length; c++) {
          const tcPr = cells[c].getElementsByTagName('w:tcPr')[0]?.toString() || '';
          const ps = cells[c].getElementsByTagName('w:p');
          const pTexts = [];
          for (let p = 0; p < ps.length; p++) {
            const runs = ps[p].getElementsByTagName('w:r');
            let t = '';
            for (let rn = 0; rn < runs.length; rn++) {
              const b = runs[rn].getElementsByTagName('w:b').length > 0;
              const sz = runs[rn].getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
              t += `[${runs[rn].textContent} (b:${b},sz:${sz})]`;
            }
            if (t) pTexts.push(t);
          }
          console.log(`  Row ${r} Cell ${c} (tcPr gridSpan: ${tcPr.match(/w:gridSpan w:val="(\d+)"/)?.[1] || '1'}): ${pTexts.join(' / ')}`);
        }
      }
    }
  }
}

async function main() {
  await checkTemplate('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
}

main().catch(console.error);
