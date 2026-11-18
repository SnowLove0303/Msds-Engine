import fs from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';

const srcEngine = await loadDocx(fs.readFileSync(srcPath));
const cnEngine = await loadDocx(fs.readFileSync(cnPath));
const enEngine = await loadDocx(fs.readFileSync(enPath));

console.log('=== SOURCE DOCUMENT SECTIONS ===');
srcEngine.records.forEach(r => {
  if (r.kind === 'table') {
    console.log(`\n--- SRC Section ${r.sectionNumber} (rows: ${r.rows.length}) ---`);
    r.rows.forEach((row, idx) => {
      console.log(`  [R${idx}] ${row.cells.map(c => c.text.replace(/\r?\n/g, '\\n')).join(' | ')}`);
    });
  }
});

console.log('\n=== CN DELIVERABLE SECTIONS ===');
cnEngine.records.forEach(r => {
  if (r.kind === 'table') {
    console.log(`\n--- CN Section ${r.sectionNumber} (rows: ${r.rows.length}) ---`);
    r.rows.forEach((row, idx) => {
      console.log(`  [R${idx}] ${row.cells.map(c => c.text.replace(/\r?\n/g, '\\n')).join(' | ')}`);
    });
  }
});

console.log('\n=== EN DELIVERABLE SECTIONS ===');
enEngine.records.forEach(r => {
  if (r.kind === 'table') {
    console.log(`\n--- EN Section ${r.sectionNumber} (rows: ${r.rows.length}) ---`);
    r.rows.forEach((row, idx) => {
      console.log(`  [R${idx}] ${row.cells.map(c => c.text.replace(/\r?\n/g, '\\n')).join(' | ')}`);
    });
  }
});
