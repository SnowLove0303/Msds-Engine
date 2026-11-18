import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine, buildBaseEnglishEngine } from '../src/pipeline-engine.js';

async function main() {
  const userSourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-6088E/PU-6088E msds_CN 冠志.docx';
  const sourceBuffer = await fs.readFile(userSourcePath);

  const cnEngine = await buildBaseChineseEngine({
    modelCode: 'PU-6088E',
    cnGroundTruthPath: userSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    facts: {
      modelCode: 'PU-6088E',
      isHazardous: false,
      isNonHazardousComposite: true
    }
  });

  const enEngine = await buildBaseEnglishEngine({
    modelCode: 'PU-6088E',
    baseCnEngine: cnEngine,
    facts: {
      modelCode: 'PU-6088E',
      isHazardous: false,
      isNonHazardousComposite: true
    }
  });

  const s11 = enEngine.records.find(r => r.sectionNumber === 11);
  console.log('EN Section 11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });
}
main();
