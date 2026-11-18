import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('Section 9') || l.includes('sec9') || l.includes('hanging') || l.includes('tab') || l.includes('9.3') || l.includes('9.10')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
