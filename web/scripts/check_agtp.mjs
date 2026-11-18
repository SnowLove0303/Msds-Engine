import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function applyGlobalTypographyProjection')) {
    console.log(`applyGlobalTypographyProjection at line ${i+1}`);
    for (let j = i; j < Math.min(i + 80, lines.length); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
    break;
  }
}
