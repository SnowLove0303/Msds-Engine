import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkOtherTable8() {
  const files = [
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8123/BL-8123 msds_CN 冠志.docx'
  ];

  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const zip = await JSZip.loadAsync(fs.readFileSync(f));
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const tbl = doc.getElementsByTagName('w:tbl')[7];
    console.log(`\n=== ${f.split('/').pop()} Table 8 ===`);
    const rows = tbl.getElementsByTagName('w:tr');
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      const texts = [];
      for (let c = 0; c < cells.length; c++) {
        const span = cells[c].getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
        const b = cells[c].getElementsByTagName('w:b').length > 0;
        texts.push(`C${c}(span:${span||1},b:${b}): [${cells[c].textContent.trim().replace(/\r?\n/g, ' ')}]`);
      }
      console.log(`  Row ${r}: ${texts.join(' | ')}`);
    }
  }
}
checkOtherTable8().catch(console.error);
