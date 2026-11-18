import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = code.split('\n');

for (let j = 2886; j < Math.min(2970, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
