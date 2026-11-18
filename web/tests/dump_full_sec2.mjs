import JSZip from 'jszip';
import fs from 'fs';

async function dumpFullSec2(docxPath) {
  console.log('\n======================================================');
  console.log('=== FULL SEC2:', docxPath);
  console.log('======================================================');
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const idxHaz = xml.indexOf('危险性概述');
  const pos = idxHaz !== -1 ? idxHaz : 0;
  const slice = xml.substring(pos, pos + 10000);
  
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  let i = 0;
  while ((m = pRegex.exec(slice)) !== null) {
    const pContent = m[1];
    const pPrM = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(pContent);
    const pPr = pPrM ? pPrM[1] : '';
    
    const rRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
    let rM;
    let textParts = [];
    while ((rM = rRegex.exec(pContent)) !== null) {
      const rContent = rM[1];
      const isBold = /<w:b\b/.test(rContent);
      const tM = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/.exec(rContent);
      if (tM) {
        textParts.push((isBold ? '[B]' : '') + tM[1] + (isBold ? '[/B]' : ''));
      }
    }
    const txt = textParts.join('');
    if (txt.includes('3. 成分') || txt.includes('第3部分')) break;
    if (txt.trim()) {
      console.log(`[P${i}] ind: ${pPr.includes('w:ind') ? pPr.match(/<w:ind[^>]*\/>/)?.[0] : 'NONE'} | ${txt}`);
      i++;
    }
  }
}

async function main() {
  await dumpFullSec2('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx');
  await dumpFullSec2('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4780/PA-4780 msds_CN 冠志.docx');
}

main().catch(console.error);
