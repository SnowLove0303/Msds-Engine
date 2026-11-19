import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkTemplate(tplName) {
  const tplPath = `web/public/templates/${tplName}`;
  const data = fs.readFileSync(tplPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  console.log(`\n=== Template: ${tplName} ===`);
  const s15Tbl = tables[14];
  if (s15Tbl) {
    const rows = Array.from(s15Tbl.getElementsByTagName('w:tr'));
    console.log(`Table 15 has ${rows.length} rows:`);
    rows.forEach((r, i) => {
      const cells = Array.from(r.getElementsByTagName('w:tc'));
      const texts = cells.map(c => c.textContent.trim()).join(' | ');
      console.log(`  Row ${i}: "${texts}"`);
    });
  }
}

async function run() {
  await checkTemplate('正式模板_MSDS_CN_冠志(1).docx');
  await checkTemplate('正式模板_MSDS_EN_冠志(1).docx');
}

run();
