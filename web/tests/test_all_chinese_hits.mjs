import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildFullWidthSection2, parseSection2FromSource } from '../src/pipeline-engine.js';
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourceDocxPath);
const baseCnEngine = await loadDocx(buf, 'cn.docx');

const tplBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
const engine = await loadDocx(tplBuf, 'test.docx');

const cnPicCell = baseCnEngine?.records?.find(r => r.sectionNumber === 2)?.rows[1]?.cells[0];
const drawingNodes = Array.from(cnPicCell?.node?.getElementsByTagNameNS('*', 'drawing') || []);

buildFullWidthSection2(engine, {
  modelCode: 'OS-9547 PGDA80',
  drawingNodes,
  srcEngine: baseCnEngine
}, true);

const xmlDoc = engine.documentXml;
const tNodes = xmlDoc.getElementsByTagName('w:t');
const hits = [];
for (let i = 0; i < tNodes.length; i++) {
  const txt = (tNodes[i].textContent || '').trim();
  if (/[\u4e00-\u9fa5]/.test(txt)) {
    hits.push(txt);
  }
}

console.log('Total hits:', hits.length);
hits.forEach((h, idx) => console.log(`${idx + 1}: ${h}`));
