import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
import { loadDocx } from './src/docx-engine.js';
import { runSmartMatching } from './src/smart-matching.js';

async function testMatch() {
  const buf = await fs.readFile('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 国彩_源文件留存.docx');
  const sourceDoc = await loadDocx(buf, 'source');
  const tplBuf = await fs.readFile('public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplDoc = await loadDocx(tplBuf, 'tpl');
  const result = runSmartMatching(sourceDoc.records, tplDoc.records);
  const s12 = result.matchedSections.find(s => s.sectionNumber === 12);
  console.log('Section 12 matched rows:');
  console.log(JSON.stringify(s12?.matchedRows, null, 2));
}
testMatch();
