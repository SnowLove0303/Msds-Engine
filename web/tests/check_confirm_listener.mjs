import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 3400; i < 3700; i++) {
  if (lines[i].includes('confirm-unified-export')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j = i; j < i + 40; j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
    }
    break;
  }
}
