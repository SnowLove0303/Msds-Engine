import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();

async function main() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new dom.window.DOMParser().parseFromString(xml, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  console.log('Total tables:', tbls.length);
  for (let t = 0; t < tbls.length; t++) {
    const tbl = tbls[t];
    const headerText = tbl.getElementsByTagNameNS(W_NS, 'tr')[0]?.textContent?.trim()?.slice(0, 30) || '';
    const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (let r = 1; r < trs.length; r++) {
      const c0 = trs[r].getElementsByTagNameNS(W_NS, 'tc')[0];
      if (!c0) continue;
      const szs = Array.from(c0.getElementsByTagNameNS(W_NS, 'sz'));
      for (const sz of szs) {
        if (sz.getAttribute('w:val') === '21') {
          console.log(`Table ${t} ("${headerText}") Row ${r}: text="${c0.textContent.trim()}" has sz="21"!`);
        }
      }
    }
  }
}
main();
