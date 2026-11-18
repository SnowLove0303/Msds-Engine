import fs from 'fs';

const pPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/proposed_pipeline_engine.js';
let content = fs.readFileSync(pPath, 'utf8');

const badStr = `    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号并激光对齐
    renumberRecord(s9, '9');
    for (let rIdx = 1; rIdx < s9.rows.length; rIdx++) {
      const c0 = s9.rows[rIdx]?.cells[0];
      if (c0) formatSection9LabelCell(c0, true);
    }`;

const goodStr = `    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号并由 renumberRecord 自动激光对齐
    renumberRecord(s9, '9');`;

if (!content.includes(badStr)) {
  console.error('badStr not found!');
  process.exit(1);
}

content = content.replace(badStr, goodStr);
fs.writeFileSync(pPath, content, 'utf8');
console.log('Fixed proposed_pipeline_engine.js renumberRecord!');
