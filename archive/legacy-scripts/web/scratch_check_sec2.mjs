import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const parser = new dom.window.DOMParser();
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970';

async function checkSec2(filename) {
  const filePath = path.join(baseDir, filename);
  console.log(`\n=================== Section 2 of ${filename} ===================`);
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = parser.parseFromString(xml, 'application/xml');

  const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const s2 = tbls[1];
  const trs = Array.from(s2.getElementsByTagNameNS(W_NS, 'tr'));
  trs.forEach((tr, rIdx) => {
    console.log(`Row ${rIdx}:`);
    const ps = Array.from(tr.getElementsByTagNameNS(W_NS, 'p'));
    ps.forEach((p, pIdx) => {
      const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
      const runInfo = runs.map(r => {
        const text = r.textContent || '';
        const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
        const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val') || 'none';
        const b = Boolean(rPr?.getElementsByTagNameNS(W_NS, 'b')[0]);
        return `[b=${b}, sz=${sz}: "${text}"]`;
      }).join(' ');
      console.log(`  P${pIdx}: ${runInfo}`);
    });
  });
}

checkSec2('OS-8970 msds_CN 冠志.docx');
checkSec2('OS-8970 msds_EN Guanzhi.docx');
