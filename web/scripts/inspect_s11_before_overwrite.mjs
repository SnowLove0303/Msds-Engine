import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { runSmartMatching, applyMatchResultToEditor } = await import('../src/smart-matching.js');

async function test() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx';
  const buf = fs.readFileSync(p);
  const srcEngine = await loadDocx(buf, 'source.docx');
  const matchResult = runSmartMatching(srcEngine.records);

  const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const tplBuf = fs.readFileSync(tplPath);
  const engine = await loadDocx(tplBuf, 'out.docx');

  applyMatchResultToEditor(matchResult, engine);

  const s11 = engine.records.find(r => r.sectionNumber === 11);
  console.log('--- Section 11 Rows after applyMatchResultToEditor ---');
  for (let i = 0; i < s11.rows.length; i++) {
    console.log(`Row ${i}:`, s11.rows[i].cells.map(c => c.text).join(' | '));
  }
}

test().catch(console.error);
