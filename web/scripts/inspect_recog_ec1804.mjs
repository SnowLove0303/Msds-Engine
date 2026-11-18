import { recognizeSourceDocx } from '../src/recognition-engine.js';
import fs from 'fs';

async function test() {
  const srcFile = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
  const facts = await recognizeSourceDocx(srcFile);

  console.log("=== SECTION 5 ROWS ===");
  console.log(JSON.stringify(facts.sections[5].rows, null, 2));

  console.log("=== SECTION 10 ROWS ===");
  console.log(JSON.stringify(facts.sections[10].rows, null, 2));

  console.log("=== SECTION 2 ROWS ===");
  console.log(JSON.stringify(facts.sections[2].rows, null, 2));

  console.log("=== SECTION 8 ROWS ===");
  console.log(JSON.stringify(facts.sections[8].rows, null, 2));
}

test().catch(console.error);
