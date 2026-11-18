import JSZip from 'jszip';
import fs from 'fs';

async function test() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const img = await zip.file('word/media/image1.png')?.async('nodebuffer');
  console.log('image1 size:', img?.length);
  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/src_image1.png', img);
}
test();
