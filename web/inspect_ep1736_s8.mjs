import fs from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

const docxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
const eng = await loadDocx(fs.readFileSync(docxPath));

const s8 = eng.records.find(r => r.sectionNumber === 8);
const row6 = s8.rows[5]; // Row 6
console.log('Row 6 cell 0 XML:');
console.log(new globalThis.XMLSerializer().serializeToString(row6.cells[0].node));
