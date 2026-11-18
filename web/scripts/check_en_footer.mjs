import JSZip from 'jszip';
import fs from 'fs';

const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

async function checkEnFooter() {
  const zip = await JSZip.loadAsync(fs.readFileSync(enDocx));
  const xml = await zip.file('word/footer1.xml').async('text');
  console.log('=== EN footer1.xml ===');
  const ps = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  for (const p of ps) {
    console.log('P:', p);
  }
}

checkEnFooter().catch(console.error);
