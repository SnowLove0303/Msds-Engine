import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3280-3330 ---');
for (let i = 3279; i < 3330; i++) console.log(`${i + 1}: ${lines[i]}`);
