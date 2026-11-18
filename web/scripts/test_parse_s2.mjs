import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { parseSection2FromSource } = await import('../src/pipeline-engine.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';
const buf = fs.readFileSync(sourcePath);
const srcEngine = await loadDocx(buf);

const res = parseSection2FromSource(srcEngine);
console.log('Result of parseSection2FromSource:', JSON.stringify(res, null, 2));
