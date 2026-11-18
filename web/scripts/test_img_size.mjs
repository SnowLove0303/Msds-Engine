import JSZip from 'jszip';
import fs from 'fs';

async function test() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/') && !zip.files[f].dir);
  console.log('CN media files:', mediaFiles);
  for (const f of mediaFiles) {
    const buf = await zip.file(f).async('nodebuffer');
    console.log(f, 'size:', buf.length);
    fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/cn_' + f.split('/').pop(), buf);
  }
}
test();
