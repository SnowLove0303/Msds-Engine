import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('create-new-preset')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j = i; j < i + 30; j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
    }
  }
}
