import fs from 'fs';

const text = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = text.split('\n');

lines.forEach((l, i) => {
  if (l.includes("key: 'handling'") || l.includes("key === 'handling'") || (l.includes('handling') && l.includes('storage') && l.includes('s === 7'))) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
