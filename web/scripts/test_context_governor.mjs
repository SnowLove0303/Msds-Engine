import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { governContext } from '../src/context-governor.js';

async function testGov() {
  const p4840Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx';
  const p4902Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';

  const r4840 = await recognizeSourceDocx(p4840Src);
  const r4902 = await recognizeSourceDocx(p4902Src);

  const gov4840 = governContext(r4840);
  const gov4902 = governContext(r4902);

  console.log('=== GOVERNED 4840 ===');
  console.log('CN Hazardous:', gov4840.cn.ghs.isHazardous);
  console.log('CN Label Comp:', gov4840.cn.hazardousComponentsOnLabel);
  console.log('CN Hazard Statements:', gov4840.cn.ghs.hazardStatements);
  console.log('CN Precautionary prevention:', gov4840.cn.ghs.precautionaryStatements.prevention);
  console.log('EN Hazard Statements:', gov4840.en.ghs.hazardStatements);

  console.log('\n=== GOVERNED 4902 ===');
  console.log('CN Hazardous:', gov4902.cn.ghs.isHazardous);
  console.log('CN Signal Word:', gov4902.cn.ghs.signalWord);
  console.log('CN Hazard Statements:', gov4902.cn.ghs.hazardStatements);
  console.log('CN Precautionary prevention length:', gov4902.cn.ghs.precautionaryStatements.prevention.length);
  console.log('CN Precautionary response length:', gov4902.cn.ghs.precautionaryStatements.response.length);
  console.log('CN Precautionary storage length:', gov4902.cn.ghs.precautionaryStatements.storage.length);
  console.log('CN Precautionary disposal length:', gov4902.cn.ghs.precautionaryStatements.disposal.length);
  console.log('CN Other Hazards:', gov4902.cn.otherHazards);
  console.log('CN Components Notes:', gov4902.cn.componentsNotes);
  console.log('EN Signal Word:', gov4902.en.ghs.signalWord);
  console.log('EN Hazard Statements:', gov4902.en.ghs.hazardStatements);
  console.log('EN Precautionary prevention length:', gov4902.en.ghs.precautionaryStatements.prevention.length);
  console.log('EN Components Notes length:', gov4902.en.componentsNotes.length);
}

testGov().catch(console.error);
