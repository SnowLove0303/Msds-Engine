import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, cleanSlateTemplate, applyMatchResultToEditor } from '../src/smart-matching.js';
import fs from 'fs';

async function test() {
  const srcFile = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
  const srcEngine = await loadDocx(fs.readFileSync(srcFile), 'src.docx');
  const matchResult = runSmartMatching(srcEngine.records);

  const tplBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const engine = await loadDocx(tplBuf, 'out.docx');

  cleanSlateTemplate(engine);
  applyMatchResultToEditor(matchResult, engine);

  console.log("=== AFTER APPLY: SECTION 5 ===");
  const s5 = engine.records.find(r => r.sectionNumber === 5);
  s5.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });

  console.log("\n=== AFTER APPLY: SECTION 10 ===");
  const s10 = engine.records.find(r => r.sectionNumber === 10);
  s10.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });

  console.log("\n=== AFTER APPLY: SECTION 2 ===");
  const s2 = engine.records.find(r => r.sectionNumber === 2);
  s2.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });

  console.log("\n=== AFTER APPLY: SECTION 8 ===");
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  s8.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: [${r.cells.map(c => c.text).join(' | ')}]`);
  });
}

test().catch(console.error);
