import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = lines.length - 100; i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
