import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 4125-4180 in pipeline-engine.js ---');
for (let i = 4124; i < 4180; i++) console.log(`${i + 1}: ${lines[i]}`);
