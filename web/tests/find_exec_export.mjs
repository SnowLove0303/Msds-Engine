import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function executeUnifiedExport') || lines[i].includes('function executeUnifiedExport')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j = i; j < i + 50; j++) {
      console.log(`${j+1}: ${lines[j]}`);
      if (lines[j].startsWith('}')) break;
    }
    break;
  }
}
