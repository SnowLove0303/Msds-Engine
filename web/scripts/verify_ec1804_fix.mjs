import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';


const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function verifyDocx() {
  console.log('=== VERIFYING DOCX FILES ===');
  const cnGz = path.join(targetDir, 'EC-1804 msds_CN 冠志.docx');
  const enGz = path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx');

  // Check CN Table 8
  const cnZip = await JSZip.loadAsync(fs.readFileSync(cnGz));
  const cnXml = await cnZip.file('word/document.xml').async('string');
  const cnDoc = new DOMParser().parseFromString(cnXml, 'text/xml');
  const tbl8 = cnDoc.getElementsByTagName('w:tbl')[7];
  const rows = tbl8.getElementsByTagName('w:tr');

  console.log('--- CN Table 8 Value Cells Bold Check ---');
  let anyBoldInVal = false;
  for (let r = 2; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    if (cells.length > 1) {
      const c1Text = cells[1].textContent.trim();
      const bs = cells[1].getElementsByTagName('w:b');
      const isB = bs.length > 0;
      if (isB) anyBoldInVal = true;
      console.log(`Row ${r}: isBold=${isB}, text="${c1Text.slice(0, 30)}"`);
    }
  }
  console.log(`Any bold in CN Table 8 values? ${anyBoldInVal ? 'YES (FAIL)' : 'NO (PASS)'}`);

  // Check Row 3 Cell 0 indent
  const r3c0 = rows[3].getElementsByTagName('w:tc')[0];
  const ind = r3c0.getElementsByTagName('w:ind')[0];
  console.log(`Row 3 Cell 0 indent: ${ind ? ind.toString() : 'no-ind'}`);

  // Check EN P501
  const enZip = await JSZip.loadAsync(fs.readFileSync(enGz));
  const enXml = await enZip.file('word/document.xml').async('string');
  console.log(`EN P501 check:`);
  console.log(`  Contains approved waste disposal plant? ${enXml.includes('approved waste disposal plant')}`);
  console.log(`  Contains local regulations? ${enXml.includes('in accordance with local regulations')}`);
}

async function verifyPdfs() {
  console.log('\n=== VERIFYING PDF TIMESTAMPS & SIZES ===');
  const files = [
    'EC-1804 msds_CN 冠志.docx',
    'EC-1804 msds_CN 冠志.pdf',
    'EC-1804 msds_CN 国彩.docx',
    'EC-1804 msds_CN 国彩.pdf',
    'EC-1804 msds_EN Guanzhi.docx',
    'EC-1804 msds_EN Guanzhi.pdf',
    'EC-1804 msds_EN Guocai.docx',
    'EC-1804 msds_EN Guocai.pdf'
  ];

  for (const f of files) {
    const stat = fs.statSync(path.join(targetDir, f));
    console.log(`${f.padEnd(30)}: mtime=${stat.mtime.toISOString()}, size=${stat.size} bytes`);
  }
}

async function main() {
  await verifyDocx();
  await verifyPdfs();
}

main().catch(console.error);
