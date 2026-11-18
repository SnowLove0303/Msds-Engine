import JSZip from 'jszip';
import fs from 'fs';

async function findSec2All(docxPath) {
  console.log('\n======================================================');
  console.log('=== SEARCH 2.1:', docxPath);
  console.log('======================================================');
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  let inSec2 = false;
  let pIdx = 0;
  while ((m = pRegex.exec(xml)) !== null) {
    const pContent = m[1];
    const rRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let rM;
    let texts = [];
    while ((rM = rRegex.exec(pContent)) !== null) {
      texts.push(rM[1]);
    }
    const txt = texts.join('');
    if (txt.includes('2.1') || txt.includes('2. 危险性概述') || txt.includes('2. Hazards identification')) {
      inSec2 = true;
    }
    if (inSec2) {
      const pPrM = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(pContent);
      const isBold = /<w:b\b/.test(pContent);
      console.log(`[P${pIdx}] (Bold=${isBold}) ${txt}`);
      console.log(`     pPr: ${pPrM ? pPrM[1] : 'none'}`);
      pIdx++;
      if (txt.includes('3.1') || (txt.includes('3.') && (txt.includes('成分') || txt.includes('Composition')))) {
        inSec2 = false;
        break;
      }
    }
  }
}

async function main() {
  await findSec2All('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx');
  await findSec2All('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx');
}

main().catch(console.error);
