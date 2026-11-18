import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { buildBaseChineseEngine, buildBaseEnglishEngine } = await import('../src/pipeline-engine.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx';
const sourceBuffer = await fs.readFile(sourcePath);

const cnEngine = await buildBaseChineseEngine({
  modelCode: 'PU-202A',
  sourceDocxPath: sourcePath,
  sourceDocxBuffer: sourceBuffer
});

const enEngine = await buildBaseEnglishEngine({
  modelCode: 'PU-202A',
  baseCnEngine: cnEngine,
  facts: {}
});

const s2 = enEngine.records.find(r => r.sectionNumber === 2);
const cellNode = s2.rows[3].cells[1].node;
console.log('Cell XML:', new XMLSerializer().serializeToString(cellNode));
