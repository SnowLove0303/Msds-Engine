import fs from 'fs';
const cg = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js', 'utf8');
const lines = cg.split('\n');

for (let i = 0; i < 125; i++) {
  if (lines[i].includes('CHEMICAL_TRANSLATION_DICT')) {
    for (let j = i; j < Math.min(lines.length, i + 50); j++) {
      console.log(`${j+1}: ${lines[j]}`);
      if (lines[j].startsWith('};')) break;
    }
    break;
  }
}
