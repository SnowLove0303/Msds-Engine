import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('Total lines in smart-matching.js:', lines.length);
lines.forEach((l, i) => {
  if (l.includes('categories') || l.includes('UN') || l.includes('unNumber') || l.includes('1866') || l.includes('acute') || l.includes('吸入') || l.includes('chemicalClassification') || l.includes('transport') || l.includes('shippingName')) {
    console.log(`${i + 1}: ${l.slice(0, 100)}`);
  }
});
