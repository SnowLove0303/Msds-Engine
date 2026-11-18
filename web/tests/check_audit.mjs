import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = content.split('\n');
console.log('Lines 540-585:');
for (let i = 540; i <= 585; i++) {
  console.log(`${i}: ${lines[i]}`);
}
