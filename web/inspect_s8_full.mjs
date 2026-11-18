import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx');
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
const t7 = tables[7]; // Section 8
const trs = Array.from(t7.getElementsByTagNameNS(W_NS, 'tr'));

console.log('=== Section 8 Table Rows Dump ===');
console.log('Total rows:', trs.length);
for (let r = 0; r < trs.length; r++) {
  const cells = Array.from(trs[r].getElementsByTagNameNS(W_NS, 'tc'));
  console.log(`\n--- Row ${r} (cells: ${cells.length}) ---`);
  for (let c = 0; c < cells.length; c++) {
    const cell = cells[c];
    const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
    for (let pIdx = 0; pIdx < ps.length; pIdx++) {
      const p = ps[pIdx];
      const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
      const runDetails = runs.map(r => {
        const t = Array.from(r.getElementsByTagNameNS(W_NS, 't')).map(x => x.textContent).join('');
        const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
        const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttributeNS(W_NS, 'val') || rPr?.getElementsByTagName('sz')[0]?.getAttribute('w:val');
        const b = rPr?.getElementsByTagNameNS(W_NS, 'b').length > 0;
        const font = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')[0]?.getAttributeNS(W_NS, 'ascii') || rPr?.getElementsByTagNameNS(W_NS, 'rFonts')[0]?.getAttributeNS(W_NS, 'eastAsia');
        return `[t="${t}", sz=${sz}, b=${b}, font=${font}]`;
      });
      console.log(`  Cell ${c} P ${pIdx}: ${runDetails.join(' ')}`);
    }
  }
}
