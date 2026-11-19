import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkDocx(filePath) {
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  // Count page breaks
  const brs = Array.from(doc.getElementsByTagName('w:br'));
  const pageBrs = brs.filter(b => b.getAttribute('w:type') === 'page');
  console.log(`Explicit <w:br w:type="page"/> count: ${pageBrs.length}`);

  const pageBreakBefores = Array.from(doc.getElementsByTagName('w:pageBreakBefore'));
  console.log(`Explicit <w:pageBreakBefore/> count: ${pageBreakBefores.length}`);

  // Count cantSplit in tables
  const cantSplits = Array.from(doc.getElementsByTagName('w:cantSplit'));
  console.log(`<w:cantSplit/> count: ${cantSplits.length}`);

  // Check section properties
  const sectPrs = Array.from(doc.getElementsByTagName('w:sectPr'));
  console.log(`<w:sectPr/> count: ${sectPrs.length}`);
}

console.log("=== PA-4914 DOCX ===");
await checkDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx');

console.log("\n=== PA-3654 DOCX ===");
await checkDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 msds_CN 冠志.docx');
