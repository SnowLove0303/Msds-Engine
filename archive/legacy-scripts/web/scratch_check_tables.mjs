import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const parser = new dom.window.DOMParser();

async function checkTemplate(templatePath) {
  const buf = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = parser.parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  console.log(`Template ${path.basename(templatePath)}: ${tbls.length} tables`);
  for (let i = 0; i < tbls.length; i++) {
    const trs = tbls[i].getElementsByTagName('w:tr');
    const t0 = trs[0]?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40);
    console.log(`  Tbl ${i+1}: ${t0} (${trs.length} rows)`);
  }
}

await checkTemplate('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
