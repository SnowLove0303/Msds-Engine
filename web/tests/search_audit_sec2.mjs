import fs from 'fs';

const src = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = src.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Section 2') || l.includes('GHS危险性类别') || l.includes('firstLine')) {
    console.log(`${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
