import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx';

async function inspectS11SourceParas() {
  const buf = fs.readFileSync(srcPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  const s11 = tables[10];
  const s11Rows = s11.getElementsByTagName('w:tr');
  console.log('Total rows in Source S11:', s11Rows.length);
  for (let r = 0; r < s11Rows.length; r++) {
    const row = s11Rows[r];
    const cells = row.getElementsByTagName('w:tc');
    console.log(`Row ${r} (${cells.length} cells):`);
    for (let c = 0; c < cells.length; c++) {
      const pText = Array.from(cells[c].getElementsByTagName('w:p')).map(p => p.textContent.trim()).filter(Boolean).join(' // ');
      console.log(`  Col ${c}: ${pText.slice(0, 100)}`);
    }
  }
}

inspectS11SourceParas();
