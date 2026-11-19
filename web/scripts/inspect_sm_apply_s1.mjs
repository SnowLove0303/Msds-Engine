import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 3180-3240 in smart-matching.js ---');
for (let i = 3179; i < 3240; i++) console.log(`${i + 1}: ${lines[i]}`);
