import { loadDocx } from '../src/docx-engine.js';
import { parseSection2FromSource } from '../src/pipeline-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx');
const eng = await loadDocx(buf);
const parsed = parseSection2FromSource(eng);
console.log('=== PARSED SECTION 2 FOR PA-4902 ===');
console.dir(parsed, { depth: null });
