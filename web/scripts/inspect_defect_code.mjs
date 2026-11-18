import fs from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const engine = await loadDocx(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));
const s5 = engine.records.find(r => r.sectionNumber === 5);
s5.rows.forEach((r, idx) => {
  console.log(`R${idx}:`, JSON.stringify(r.cells[0]?.text), JSON.stringify(r.cells[1]?.text));
});
