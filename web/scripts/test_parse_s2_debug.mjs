import fs from 'fs';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';
import { parseSection2FromSource } from '../src/pipeline-engine.js';

async function testParseS2() {
  const p4840Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx';
  const p4902Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';

  const e4840 = await loadDocx(fs.readFileSync(p4840Src));
  const e4902 = await loadDocx(fs.readFileSync(p4902Src));

  const parsed4840 = parseSection2FromSource(e4840);
  const parsed4902 = parseSection2FromSource(e4902);

  console.log('--- PARSED 4840 S2 ---');
  console.log('isNonHazardous:', parsed4840.isNonHazardous);
  console.log('categories:', parsed4840.categories);
  console.log('hazardousIngredients:', parsed4840.hazardousIngredients);
  console.log('hazardStatements:', parsed4840.hazardStatements);
  console.log('prevention:', parsed4840.prevention);
  console.log('disposal:', parsed4840.disposal);

  console.log('\n--- PARSED 4902 S2 ---');
  console.log('isNonHazardous:', parsed4902.isNonHazardous);
  console.log('signalWord:', parsed4902.signalWord);
  console.log('categories:', parsed4902.categories);
  console.log('hazardStatements:', parsed4902.hazardStatements);
  console.log('prevention:', parsed4902.prevention);
  console.log('response:', parsed4902.response);
  console.log('storage:', parsed4902.storage);
  console.log('disposal:', parsed4902.disposal);
  console.log('otherHazards:', parsed4902.otherHazards);
}

testParseS2().catch(console.error);
