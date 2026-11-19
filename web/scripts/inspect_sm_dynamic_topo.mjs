import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 5250-5320 in smart-matching.js ---');
for (let i = 5249; i < 5320; i++) console.log(`${i + 1}: ${lines[i]}`);
