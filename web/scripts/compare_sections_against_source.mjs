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

const findings = [];

for (let s = 1; s <= 16; s++) {
  const srcSec = srcEngine.records.find(r => r.sectionNumber === s);
  const cnSec = cnEngine.records.find(r => r.sectionNumber === s);
  const enSec = enEngine.records.find(r => r.sectionNumber === s);

  console.log(`\n=================== SECTION ${s} ===================`);
  console.log(`[SRC] rows: ${srcSec ? srcSec.rows.length : 0}`);
  if (srcSec) {
    srcSec.rows.forEach((r, idx) => {
      console.log(`  SRC R${idx}: ${JSON.stringify(r.cells.map(c => c.text.trim()))}`);
    });
  }
  console.log(`[CN] rows: ${cnSec ? cnSec.rows.length : 0}`);
  if (cnSec) {
    cnSec.rows.forEach((r, idx) => {
      console.log(`  CN R${idx}: ${JSON.stringify(r.cells.map(c => c.text.trim()))}`);
    });
  }
  console.log(`[EN] rows: ${enSec ? enSec.rows.length : 0}`);
  if (enSec) {
    enSec.rows.forEach((r, idx) => {
      console.log(`  EN R${idx}: ${JSON.stringify(r.cells.map(c => c.text.trim()))}`);
    });
  }
}
