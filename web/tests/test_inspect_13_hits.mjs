import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildEnglishFacts, standardizeEnglishTypographyAndLabels } from '../src/pipeline-engine.js';
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const modelCode = 'OS-9547 PGDA80';
const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourceDocxPath);
const baseCnEngine = await loadDocx(buf, 'cn.docx');

// We can run the exact buildBaseEnglishEngine steps without assertZeroChinese to see all 13 hits!
// Let's import buildBaseEnglishEngine source or mock assertZeroChinese
