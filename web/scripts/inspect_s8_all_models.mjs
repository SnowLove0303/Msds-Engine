import fs from 'fs';
import path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

async function inspectDocS8(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`[NOT FOUND] ${label}: ${filePath}`);
    return;
  }
  try {
    const engine = await loadDocx(fs.readFileSync(filePath));
    const s8 = engine.records.find(r => r.sectionNumber === 8);
    console.log(`\n=================== ${label} ===================`);
    console.log(`Path: ${filePath}`);
    if (!s8) {
      console.log('No Section 8 found!');
      return;
    }
    console.log(`S8 rows: ${s8.rows.length}`);
    s8.rows.forEach((r, idx) => {
      const cellsInfo = r.cells.map(c => {
        const p = c.paragraphs?.[0];
        const isBold = Boolean(c.labelText || p?.runs?.some(run => run.bold));
        const tcPr = c.node?.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tcPr')?.[0];
        const gridSpan = tcPr?.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'gridSpan')?.[0]?.getAttribute('w:val') || '1';
        return `[Cell ${c.col}: text="${c.text.replace(/\r?\n/g, ' ')}" (bold=${isBold}, gridSpan=${gridSpan})]`;
      });
      console.log(`  Row ${idx}: ${cellsInfo.join(' | ')}`);
    });
  } catch (e) {
    console.log(`Error reading ${label}: ${e.message}`);
  }
}

// 1. EC-1804 source
await inspectDocS8('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx', 'EC-1804 SOURCE');

// 2. EC-1804 CN deliverable
await inspectDocS8('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx', 'EC-1804 CN DELIVERABLE');

// 3. Official CN Template
await inspectDocS8('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx', 'OFFICIAL CN TEMPLATE');

// 4. Find other models' Section 8
const searchDirs = [
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版'
];

for (const d of searchDirs) {
  if (!fs.existsSync(d)) continue;
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.isDirectory()) {
      const sub = path.join(d, ent.name);
      const subFiles = fs.readdirSync(sub, { withFileTypes: true });
      for (const f of subFiles) {
        if (f.isFile() && f.name.includes('msds_CN') && f.name.endsWith('.docx') && !f.name.includes('EC-1804')) {
          await inspectDocS8(path.join(sub, f.name), `OTHER MODEL: ${f.name}`);
          break;
        } else if (f.isDirectory()) {
          const subSubFiles = fs.readdirSync(path.join(sub, f.name));
          for (const ff of subSubFiles) {
            if (ff.includes('msds_CN') && ff.endsWith('.docx') && !ff.includes('EC-1804')) {
              await inspectDocS8(path.join(sub, f.name, ff), `OTHER MODEL: ${ff}`);
              break;
            }
          }
        }
      }
    }
  }
}
