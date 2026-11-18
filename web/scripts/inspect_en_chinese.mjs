import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

async function main() {
  const p = process.argv[2] || "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx";
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml").async("text");

  const paragraphs = xml.split(/<\/w:p>/);
  for (let i = 0; i <= 10; i++) {
    console.log(`P[${i}]: ${paragraphs[i].replace(/<[^>]+>/g, '').trim()}`);
  }
  paragraphs.forEach((p, idx) => {
    const text = p.replace(/<[^>]+>/g, '').trim();
    const cnMatches = text.match(/[\u4e00-\u9fa5]+/g);
    if (cnMatches) {
      const nonFont = cnMatches.filter(m => m !== '宋体');
      if (nonFont.length > 0) {
        console.log(`[P ${idx}] Non-font Chinese matches: ${nonFont.join(', ')}`);
        console.log(`Text: ${text}\n---`);
      }
    }
  });
}

main().catch(console.error);
