import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectXml(docxPath, sectionKeyword) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const entry = zip.file('word/document.xml');
  const xml = await entry.async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  for (let t = 0; t < tables.length; t++) {
    const tbl = tables[t];
    const tblXml = tbl.toString();
    if (tblXml.includes(sectionKeyword)) {
      console.log(`\n================ Found table for ${sectionKeyword} in ${docxPath} ================`);
      const rows = tbl.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        console.log(`\n--- Row ${r} (cells: ${cells.length}) ---`);
        for (let c = 0; c < cells.length; c++) {
          const cell = cells[c];
          // print tcPr
          const tcPr = cell.getElementsByTagName('w:tcPr')[0];
          const tcPrStr = tcPr ? tcPr.toString() : 'none';
          
          // print paragraphs and text
          const paras = cell.getElementsByTagName('w:p');
          const pTexts = [];
          for (let p = 0; p < paras.length; p++) {
            const pElem = paras[p];
            const pPr = pElem.getElementsByTagName('w:pPr')[0];
            const jc = pPr ? pPr.getElementsByTagName('w:jc')[0] : null;
            const jcVal = jc ? jc.getAttribute('w:val') : 'default';
            
            const runs = pElem.getElementsByTagName('w:r');
            let runDetails = [];
            for (let rn = 0; rn < runs.length; rn++) {
              const rElem = runs[rn];
              const rPr = rElem.getElementsByTagName('w:rPr')[0];
              const b = rPr ? rPr.getElementsByTagName('w:b').length > 0 : false;
              const sz = rPr ? rPr.getElementsByTagName('w:sz')[0]?.getAttribute('w:val') : 'none';
              const rFonts = rPr ? rPr.getElementsByTagName('w:rFonts')[0] : null;
              const eastAsia = rFonts ? rFonts.getAttribute('w:eastAsia') : '';
              const ascii = rFonts ? rFonts.getAttribute('w:ascii') : '';
              
              const t = rElem.getElementsByTagName('w:t')[0]?.textContent || '';
              if (t) {
                runDetails.push(`"${t}"(b:${b},sz:${sz},jc:${jcVal})`);
              }
            }
            if (runDetails.length > 0) {
              pTexts.push(runDetails.join(' + '));
            }
          }
          console.log(`  Cell ${c} [tcPr: ${tcPrStr.replace(/\s+/g, ' ')}]:\n    ${pTexts.join('\n    ')}`);
        }
      }
    }
  }
}

async function main() {
  const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';
  
  await inspectXml(cnPath, '2.危险性概述');
  await inspectXml(cnPath, '8.接触控制');
  await inspectXml(enPath, 'Hazards');
  await inspectXml(enPath, 'Exposure control');
}

main().catch(err => console.error(err));
