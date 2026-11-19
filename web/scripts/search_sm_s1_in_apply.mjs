import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for s === 1 in applyMatchResultToEditor:');
lines.forEach((l, i) => {
  if (i >= 3230 && i <= 3700) {
    if (l.includes('s === 1') || l.includes('sectionNumber === 1') || l.includes('case 1:')) {
      console.log(`${i + 1}: ${l}`);
    }
  }
});
