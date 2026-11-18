import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js', 'utf8');
const lines = code.split('\n');

for (let j = 380; j < Math.min(450, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
