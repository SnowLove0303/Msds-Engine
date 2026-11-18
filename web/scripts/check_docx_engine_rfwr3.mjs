import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = code.split('\n');

for (let j = 2970; j < Math.min(3040, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
