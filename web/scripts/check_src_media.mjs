import JSZip from 'jszip';
import fs from 'fs';

const srcDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

async function checkSrcMedia() {
  const zip = await JSZip.loadAsync(fs.readFileSync(srcDocx));
  const media = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  console.log('Source media files:', media);
  for (const m of media) {
    const data = await zip.file(m).async('nodebuffer');
    console.log(m, data.length, 'bytes');
  }
}

checkSrcMedia().catch(console.error);
