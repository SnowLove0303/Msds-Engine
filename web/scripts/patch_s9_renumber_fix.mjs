import fs from 'fs';

const pPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/proposed_pipeline_engine.js';
let content = fs.readFileSync(pPath, 'utf8');

const targetStr = `    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号并由 renumberRecord 自动激光对齐
    renumberRecord(s9, '9');`;

const replaceStr = `    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号并由 renumberRecord 自动激光对齐
    s9 = engine.records.find(r => r.sectionNumber === 9);
    if (s9) renumberRecord(s9);`;

if (!content.includes(targetStr)) {
  console.error('targetStr not found!');
  process.exit(1);
}

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(pPath, content, 'utf8');
console.log('Successfully updated proposed_pipeline_engine.js with s9 refresh renumberRecord!');
