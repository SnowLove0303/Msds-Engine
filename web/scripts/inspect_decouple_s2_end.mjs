import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 1420-1470 in smart-matching.js ---');
for (let i = 1419; i < 1470; i++) console.log(`${i + 1}: ${lines[i]}`);
