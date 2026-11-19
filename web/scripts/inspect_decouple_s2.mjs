import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('decoupleSection2CompoundBlocks')) {
    console.log(`${i + 1}: ${l}`);
  }
});
