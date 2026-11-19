import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for Temperature must not exceed or specialPrecautions:');
lines.forEach((l, i) => {
  if (l.includes('Temperature must not exceed') || l.includes('specialPrecautions') || l.includes('special_precautions') || l.includes('14.4') || l.includes('14.7')) {
    console.log(`${i + 1}: ${l.slice(0, 100)}`);
  }
});
