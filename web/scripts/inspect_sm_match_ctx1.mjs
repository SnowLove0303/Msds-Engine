import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 4860-4930 in smart-matching.js ---');
for (let i = 4859; i < 4930; i++) console.log(`${i + 1}: ${lines[i]}`);
