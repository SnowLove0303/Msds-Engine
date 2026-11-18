import JSZip from 'jszip';
import fs from 'fs';
import { JSDOM } from 'jsdom';

async function checkDrawings(p, label) {
  const data = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const drawings = Array.from(dom.window.document.getElementsByTagName('w:drawing'));
  console.log(`=== ${label} ===`);
  console.log('Total drawings in document.xml:', drawings.length);
  
  // check which table / cell each drawing belongs to
  drawings.forEach((d, idx) => {
    let parent = d.parentNode;
    let path = [];
    while (parent) {
      if (parent.nodeName === 'w:tc' || parent.nodeName === 'w:tbl') {
        path.push(parent.nodeName);
      }
      parent = parent.parentNode;
    }
    console.log(`Drawing ${idx} parent path:`, path.reverse().join(' -> '));
  });

  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  console.log('Media files in zip:', mediaFiles);
}

async function run() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
  const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
  const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx';

  await checkDrawings(srcPath, 'SRC');
  await checkDrawings(cnPath, 'CN Deliverable');
  await checkDrawings(enPath, 'EN Deliverable');
}

run().catch(console.error);
