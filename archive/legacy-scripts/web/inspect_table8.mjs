import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpTableText(docxPath) {
  if (!fs.existsSync(docxPath)) return `File not found: ${docxPath}`;
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  
  // Find table corresponding to Section 8
  let sec8Tbl = null;
  let sec8Idx = -1;
  for (let i = 0; i < tables.length; i++) {
    const text = tables[i].textContent;
    if (text.includes('接触控制') || text.includes('Exposure controls') || text.includes('控制参数') || text.includes('Control parameters')) {
      sec8Tbl = tables[i];
      sec8Idx = i;
      break;
    }
  }
  if (!sec8Tbl) return `Section 8 table not found in ${docxPath}`;

  const rows = sec8Tbl.getElementsByTagName('w:tr');
  const result = [`Section 8 Table found at index ${sec8Idx}, rows count: ${rows.length}`];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const cells = row.getElementsByTagName('w:tc');
    const cellTexts = [];
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const paras = cell.getElementsByTagName('w:p');
      const pTexts = [];
      for (let p = 0; p < paras.length; p++) {
        const runs = paras[p].getElementsByTagName('w:t');
        let t = '';
        for (let i = 0; i < runs.length; i++) t += runs[i].textContent;
        pTexts.push(t);
      }
      cellTexts.push(pTexts.join(' // '));
    }
    result.push(`  Row ${r + 1}: ${cellTexts.map(t => JSON.stringify(t)).join('  |  ')}`);
  }
  return result.join('\n');
}

async function main() {
  const src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
  const outCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
  const outEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx';

  console.log('=== 1. SOURCE EP-1736 SECTION 8 TABLE ===');
  console.log(await dumpTableText(src));

  console.log('\n=== 2. GENERATED OUTPUT CN SECTION 8 TABLE ===');
  console.log(await dumpTableText(outCn));

  console.log('\n=== 3. GENERATED OUTPUT EN SECTION 8 TABLE ===');
  console.log(await dumpTableText(outEn));
}

main().catch(console.error);
