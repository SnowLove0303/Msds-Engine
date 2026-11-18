import fs from 'fs';

const text = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = text.split('\n');

lines.forEach((l, i) => {
  if (l.includes('s === 7') || l.includes('sectionNumber === 7') || l.includes('sectionNumber: 7') || l.includes('7.1') || l.includes('7.2')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
