import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('--- Lines 728-765 ---');
for (let i = 727; i < 765; i++) console.log(`${i + 1}: ${lines[i]}`);
console.log('--- Lines 2340-2380 ---');
for (let i = 2339; i < 2380; i++) console.log(`${i + 1}: ${lines[i]}`);
