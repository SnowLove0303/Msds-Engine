import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { buildDynamicSection14Table } = await import('../src/pipeline-engine.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourcePath);
const srcEngine = await loadDocx(buf);

const facts = {
  modelCode: 'EP-1404',
  isHazardous: true
};

const tplBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
const engine = await loadDocx(tplBuf);

buildDynamicSection14Table(engine, srcEngine, null, false, facts);

const s14 = engine.records.find(r => r.sectionNumber === 14);
console.log('Target s14 rows:', s14.rows.length);
s14.rows.forEach((r, idx) => {
  console.log(`Row ${idx+1}: [${r.cells[0]?.text.trim()}] => [${r.cells[1]?.text.trim()}]`);
});
