import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function scanTemplate(filePath, name) {
  console.log(`\n================== SCANNING ${name} ==================`);
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  for (let i = 0; i < tbls.length; i++) {
    const rows = tbls[i].getElementsByTagName('w:tr');
    if (rows.length === 0) continue;
    const headerRow = rows[0].textContent.replace(/\s+/g, ' ').trim();
    console.log(`\n--- Table ${i}: "${headerRow.slice(0, 40)}" ---`);
    for (let r = 0; r < Math.min(rows.length, 3); r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      for (let c = 0; c < Math.min(cells.length, 2); c++) {
        const p = cells[c].getElementsByTagName('w:p')[0];
        const pPr = p?.getElementsByTagName('w:pPr')[0];
        const ind = pPr?.getElementsByTagName('w:ind')[0];
        const spacing = pPr?.getElementsByTagName('w:spacing')[0];
        const runs = Array.from(cells[c].getElementsByTagName('w:r'));
        const runInfos = runs.map(r => {
          const t = r.getElementsByTagName('w:t')[0]?.textContent || '';
          const sz = r.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
          const b = r.getElementsByTagName('w:b').length > 0;
          const rFonts = r.getElementsByTagName('w:rFonts')[0];
          const font = rFonts?.getAttribute('w:hAnsi') || rFonts?.getAttribute('w:ascii') || rFonts?.getAttribute('w:eastAsia') || 'default';
          return `[t="${t.slice(0, 15)}" sz=${sz} b=${b} font=${font}]`;
        }).join(' ');
        const indStr = ind ? `ind(l=${ind.getAttribute('w:left')},h=${ind.getAttribute('w:hanging')})` : 'no-ind';
        const spStr = spacing ? `sp(line=${spacing.getAttribute('w:line')})` : 'no-sp';
        console.log(`  Row ${r} Cell ${c} (${c === 0 ? 'Label' : 'Value'}): ${indStr} ${spStr} | ${runInfos}`);
      }
    }
  }
}

async function run() {
  await scanTemplate('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx', '中文正式模板');
  await scanTemplate('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx', '英文正式模板');
}
run();
