import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3150-3220 in pipeline-engine.js ---');
for (let i = 3149; i < 3220; i++) console.log(`${i + 1}: ${lines[i]}`);
