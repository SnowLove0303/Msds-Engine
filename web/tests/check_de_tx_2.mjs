import fs from 'fs';
const de = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = de.split('\n');

for (let i = 1790; i < Math.min(lines.length, 1850); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
