import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';
import { governContext } from '../src/context-governor.js';

async function test() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1501/EP-1501 msds_CN 冠志_源文件留存.docx';
  const facts = await recognizeSourceDocx(file);
  const context2 = governContext(facts);
  console.log('EP-1501 facts.transport:', facts.transport);
  console.log('EP-1501 context2.cn.transport:', context2.cn.transport);
  console.log('EP-1501 context2.en.transport:', context2.en.transport);
}

test();
