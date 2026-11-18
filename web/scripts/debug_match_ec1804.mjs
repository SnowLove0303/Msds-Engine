import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

async function test() {
  const srcFile = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
  const facts = await recognizeSourceDocx(srcFile);

  const tplBuf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplEngine = await loadDocx(tplBuf, 'tpl.docx');

  const matchRes = await runSmartMatching(facts, tplEngine);

  console.log("=== SECTION 5 MATCHED ROWS ===");
  const s5 = matchRes.matchedSections.find(s => s.sectionNumber === 5);
  console.log(JSON.stringify(s5, null, 2));

  console.log("=== SECTION 10 MATCHED ROWS ===");
  const s10 = matchRes.matchedSections.find(s => s.sectionNumber === 10);
  console.log(JSON.stringify(s10, null, 2));

  console.log("=== SECTION 2 MATCHED ROWS ===");
  const s2 = matchRes.matchedSections.find(s => s.sectionNumber === 2);
  console.log(JSON.stringify(s2, null, 2));
}

test().catch(console.error);
