import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function inspectEnTemplate() {
  const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';
  const buf = fs.readFileSync(tplPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = dom.getElementsByTagName('w:tbl');
  const s11Tbl = tbls[10];
  const rows = s11Tbl.getElementsByTagName('w:tr');
  console.log(`En Template Table 10 (Section 11) rows: ${rows.length}`);
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    const rowTexts = Array.from(cells).map(c => 
      Array.from(c.getElementsByTagName('w:t')).map(t => t.textContent).join('').trim()
    );
    console.log(`  Row ${r}: [${rowTexts.join(' | ')}]`);
  }
}

inspectEnTemplate().catch(console.error);
