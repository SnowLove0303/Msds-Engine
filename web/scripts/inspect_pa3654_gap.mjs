import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654';

async function loadDocXml(filePath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'text/xml');
}

function parseTableRows(tbl) {
  const trNodes = tbl.getElementsByTagName('w:tr');
  const rows = [];
  for (let i = 0; i < trNodes.length; i++) {
    const tr = trNodes[i];
    const tcNodes = tr.getElementsByTagName('w:tc');
    const cells = [];
    for (let j = 0; j < tcNodes.length; j++) {
      const pNodes = tcNodes[j].getElementsByTagName('w:p');
      let text = '';
      for (let k = 0; k < pNodes.length; k++) {
        text += (pNodes[k].textContent || '') + ' ';
      }
      cells.push(text.trim());
    }
    rows.push(cells);
  }
  return rows;
}

async function auditFile(fileName) {
  const filePath = path.join(targetDir, fileName);
  console.log(`\n======================================================`);
  console.log(`Auditing: ${fileName}`);
  console.log(`======================================================`);
  const doc = await loadDocXml(filePath);
  const tblNodes = doc.getElementsByTagName('w:tbl');
  console.log(`Total Tables: ${tblNodes.length}`);

  let totalBlankCells = 0;
  let totalRows = 0;

  for (let tIdx = 0; tIdx < tblNodes.length; tIdx++) {
    const sNum = tIdx + 1;
    const rows = parseTableRows(tblNodes[tIdx]);
    totalRows += rows.length;

    // Specific Section Inspections
    if (sNum === 1) {
      console.log(`\n--- Section 1 ---`);
      console.log(`Row 1 (Model slot):`, rows[1]);
      console.log(`Row 2 (Name+Model slot):`, rows[2]);
    } else if (sNum === 8) {
      console.log(`\n--- Section 8 ---`);
      rows.forEach((r, idx) => {
        if (/手部|FKM|IIR|NBR|建议|Engineering|Glove/i.test(r[0] || '')) {
          console.log(`  Row ${idx}: [${r.join(' | ')}]`);
        }
      });
    } else if (sNum === 11) {
      console.log(`\n--- Section 11 (Total Rows: ${rows.length}) ---`);
      rows.forEach((r, idx) => {
        console.log(`  Row ${idx}: [${r.join(' | ')}]`);
      });
    } else if (sNum === 13) {
      console.log(`\n--- Section 13 (Total Rows: ${rows.length}) ---`);
      rows.forEach((r, idx) => {
        console.log(`  Row ${idx}: [${r.join(' | ')}]`);
      });
    } else if (sNum === 14) {
      console.log(`\n--- Section 14 (Total Rows: ${rows.length}) ---`);
      rows.forEach((r, idx) => {
        console.log(`  Row ${idx}: [${r.join(' | ')}]`);
      });
    } else if (sNum === 15) {
      console.log(`\n--- Section 15 (Total Rows: ${rows.length}) ---`);
      rows.forEach((r, idx) => {
        console.log(`  Row ${idx}: [${r.join(' | ')}]`);
      });
    }
  }
}

async function run() {
  await auditFile('PA-3654 msds_CN 冠志.docx');
  await auditFile('PA-3654 msds_EN Guanzhi.docx');
  console.log('\n>>> All file inspections completed.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
