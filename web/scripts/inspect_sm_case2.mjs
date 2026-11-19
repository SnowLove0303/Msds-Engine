import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 4930-5000 in smart-matching.js ---');
for (let i = 4929; i < 5000; i++) console.log(`${i + 1}: ${lines[i]}`);
