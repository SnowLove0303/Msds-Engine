import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx';
const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';

async function extractSections(docxPath) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;
  
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  const lines = [];

  for (const tbl of tables) {
    const rows = Array.from(tbl.getElementsByTagName('w:tr'));
    for (const tr of rows) {
      // Direct cells of this row
      const cells = [];
      for (const child of tr.childNodes) {
        if (child.nodeName === 'w:tc') {
          const texts = Array.from(child.getElementsByTagName('w:t')).map(t => t.textContent).join('');
          cells.push(texts.trim());
        }
      }
      if (cells.some(c => c)) {
        lines.push('[CELLS] ' + cells.join(' || '));
      }
    }
  }
  return lines;
}

async function run() {
  const srcLines = await extractSections(srcPath);
  const enLines = await extractSections(enPath);
  const cnLines = await extractSections(cnPath);

  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/src_lines.txt', srcLines.join('\n'), 'utf8');
  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/en_lines.txt', enLines.join('\n'), 'utf8');
  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/cn_lines.txt', cnLines.join('\n'), 'utf8');

  console.log('src lines:', srcLines.length);
  console.log('en lines:', enLines.length);
  console.log('cn lines:', cnLines.length);
}

run().catch(console.error);
