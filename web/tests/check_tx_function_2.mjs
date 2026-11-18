import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');
for (let i = 3197; i < Math.min(lines.length, 3290); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
