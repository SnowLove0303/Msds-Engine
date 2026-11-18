import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpTable(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tables.length; i++) {
    const text = tables[i].textContent;
    if (text.includes('接触控制') || text.includes('Exposure controls') || text.includes('控制参数')) {
      const rows = tables[i].getElementsByTagName('w:tr');
      console.log(`=== ${docxPath} (Table ${i}, rows: ${rows.length}) ===`);
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        const cellTexts = [];
        for (let c = 0; c < cells.length; c++) {
          const paras = cells[c].getElementsByTagName('w:p');
          const pTexts = [];
          for (let p = 0; p < paras.length; p++) {
            const runs = paras[p].getElementsByTagName('w:t');
            let t = '';
            for (let k = 0; k < runs.length; k++) t += runs[k].textContent;
            pTexts.push(t);
          }
          cellTexts.push(pTexts.join(' // '));
        }
        console.log(`  Row ${r + 1}: ${cellTexts.map(t => JSON.stringify(t)).join('  |  ')}`);
      }
      break;
    }
  }
}

async function main() {
  await dumpTable('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  console.log('\n');
  await dumpTable('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
}

main().catch(console.error);
