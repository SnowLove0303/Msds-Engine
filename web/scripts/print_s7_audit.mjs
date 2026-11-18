import fs from 'fs';

const lines = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8').split('\n');
for (let i = 770; i <= 805; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
