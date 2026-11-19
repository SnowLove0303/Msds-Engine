import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('Searching smart-matching.js for ghs category handling and acute toxicity...');
lines.forEach((l, i) => {
  if (l.includes('categories') || l.includes('PRUNED') || l.includes('acute_toxicity')) {
    if (i >= 2700 && i <= 2860 || i >= 3650 && i <= 3730 || i >= 4170 && i <= 4240) {
      console.log(`${i + 1}: ${l}`);
    }
  }
});
