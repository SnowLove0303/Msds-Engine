import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3240-3280 ---');
for (let i = 3239; i < 3280; i++) console.log(`${i + 1}: ${lines[i]}`);
console.log('--- Lines 3530-3570 ---');
for (let i = 3529; i < 3570; i++) console.log(`${i + 1}: ${lines[i]}`);
