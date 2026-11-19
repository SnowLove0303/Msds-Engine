import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 45-120 ---');
for (let i = 44; i < 120; i++) console.log(`${i + 1}: ${lines[i]}`);
