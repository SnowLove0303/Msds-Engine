import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 2106-2140 ---');
for (let i = 2105; i < 2140; i++) console.log(`${i + 1}: ${lines[i]}`);
console.log('--- Lines 2407-2440 ---');
for (let i = 2406; i < 2440; i++) console.log(`${i + 1}: ${lines[i]}`);
