import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for s === 1 specific logic:');
lines.forEach((l, i) => {
  if (l.includes('if (s === 1)') || l.includes('s === 1 &&') || l.includes('s === 1)')) {
    console.log(`${i + 1}: ${l}`);
  }
});
