import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';

async function test() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志_源文件留存.docx';
  const facts = await recognizeSourceDocx(file);
  console.log('PA-4914 chemicalClassification:', facts.chemicalClassification);
  console.log('PA-4914 contactPhone:', facts.contactPhone);
  console.log('PA-4914 emergencyPhone:', facts.emergencyPhone);
  console.log('PA-4914 Section 2 categories:', facts.ghs.categories);
  console.log('PA-4914 Section 8 limits:', facts.exposureControls?.limits);
  console.log('PA-4914 Section 11 toxicology:', JSON.stringify(facts.toxicology, null, 2));
  console.log('PA-4914 Section 14 transport:', JSON.stringify(facts.transport, null, 2));
}

test();
