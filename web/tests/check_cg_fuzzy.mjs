import fs from 'fs';
const cg = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js', 'utf8');
const lines = cg.split('\n');

for (let i = 165; i < Math.min(lines.length, 210); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
