import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkSection11Template() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  // Section 11 table is index 10
  const s11 = tbls[10];
  const trs = s11.getElementsByTagName('w:tr');
  console.log(`Total rows in Section 11 template: ${trs.length}`);
  for (let r = 0; r < trs.length; r++) {
    const cells = trs[r].getElementsByTagName('w:tc');
    const cellTexts = Array.from(cells).map((c, i) => {
      const tcPr = c.getElementsByTagName('w:tcPr')[0];
      const tcW = tcPr?.getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
      const gridSpan = tcPr?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
      const vMerge = tcPr?.getElementsByTagName('w:vMerge')[0]?.getAttribute('w:val') || (tcPr?.getElementsByTagName('w:vMerge').length > 0 ? 'continue' : 'none');
      const txt = c.textContent.replace(/\s+/g, ' ').trim();
      return `[C${i} w=${tcW} span=${gridSpan} vMerge=${vMerge} text="${txt}"]`;
    }).join(' ');
    console.log(`Row ${r}: ${cellTexts}`);
  }
}
checkSection11Template();
