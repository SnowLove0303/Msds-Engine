import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 6325-6380 in pipeline-engine.js ---');
for (let i = 6324; i < 6380; i++) console.log(`${i + 1}: ${lines[i]}`);
