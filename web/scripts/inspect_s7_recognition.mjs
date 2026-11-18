import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { matchDocument } from '../src/smart-matching.js';
import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx';
  const rec = await recognizeSourceDocx(p);
  console.log('Recognized Section 7:', rec.sections?.find(s => s.sectionNumber === 7));
  
  const buf = await fs.promises.readFile(p);
  const srcEngine = await loadDocx(buf);
  const tplBuf = await fs.promises.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/templates/active/MSDS_CN_冠志模板.docx');
  const tplEngine = await loadDocx(tplBuf);
  const match = matchDocument(srcEngine, tplEngine);
  const m7 = match.matchedSections?.find(s => s.sectionNumber === 7);
  console.log('Matched Section 7:', m7?.matchedRows);
}

main().catch(console.error);
