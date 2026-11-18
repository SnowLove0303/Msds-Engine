import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('sectionNumber === 9') || l.includes('sectionNumber == 9') || l.includes('s9 =') || l.includes('s9.')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
