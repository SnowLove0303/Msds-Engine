import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 6380-6440 in pipeline-engine.js ---');
for (let i = 6379; i < 6440; i++) console.log(`${i + 1}: ${lines[i]}`);
