import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for 工程控制 in smart-matching.js:');
lines.forEach((l, i) => {
  if (l.includes('工程控制') || l.includes('engineering_controls')) {
    console.log(`${i + 1}: ${l}`);
  }
});
