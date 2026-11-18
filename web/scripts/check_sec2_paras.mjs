import JSZip from 'jszip';
import fs from 'fs';

const cnDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';
const srcDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

async function checkSec2Paras(file, label) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const xml = await zip.file('word/document.xml').async('text');
  console.log(`=== ${label} Section 2 Paragraphs ===`);
  const ps = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  let inSec2 = false;
  for (const p of ps) {
    const text = p.replace(/<[^>]+>/g, '').trim();
    if (text.includes('2.危险性概述') || text.includes('2.Hazards')) inSec2 = true;
    if (text.includes('3.成分') || text.includes('3.Composition')) inSec2 = false;
    if (inSec2) {
      const hasDrawing = p.includes('<w:drawing');
      console.log(`[${hasDrawing ? 'DRAWING' : 'TEXT'}] ${text}`);
    }
  }
}

async function run() {
  await checkSec2Paras(srcDocx, 'SRC');
  await checkSec2Paras(cnDocx, 'CN');
  await checkSec2Paras(enDocx, 'EN');
}

run().catch(console.error);
