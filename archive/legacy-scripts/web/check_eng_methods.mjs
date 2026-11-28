import fs from 'fs';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const eng = await loadDocx(fs.readFileSync('算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx'));
console.log('Methods on eng:', Object.keys(eng));
console.log('Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(eng)));
if (typeof eng.export === 'function') console.log('eng.export exists');
if (typeof eng.toBuffer === 'function') console.log('eng.toBuffer exists');
if (typeof eng.save === 'function') console.log('eng.save exists');
if (typeof eng.generateDocx === 'function') console.log('eng.generateDocx exists');
