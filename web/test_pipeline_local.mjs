import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine, buildBaseEnglishEngine } from './src/pipeline-engine.js';

async function testPipeline() {
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  console.log('Testing buildBaseChineseEngine...');
  const cnEngine = await buildBaseChineseEngine({
    modelCode: 'PU-218A',
    sourceDocxPath: sourcePath
  });

  const cnS2 = cnEngine.records.find(r => r.sectionNumber === 2);
  console.log('Generated CN S2 sample:');
  console.log(cnS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n').slice(0, 300));

  const cnS11 = cnEngine.records.find(r => r.sectionNumber === 11);
  console.log('\nGenerated CN S11 rows count:', cnS11.rows.length);

  console.log('\nTesting buildBaseEnglishEngine...');
  const enEngine = await buildBaseEnglishEngine({
    modelCode: 'PU-218A',
    baseCnEngine: cnEngine,
    sourceDocxPath: sourcePath
  });

  const enS2 = enEngine.records.find(r => r.sectionNumber === 2);
  console.log('Generated EN S2 sample:');
  console.log(enS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n').slice(0, 300));

  const enS11 = enEngine.records.find(r => r.sectionNumber === 11);
  console.log('\nGenerated EN S11 rows count:', enS11.rows.length);
}

testPipeline().catch(console.error);
