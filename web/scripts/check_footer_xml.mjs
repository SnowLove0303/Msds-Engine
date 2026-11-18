import JSZip from 'jszip';
import fs from 'fs';

const cnDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

async function checkFooter(file, label) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (const name of Object.keys(zip.files)) {
    if (name.includes('footer')) {
      const xml = await zip.file(name).async('text');
      console.log(`=== ${label} ${name} ===\n`, xml);
    }
  }
}

async function run() {
  await checkFooter(cnDocx, 'CN');
  await checkFooter(enDocx, 'EN');
}

run().catch(console.error);
