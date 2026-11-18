import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('buildDynamicSection14') || (l.includes('sectionNumber === 14') || l.includes('s14'))) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
