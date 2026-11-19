import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3670-3750 in smart-matching.js ---');
for (let i = 3669; i < 3750; i++) console.log(`${i + 1}: ${lines[i]}`);
