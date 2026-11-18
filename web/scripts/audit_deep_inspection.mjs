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

const out = [];

function analyzeSection(secNum) {
  const srcSec = srcEngine.records.find(r => r.sectionNumber === secNum);
  const cnSec = cnEngine.records.find(r => r.sectionNumber === secNum);
  const enSec = enEngine.records.find(r => r.sectionNumber === secNum);

  out.push(`\n======================================================`);
  out.push(`ANALYSIS FOR SECTION ${secNum}`);
  out.push(`======================================================`);

  out.push(`--- [1] Source Content ---`);
  if (!srcSec) {
    out.push(`Source has NO Section ${secNum}!`);
  } else {
    srcSec.rows.forEach((r, idx) => {
      out.push(`  Row ${idx}: ${r.cells.map(c => c.text.replace(/\r?\n/g, ' ')).join(' | ')}`);
    });
  }

  out.push(`--- [2] CN Deliverable Content ---`);
  if (!cnSec) {
    out.push(`CN deliverable has NO Section ${secNum}!`);
  } else {
    cnSec.rows.forEach((r, idx) => {
      out.push(`  Row ${idx}: ${r.cells.map(c => c.text.replace(/\r?\n/g, ' ')).join(' | ')}`);
    });
  }

  out.push(`--- [3] EN Deliverable Content ---`);
  if (!enSec) {
    out.push(`EN deliverable has NO Section ${secNum}!`);
  } else {
    enSec.rows.forEach((r, idx) => {
      out.push(`  Row ${idx}: ${r.cells.map(c => c.text.replace(/\r?\n/g, ' ')).join(' | ')}`);
    });
  }
}

for (let i = 1; i <= 16; i++) {
  analyzeSection(i);
}

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/deep_inspection_out.txt', out.join('\n'), 'utf8');
console.log('Saved deep_inspection_out.txt as UTF-8, lines:', out.length);
