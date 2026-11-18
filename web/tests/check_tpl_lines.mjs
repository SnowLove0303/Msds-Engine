import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

console.log('--- Lines 2135-2165 ---');
for (let i = 2134; i < 2165; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('--- Lines 3030-3070 ---');
for (let i = 3030; i < 3070; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
