import { recognizeSourceDocx } from '../src/recognition-engine.js';

async function test() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1501/EP-1501 msds_CN 冠志_源文件留存.docx';
  const facts = await recognizeSourceDocx(file);
  console.log('EP-1501 facts.ghs:', facts.ghs);
  console.log('EP-1501 facts.isNonHazardousComposite:', facts.isNonHazardousComposite);
}

test();
