import fs from 'node:fs/promises';
import JSZip from 'jszip';

async function checkGTPPr() {
  const gtBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志 (手动调整）.docx');
  const gtZip = await JSZip.loadAsync(gtBuf);
  const xml = await gtZip.file('word/document.xml').async('text');

  const s2Idx = xml.indexOf('2.危险性概述');
  const tblStart = xml.lastIndexOf('<w:tbl', s2Idx);
  const tblEnd = xml.indexOf('</w:tbl>', s2Idx) + 8;
  const tblXml = xml.substring(tblStart, tblEnd);

  const trRegex = /<w:tr[\s>].*?<\/w:tr>/gs;
  const trs = tblXml.match(trRegex) || [];
  trs.forEach((tr, i) => {
    console.log(`\n--- ROW ${i} ---`);
    const tcRegex = /<w:tc[\s>].*?<\/w:tc>/gs;
    const tcs = tr.match(tcRegex) || [];
    tcs.forEach((tc, j) => {
      const pPrMatch = tc.match(/<w:pPr>.*?<\/w:pPr>/s);
      const tMatches = tc.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`  Col ${j} [${text}]:\n    ${pPrMatch ? pPrMatch[0] : 'NONE'}`);
    });
  });
}
checkGTPPr();
