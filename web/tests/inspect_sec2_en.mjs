import JSZip from 'jszip';
import fs from 'fs';

async function checkSec2En(docxPath) {
  console.log('\n======================================================');
  console.log('=== EN DOCX:', docxPath);
  console.log('======================================================');
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const idxHaz = xml.indexOf('Hazards identification');
  const pos = idxHaz !== -1 ? idxHaz : 0;
  const slice = xml.substring(pos, pos + 5000);
  
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  let i = 0;
  while ((m = pRegex.exec(slice)) !== null) {
    const pContent = m[1];
    const pPrM = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(pContent);
    const pPr = pPrM ? pPrM[1].replace(/></g, '> <') : '';
    
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
    if (txt.includes('3. Composition') || txt.includes('Section 3')) break;
    if (txt.trim()) {
      console.log(`[P${i}] ${txt}`);
      console.log(`     pPr: ${pPr}`);
      i++;
    }
  }
}

async function main() {
  await checkSec2En('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx');
  await checkSec2En('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_EN Guanzhi.docx');
  await checkSec2En('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4780/PA-4780 msds_EN Guanzhi.docx');
}

main().catch(console.error);
