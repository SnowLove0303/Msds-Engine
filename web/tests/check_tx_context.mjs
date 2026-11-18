import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');

console.log('--- Lines 1860-1900 ---');
for (let i = 1860; i < 1900; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('--- Lines 2020-2060 ---');
for (let i = 2020; i < 2060; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
