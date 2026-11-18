import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor, cleanSlateTemplate } from '../src/smart-matching.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-6088E/PU-6088E msds_CN 冠志.docx');
  const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplBuf = await fs.readFile(tplPath);
  const srcEngine = await loadDocx(buf, 'src.docx');
  const tplEngine = await loadDocx(tplBuf, 'tpl.docx');

  cleanSlateTemplate(tplEngine);
  const matchResult = runSmartMatching(srcEngine.records);
  applyMatchResultToEditor(matchResult, tplEngine);

  const s11 = tplEngine.records.find(r => r.sectionNumber === 11);
  console.log('After applyMatchResultToEditor, s11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log(`Row ${idx} [${r.cells.length} cells]:`, r.cells.map(c => c.text));
  });
}
main();
