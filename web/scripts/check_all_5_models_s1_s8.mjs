import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737'];

async function checkAllModels() {
  for (const m of models) {
    const docxPath = `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/${m}/${m} msds_CN 冠志.docx`;
    const buf = fs.readFileSync(docxPath);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const tables = doc.getElementsByTagName('w:tbl');
    
    console.log(`\n======================================================`);
    console.log(`               CHECKING ${m}`);
    console.log(`======================================================`);

    for (let i = 0; i < tables.length; i++) {
      const tbl = tables[i];
      const text = tbl.textContent;
      let secName = `Table ${i+1}`;
      if (text.includes('物料及供应商标识')) secName = 'Section 1';
      else if (text.includes('危险性概述')) secName = 'Section 2';
      else if (text.includes('接触控制') || text.includes('Exposure control')) secName = 'Section 8';
      else continue;

      const rows = tbl.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].getElementsByTagName('w:tc');
        if (cells.length < 2) continue;
        const valCell = cells[cells.length - 1];
        const runs = valCell.getElementsByTagName('w:r');
        const runInfo = [];
        for (let k = 0; k < runs.length; k++) {
          const rNode = runs[k];
          const rPr = rNode.getElementsByTagName('w:rPr')[0];
          const rFonts = rPr?.getElementsByTagName('w:rFonts')[0];
          const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
          const bNode = rPr?.getElementsByTagName('w:b')[0];
          let b = 'none';
          if (bNode) {
            b = bNode.getAttribute('w:val') || 'true';
          }
          const ascii = rFonts?.getAttribute('w:ascii');
          const eastAsia = rFonts?.getAttribute('w:eastAsia');
          const t = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
          runInfo.push(`"${t}"(sz=${sz},b=${b},font=${ascii}/${eastAsia})`);
        }
        const labelText = cells[0].textContent.trim().replace(/\s+/g, ' ');
        if (runInfo.length > 0) {
          console.log(`  [${secName} R${r+1}] ${labelText} => ${runInfo.join(' ')}`);
        }
      }
    }
  }
}

await checkAllModels();
