import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkTemplateEn(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  let sec8 = tables[7]; // Table 8
  const rows = sec8.getElementsByTagName('w:tr');
  console.log(`=== EN Template Table 8 Rows: ${rows.length} ===`);
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    if (cells.length < 2) continue;
    const runs = cells[1].getElementsByTagName('w:r');
    const runInfo = [];
    for (let k = 0; k < runs.length; k++) {
      const rNode = runs[k];
      const rPr = rNode.getElementsByTagName('w:rPr')[0];
      const rFonts = rPr?.getElementsByTagName('w:rFonts')[0];
      const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
      const b = rPr?.getElementsByTagName('w:b').length > 0;
      const ascii = rFonts?.getAttribute('w:ascii');
      const t = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
      runInfo.push(`[${JSON.stringify(t)}: sz=${sz}, b=${b}, font=${ascii}]`);
    }
    console.log(`Row ${r+1} Label: ${cells[0].textContent.trim()} -> Value: ${runInfo.join(' ')}`);
  }
}

await checkTemplateEn('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
