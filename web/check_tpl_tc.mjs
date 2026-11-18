import fs from 'node:fs/promises';
import JSZip from 'jszip';

async function checkTplS2Tc() {
  const tplBuf = await fs.readFile('public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplZip = await JSZip.loadAsync(tplBuf);
  const xml = await tplZip.file('word/document.xml').async('text');

  const s2Idx = xml.indexOf('2.危险性概述');
  const tblStart = xml.lastIndexOf('<w:tbl', s2Idx);
  const tblEnd = xml.indexOf('</w:tbl>', s2Idx) + 8;
  const tblXml = xml.substring(tblStart, tblEnd);

  const trRegex = /<w:tr[\s>].*?<\/w:tr>/gs;
  const trs = tblXml.match(trRegex) || [];
  trs.forEach((tr, i) => {
    const tc1 = (tr.match(/<w:tc[\s>].*?<\/w:tc>/gs) || [])[0];
    const pPr = tc1 ? tc1.match(/<w:pPr>.*?<\/w:pPr>/s) : null;
    const text = tc1 ? tc1.replace(/<[^>]+>/g, '').trim() : '';
    console.log(`TPL TR ${i} [${text}]:\n  pPr: ${pPr ? pPr[0] : 'NONE'}\n`);
  });
}
checkTplS2Tc();
