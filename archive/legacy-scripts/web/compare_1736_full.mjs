import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736';
const cnDocxPath = path.join(targetDir, 'EP-1736 msds_CN 冠志.docx');
const enDocxPath = path.join(targetDir, 'EP-1736 msds_EN Guanzhi.docx');

async function dumpDocxTables(fp) {
  const buf = fs.readFileSync(fp);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  return tables.map((tbl, tIdx) => {
    const trs = Array.from(tbl.getElementsByTagName('w:tr'));
    return {
      tIdx,
      rows: trs.map((tr, rIdx) => {
        const tcs = Array.from(tr.getElementsByTagName('w:tc'));
        return tcs.map(tc => {
          const ps = Array.from(tc.getElementsByTagName('w:p'));
          return ps.map(p => (p.textContent || '').trim()).filter(Boolean).join('\n');
        });
      })
    };
  });
}

const cnTables = await dumpDocxTables(cnDocxPath);
const enTables = await dumpDocxTables(enDocxPath);

console.log('=== FULL SECTION 1~16 COMPARISON FOR EP-1736 ===\n');

for (let i = 0; i < Math.max(cnTables.length, enTables.length); i++) {
  const cnT = cnTables[i];
  const enT = enTables[i];
  console.log(`****************************************************************`);
  console.log(`TABLE ${i}: CN rows=${cnT?.rows?.length || 0}, EN rows=${enT?.rows?.length || 0}`);
  console.log(`****************************************************************`);
  const maxR = Math.max(cnT?.rows?.length || 0, enT?.rows?.length || 0);
  for (let r = 0; r < maxR; r++) {
    const cnRow = cnT?.rows?.[r] || [];
    const enRow = enT?.rows?.[r] || [];
    console.log(`-- Row ${r} --`);
    console.log(`  CN: ${JSON.stringify(cnRow)}`);
    console.log(`  EN: ${JSON.stringify(enRow)}`);
  }
}
