import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkOtherProductsSec2() {
  const files = [
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx'
  ];
  
  // also check other products if they exist
  const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版';
  const dirs = fs.readdirSync(baseDir);
  console.log('Dirs in TDS MSDS 重写版:', dirs);

  for (const d of dirs) {
    const p = `${baseDir}/${d}`;
    if (fs.statSync(p).isDirectory()) {
      const sub = fs.readdirSync(p);
      for (const s of sub) {
        const sp = `${p}/${s}`;
        if (fs.statSync(sp).isDirectory()) {
          const docxFiles = fs.readdirSync(sp).filter(f => f.endsWith('.docx') && f.includes('CN'));
          if (docxFiles.length > 0) {
            const fPath = `${sp}/${docxFiles[0]}`;
            const zip = await JSZip.loadAsync(fs.readFileSync(fPath));
            const xml = await zip.file('word/document.xml').async('string');
            const doc = new DOMParser().parseFromString(xml, 'text/xml');
            const tbl1 = doc.getElementsByTagName('w:tbl')[1];
            console.log(`${s}: Tbl 1 rows = ${tbl1 ? tbl1.getElementsByTagName('w:tr').length : 'N/A'}`);
          }
        }
      }
    }
  }
}

checkOtherProductsSec2().catch(console.error);
