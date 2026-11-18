import JSZip from 'jszip';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

async function dumpRowXml(filePath, rowIndex, label) {
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s9 = tbls[8];
  const tr = s9.getElementsByTagName('w:tr')[rowIndex];
  const tc = tr.getElementsByTagName('w:tc')[0];
  console.log(`\n--- ${label} (Row ${rowIndex}) XML ---`);
  console.log(new (new JSDOM()).window.XMLSerializer().serializeToString(tc));
}

async function main() {
  await dumpRowXml('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx', 1, 'PU-202A CN Row 1');
  await dumpRowXml('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx', 10, 'PU-202A CN Row 10');
  await dumpRowXml('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.docx', 1, 'PU-202A EN Row 1');
  await dumpRowXml('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.docx', 10, 'PU-202A EN Row 10');
}

main().catch(console.error);
