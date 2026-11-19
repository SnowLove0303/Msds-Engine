import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectDocx(name, filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[NOT FOUND] ${filePath}`);
    return;
  }
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  console.log(`\n============================================================`);
  console.log(`File: ${name} (${data.length} bytes, ${tables.length} tables)`);
  console.log(`Path: ${filePath}`);
  console.log(`============================================================`);

  // Check Table 1 (Section 2)
  if (tables[1]) {
    const rows = Array.from(tables[1].getElementsByTagName('w:tr'));
    console.log(`--- Section 2: ${rows.length} rows ---`);
    rows.forEach((r, i) => {
      const cells = Array.from(r.getElementsByTagName('w:tc'));
      const gridSpans = cells.map(c => {
        const gs = c.getElementsByTagName('w:gridSpan')[0];
        return gs ? gs.getAttribute('w:val') : '1';
      });
      const texts = cells.map(c => c.textContent.trim().slice(0, 30));
      console.log(`  Row ${i}: cells=${cells.length} gridSpan=[${gridSpans.join(',')}] text="${texts.join(' | ')}"`);
    });
  }

  // Check Table 7 (Section 8)
  if (tables[7]) {
    const rows = Array.from(tables[7].getElementsByTagName('w:tr'));
    console.log(`--- Section 8: ${rows.length} rows ---`);
    rows.forEach((r, i) => {
      const cells = Array.from(r.getElementsByTagName('w:tc'));
      const texts = cells.map(c => c.textContent.trim().slice(0, 25));
      console.log(`  Row ${i}: cells=${cells.length} text="${texts.join(' | ')}"`);
    });
  }
}

async function run() {
  await inspectDocx(
    'PA-3654 (Current Canonical Pipeline)',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 msds_CN 冠志.docx'
  );

  await inspectDocx(
    'PA-4914 (Python Hack Pipeline)',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx'
  );

  await inspectDocx(
    'EP-1501 (Direct EP-1501 Folder)',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1501/EP-1501 msds_CN 冠志.docx'
  );

  await inspectDocx(
    'EP-1501 (测试产出 Folder)',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1501/测试产出/EP-1501 msds_CN 冠志.docx'
  );
}

run();
