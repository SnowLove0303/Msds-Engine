import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx';
const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';

async function dumpTable(docxPath, label) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;
  
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  console.log(`=== ${label} TABLES: ${tables.length} ===`);
  tables.forEach((tbl, tIdx) => {
    const rows = Array.from(tbl.getElementsByTagName('w:tr'));
    rows.forEach((tr, rIdx) => {
      const cells = Array.from(tr.childNodes).filter(n => n.nodeName === 'w:tc');
      const cellTexts = cells.map(tc => {
        const ps = Array.from(tc.getElementsByTagName('w:p'));
        return ps.map(p => {
          return Array.from(p.getElementsByTagName('w:t')).map(t => t.textContent).join('');
        }).join(' [P] ');
      });
      console.log(`T${tIdx} R${rIdx}: ${cellTexts.join(' || ')}`);
    });
  });
}

async function run() {
  await dumpTable(cnPath, 'CN');
  await dumpTable(enPath, 'EN');
}

run().catch(console.error);
