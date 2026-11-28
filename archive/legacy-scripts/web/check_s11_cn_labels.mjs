import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine } from './src/pipeline-engine.js';

async function test() {
  const cnGroundTruthPath = '算法训练材料/PU-202C/源文件留存/PU-202C msds_CN 冠志_源文件留存.docx';
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode: 'PU-202C',
    cnGroundTruthPath,
    facts: {}
  });

  const s11 = baseCnEngine.records.find(r => r.sectionNumber === 11);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx+1}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });
}

test().catch(e => console.error(e));
