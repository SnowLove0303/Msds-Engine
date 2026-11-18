import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');

for (let i = 3340; i < 3480; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
