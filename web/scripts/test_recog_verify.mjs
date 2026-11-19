import fs from 'fs';
import path from 'path';
import { recognizeSourceDocx } from '../src/recognition-engine.js';

async function testRecog() {
  const p4840Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx';
  const p4902Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';

  const r4840 = await recognizeSourceDocx(p4840Src);
  const r4902 = await recognizeSourceDocx(p4902Src);

  console.log('=== CHECKING PA-4840 RECOGNITION ===');
  console.log('Product Name:', r4840.productName);
  console.log('Classification:', r4840.chemicalClassification);
  console.log('GHS Hazardous:', r4840.ghs?.isHazardous);
  console.log('GHS Hazardous Components on Label:', r4840.ghs?.hazardousComponentsOnLabel);
  console.log('GHS Categories:', r4840.ghs?.categories);
  console.log('GHS Hazard Statements:', r4840.ghs?.hazardStatements);
  console.log('GHS Precautionary:', r4840.ghs?.precautionaryStatements);
  console.log('Components count:', r4840.components?.length);
  console.log('S11 Clinical/Endpoints:', r4840.toxicology?.clinicalAssessment ? 'YES (Length: ' + r4840.toxicology.clinicalAssessment.length + ')' : 'NO');

  console.log('\n=== CHECKING PA-4902 RECOGNITION ===');
  console.log('Product Name:', r4902.productName);
  console.log('Classification:', r4902.chemicalClassification);
  console.log('GHS Hazardous:', r4902.ghs?.isHazardous);
  console.log('GHS Signal Word:', r4902.ghs?.signalWord);
  console.log('GHS Hazard Statements:', r4902.ghs?.hazardStatements);
  console.log('GHS Precautionary Prevention:', r4902.ghs?.precautionaryStatements?.prevention?.length);
  console.log('GHS Precautionary Response:', r4902.ghs?.precautionaryStatements?.response?.length);
  console.log('GHS Precautionary Storage:', r4902.ghs?.precautionaryStatements?.storage?.length);
  console.log('GHS Precautionary Disposal:', r4902.ghs?.precautionaryStatements?.disposal?.length);
  console.log('GHS Other Hazards:', r4902.ghs?.otherHazards);
  console.log('Components count:', r4902.components?.length);
  console.log('Components Notes:', r4902.componentsNotes);
  console.log('S11 Clinical/Endpoints:', r4902.toxicology?.clinicalAssessment ? 'YES (Length: ' + r4902.toxicology.clinicalAssessment.length + ')' : 'NO');
}

testRecog().catch(console.error);
