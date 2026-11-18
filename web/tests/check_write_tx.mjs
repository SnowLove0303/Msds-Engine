import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('writeStructuredToxicologyCellValue')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j = i; j < Math.min(lines.length, i + 50); j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
      if (lines[j].startsWith('}')) break;
    }
  }
}
