import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for categories handling in Section 2 in smart-matching.js:');
lines.forEach((l, i) => {
  if (l.includes('categories') || (l.includes('sectionNumber === 2') || l.includes('s === 2') || l.includes('secNum === 2'))) {
    console.log(`${i + 1}: ${l}`);
  }
});
