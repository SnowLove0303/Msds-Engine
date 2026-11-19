import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3820-3900 in smart-matching.js ---');
for (let i = 3819; i < 3900; i++) console.log(`${i + 1}: ${lines[i]}`);
