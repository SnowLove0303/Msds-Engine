import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
const buf = fs.readFileSync(srcPath);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
const s14Tbl = tbls[13];
const trs = Array.from(s14Tbl.getElementsByTagName('w:tr'));

for (let r = 0; r < trs.length; r++) {
  console.log(`\n--- TR ${r} ---`);
  const tcs = Array.from(trs[r].getElementsByTagName('w:tc'));
  for (let c = 0; c < tcs.length; c++) {
    const ps = Array.from(tcs[c].getElementsByTagName('w:p'));
    console.log(`  TC ${c} (${ps.length} ps):`);
    ps.forEach((p, pi) => {
      console.log(`    p${pi}: "${(p.textContent || '').trim()}"`);
    });
  }
}
