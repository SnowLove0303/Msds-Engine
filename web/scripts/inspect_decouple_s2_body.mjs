import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 1340-1420 in smart-matching.js ---');
for (let i = 1339; i < 1420; i++) console.log(`${i + 1}: ${lines[i]}`);
