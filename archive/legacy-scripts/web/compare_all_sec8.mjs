import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function extractSec8Details(docxPath, label) {
  if (!fs.existsSync(docxPath)) return `[${label}] File not found: ${docxPath}`;
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  let sec8 = null;
  for (let i = 0; i < tables.length; i++) {
    if (tables[i].textContent.includes('接触控制') || tables[i].textContent.includes('Exposure control')) {
      sec8 = tables[i];
      break;
    }
  }
  if (!sec8) return `[${label}] Section 8 table not found`;
  
  const rows = sec8.getElementsByTagName('w:tr');
  const out = [`=== ${label} (Rows: ${rows.length}) ===`];
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    const rowTexts = [];
    for (let c = 0; c < cells.length; c++) {
      const runs = cells[c].getElementsByTagName('w:t');
      let txt = '';
      for (let k = 0; k < runs.length; k++) txt += runs[k].textContent;
      rowTexts.push(txt);
    }
    out.push(`  Row ${r+1}: ${rowTexts.map(t => JSON.stringify(t)).join('  |  ')}`);
  }
  return out.join('\n');
}

async function run() {
  const tplCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const tplEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';
  const src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
  const genCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
  const genEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx';

  console.log(await extractSec8Details(tplCn, '1. 官方标准中文模板 (Template CN)'));
  console.log('\n' + await extractSec8Details(tplEn, '2. 官方标准英文模板 (Template EN)'));
  console.log('\n' + await extractSec8Details(src, '3. EP-1736 原始输入源文件 (Source CN)'));
  console.log('\n' + await extractSec8Details(genCn, '4. 当前生成的 EP-1736 中文交付物 (Generated CN)'));
  console.log('\n' + await extractSec8Details(genEn, '5. 当前生成的 EP-1736 英文交付物 (Generated EN)'));
}

run().catch(console.error);
