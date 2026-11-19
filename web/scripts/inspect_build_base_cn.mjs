import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 2613-2680 in pipeline-engine.js ---');
for (let i = 2612; i < 2680; i++) console.log(`${i + 1}: ${lines[i]}`);
