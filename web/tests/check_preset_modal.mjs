import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

console.log('--- renderPresetManagerModal (1166 - 1350) ---');
for (let i = 1165; i < Math.min(lines.length, 1350); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
