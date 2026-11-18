import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine } from '../src/pipeline-engine.js';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

const baseCnEngine = await buildBaseChineseEngine({
  modelCode: 'OS-9547 PGDA80',
  cnGroundTruthPath: sourceDocxPath,
  facts: {}
});

const s12 = baseCnEngine.records.find(r => r.sectionNumber === 12);
console.log('baseCnEngine S12 rows count:', s12?.rows?.length);
s12?.rows?.forEach((r, idx) => {
  console.log(`baseCnEngine S12 Row ${idx} (cells=${r.cells.length}):`, r.cells.map(c => c.text || '').join(' | '));
});
