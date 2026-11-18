import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 80; i < 220; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
