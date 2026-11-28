import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';
import * as govProposed from '../src/context-governor-proposed.js';

async function test() {
  const filePa = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志_源文件留存.docx';
  const factsPa = await recognizeSourceDocx(filePa);
  const ctx2Pa = govProposed.governContext(factsPa);
  console.log('=== PA-4914 ===');
  console.log('chemicalClassification CN:', ctx2Pa.cn.chemicalClassification);
  console.log('chemicalClassification EN:', ctx2Pa.en.chemicalClassification);
  console.log('contactPhone:', ctx2Pa.cn.contactPhone);
  console.log('transport CN:', ctx2Pa.cn.transport);
  console.log('transport EN:', ctx2Pa.en.transport);

  const fileEp = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1501/EP-1501 msds_CN 冠志_源文件留存.docx';
  const factsEp = await recognizeSourceDocx(fileEp);
  const ctx2Ep = govProposed.governContext(factsEp);
  console.log('\n=== EP-1501 ===');
  console.log('transport CN road:', ctx2Ep.cn.transport.road);
  console.log('transport EN road:', ctx2Ep.en.transport.road);
  console.log('transport EN shippingName:', ctx2Ep.en.transport.shippingName);
}

test();
