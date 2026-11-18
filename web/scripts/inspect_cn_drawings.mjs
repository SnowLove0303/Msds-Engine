import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { buildBaseChineseEngine } = await import('../src/pipeline-engine.js');
const { W_NS } = await import('../src/docx-engine.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx';
const sourceBuffer = await fs.readFile(sourcePath);

const cnEngine = await buildBaseChineseEngine({
  modelCode: 'PU-202A',
  sourceDocxPath: sourcePath,
  sourceDocxBuffer: sourceBuffer
});

const cnS2 = cnEngine.records.find(r => r.sectionNumber === 2);
const cnPicRow = cnS2?.rows?.find(r => /象形图/i.test(r.cells[0]?.text || ''));
console.log('cnPicRow text:', cnPicRow?.cells?.map(c => c.text));

const drawings = cnPicRow?.cells?.[1]?.node?.getElementsByTagNameNS(W_NS, 'drawing') || [];
console.log('drawings count in cnPicRow:', drawings.length);
