import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

console.log('--- renderUnifiedExportModal (991 - 1165) ---');
for (let i = 990; i < 1165; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
