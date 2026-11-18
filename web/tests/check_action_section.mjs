import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 3430; i < 3480; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
