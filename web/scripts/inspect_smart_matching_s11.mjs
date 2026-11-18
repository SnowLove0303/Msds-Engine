import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-6088E/PU-6088E msds_CN 冠志.docx');
  const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplBuf = await fs.readFile(tplPath);
  const srcEngine = await loadDocx(buf, 'src.docx');
  const tplEngine = await loadDocx(tplBuf, 'tpl.docx');

  const matchResult = runSmartMatching(srcEngine.records, tplEngine.records, { modelCode: 'PU-6088E' });
  const s11Match = matchResult.matchedSections.find(s => s.sectionNumber === 11);
  console.log('s11Match matchedRows count:', s11Match?.matchedRows?.length);
  s11Match?.matchedRows?.forEach((r, idx) => {
    console.log(`MatchedRow ${idx}: key=${r.key}, label=${r.label}, val=${r.value?.slice(0, 80)}`);
  });
}
main();
