import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('G-35') || l.includes('G-36') || l.includes('G-37') || l.includes('PyMuPDF')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
