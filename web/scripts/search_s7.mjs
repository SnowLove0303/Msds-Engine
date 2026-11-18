import fs from 'fs';

const lines = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('L-S7')) {
    console.log(`${i + 1}: ${l}`);
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 6); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
  }
});
