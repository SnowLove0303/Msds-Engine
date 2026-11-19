import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 1935-1970 ---');
for (let i = 1934; i < 1970; i++) console.log(`${i + 1}: ${lines[i]}`);
