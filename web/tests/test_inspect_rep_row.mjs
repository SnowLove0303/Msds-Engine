import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine } from '../src/pipeline-engine.js';
import fs from 'fs';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const cnEngine = await buildBaseChineseEngine({
  modelCode: 'OS-9547 PGDA80',
  cnGroundTruthPath: sourceDocxPath
});

const cnS11 = cnEngine.records.find(r => r.sectionNumber === 11);
console.log('baseCnEngine S11 rows:');
cnS11.rows.forEach((r, idx) => console.log(`  Row ${idx}: ${r.cells[0]?.text}`));

const repRowInCn = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
console.log('repRowInCn:', repRowInCn);
