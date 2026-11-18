import fs from 'fs';
const cg = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js', 'utf8');
const lines = cg.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('translateChemicalTerm')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j = i; j < Math.min(lines.length, i + 40); j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
      if (lines[j].startsWith('}')) break;
    }
    break;
  }
}
