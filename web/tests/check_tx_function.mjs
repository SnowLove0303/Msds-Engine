import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');
const idx = lines.findIndex(l => l.includes('function translateToxicologyValueToEnglish'));
console.log('Function starts at line:', idx + 1);
for (let i = idx; i < idx + 90; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
