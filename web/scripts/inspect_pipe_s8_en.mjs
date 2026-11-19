import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3820-3880 in pipeline-engine.js ---');
for (let i = 3819; i < 3880; i++) console.log(`${i + 1}: ${lines[i]}`);
