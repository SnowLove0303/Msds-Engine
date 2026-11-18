import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { decoupleSection2CompoundBlocks } = await import('../src/smart-matching.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourcePath);
const srcEngine = await loadDocx(buf);
const s2 = srcEngine.records.find(r => r.sectionNumber === 2);
const cellText = s2.rows[1].cells[0].text;

console.log('CellText:\n', cellText);
const blocks = decoupleSection2CompoundBlocks(cellText);
console.log('\nDecoupled Blocks:\n', JSON.stringify(blocks, null, 2));
