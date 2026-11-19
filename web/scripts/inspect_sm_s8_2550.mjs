import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 2550-2580 in smart-matching.js ---');
for (let i = 2549; i < 2580; i++) console.log(`${i + 1}: ${lines[i]}`);
console.log('--- Lines 4010-4050 in smart-matching.js ---');
for (let i = 4009; i < 4050; i++) console.log(`${i + 1}: ${lines[i]}`);
