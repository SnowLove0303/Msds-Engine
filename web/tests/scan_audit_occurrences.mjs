import fs from 'node:fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('docGuocai') || l.includes('tblsGuocai') || l.includes('Guanzhi') || l.includes('国彩') || l.includes('冠志')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
