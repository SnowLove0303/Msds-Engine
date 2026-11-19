import fs from 'node:fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/generate_ep1404_deliverables.mjs', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('s11') || lines[i].includes('Section 11') || lines[i].includes('expectedS11')) {
    console.log(i + 1, lines[i]);
  }
}
