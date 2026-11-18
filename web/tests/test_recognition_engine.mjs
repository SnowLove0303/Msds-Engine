import fs from 'fs';
import path from 'path';
import { recognizeSourceDocx } from '../src/recognition-engine.js';

async function runTest() {
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  console.log('Testing recognizeSourceDocx with:', sourcePath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error('Source file not found: ' + sourcePath);
  }

  const buf = fs.readFileSync(sourcePath);
  const facts = await recognizeSourceDocx(buf, path.basename(sourcePath));

  console.log('=== Recognition Results ===');
  console.log('Model Code:', facts.modelCode);
  console.log('Is Hazardous:', facts.ghs.isHazardous);
  console.log('GHS Categories:', facts.ghs.categories);
  console.log('Signal Word:', facts.ghs.signalWord);
  console.log('H-statements:', facts.ghs.hazardStatements.length);
  console.log('P-prevention:', facts.ghs.precautionaryStatements.prevention.length);
  console.log('P-response:', facts.ghs.precautionaryStatements.response.length);
  console.log('P-storage:', facts.ghs.precautionaryStatements.storage.length);
  console.log('P-disposal:', facts.ghs.precautionaryStatements.disposal.length);
  console.log('Other Hazards:', facts.ghs.otherHazards);
  console.log('Components count:', facts.components.length);
  console.log('Physical Properties count:', facts.physicalProperties.length);
  console.log('Toxicology Paradigm:', facts.toxicology.paradigm);
  console.log('Sections extracted:', Object.keys(facts.sections).length);

  // Assertions
  if (Object.keys(facts.sections).length < 16) {
    throw new Error(`Expected at least 16 sections, got ${Object.keys(facts.sections).length}`);
  }
  if (!facts.ghs.signalWord) {
    throw new Error('Signal word not recognized');
  }
  if (facts.ghs.categories.length === 0) {
    throw new Error('GHS categories not recognized');
  }
  if (facts.physicalProperties.length < 15) {
    throw new Error(`Expected at least 15 physical properties, got ${facts.physicalProperties.length}`);
  }

  console.log('🎉 Recognition Engine Test PASSED (Exit Code 0)');
}

runTest().catch(err => {
  console.error('❌ Test FAILED:', err);
  process.exit(1);
});
