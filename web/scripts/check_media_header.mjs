import JSZip from 'jszip';
import fs from 'fs';

const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

async function checkMedia() {
  const zip = await JSZip.loadAsync(fs.readFileSync(enDocx));
  const mediaNames = Object.keys(zip.files).filter(k => k.startsWith('word/media/') && !zip.files[k].dir);
  for (const m of mediaNames) {
    const buf = await zip.file(m).async('nodebuffer');
    const isPng = buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
    const isJpg = buf.slice(0, 2).toString('hex') === 'ffd8';
    console.log('Media:', m, 'size:', buf.length, 'isPng:', isPng, 'isJpg:', isJpg);
  }
}

checkMedia().catch(console.error);
