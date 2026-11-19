import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkDocx(fileName) {
  const filePath = `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654/${fileName}`;
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
      console.log(`  Row ${i}: "${cells[0]?.textContent}"`);
    });
  }
}

async function run() {
  await checkDocx('PA-3654 msds_CN 国彩.docx');
  await checkDocx('PA-3654 msds_EN Guocai.docx');
}

run();
