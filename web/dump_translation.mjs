import fs from 'fs/promises';
import JSZip from 'jszip';

async function extractDocxText() {
  const transDocxPath = 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608\\对照翻译.docx';
  const buf = await fs.readFile(transDocxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  // split by paragraph
  const paragraphs = [];
  const pRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gs;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const pXml = match[1];
    const text = pXml.replace(/<[^>]+>/g, '').trim();
    if (text) {
      paragraphs.push(text);
    }
  }
  
  console.log('Total paragraphs in 对照翻译.docx:', paragraphs.length);
  // print all
  paragraphs.forEach((p, idx) => {
    console.log(`[${idx}]: ${p}`);
  });
}

extractDocxText().catch(console.error);
