import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { governContext } from '../src/context-governor.js';

async function test() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志_源文件留存.docx';
  const facts = await recognizeSourceDocx(file);
  const context2 = governContext(facts);
  console.log('context2.cn.chemicalClassification:', context2.cn.chemicalClassification);
  console.log('context2.en.chemicalClassification:', context2.en.chemicalClassification);
  console.log('context2.cn.transport:', context2.cn.transport);
  console.log('context2.en.transport:', context2.en.transport);
}

test();
