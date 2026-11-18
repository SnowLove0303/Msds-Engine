import JSZip from 'jszip';
import fs from 'fs';

async function checkIngLabel(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  while ((m = pRegex.exec(xml)) !== null) {
    if (m[1].includes('必须列在标签上的有害成') || m[1].includes('Hazardous components')) {
      console.log('--- FOUND IN:', docxPath);
      console.log(m[1].replace(/></g, '>\n<'));
    }
  }
}

async function main() {
  await checkIngLabel('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4780/PA-4780 msds_CN 冠志.docx');
  await checkIngLabel('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx');
}

main().catch(console.error);
