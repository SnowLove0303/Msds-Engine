import JSZip from 'jszip';
import fs from 'fs';

const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

async function checkPic() {
  const zip = await JSZip.loadAsync(fs.readFileSync(enDocx));
  const xml = await zip.file('word/document.xml').async('text');
  
  // Search for any chinese characters in enDocx
  const chineseChars = xml.match(/[\u4e00-\u9fa5]+/g);
  console.log('Chinese characters in EN DOCX:', chineseChars);

  // Search for media / images in zip
  const media = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  console.log('Media files in EN DOCX:', media);
}

checkPic().catch(console.error);
