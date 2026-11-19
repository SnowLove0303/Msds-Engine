import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkDocx(fileName) {
  const filePath = `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654/${fileName}`;
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist: ' + filePath);
    return;
  }
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  console.log(`\n=== File: ${fileName} ===`);
  const s15Tbl = tables[14];
  if (s15Tbl) {
    const rows = Array.from(s15Tbl.getElementsByTagName('w:tr'));
    console.log(`Table 15 has ${rows.length} rows:`);
    rows.forEach((r, i) => {
      const cells = Array.from(r.getElementsByTagName('w:tc'));
      cells.forEach((c, ci) => {
        const pList = Array.from(c.getElementsByTagName('w:p'));
        pList.forEach(p => {
          const runs = Array.from(p.getElementsByTagName('w:r'));
          const rTexts = runs.map(r => r.textContent);
          console.log(`  Row ${i} Cell ${ci}: text="${p.textContent}" runs=${JSON.stringify(rTexts)}`);
        });
      });
    });
  }
}

async function run() {
  await checkDocx('PA-3654 msds_CN 冠志.docx');
  await checkDocx('PA-3654 msds_EN Guanzhi.docx');
}

run();
