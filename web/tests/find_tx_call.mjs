import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('translateToxicologyValueToEnglish')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
