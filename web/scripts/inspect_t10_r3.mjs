import fs from 'node:fs/promises';
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
  for (const tbl of tbls) {
    if (tbl.textContent.includes('毒性资料')) {
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      [3, 4].forEach(r => {
        const c0 = trs[r].getElementsByTagNameNS(W_NS, 'tc')[0];
        console.log(`Row ${r} c0 XML:`, c0 ? c0.outerHTML : 'null');
      });
    }
  }
}
main();
