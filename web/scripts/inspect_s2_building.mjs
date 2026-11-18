import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('renderFullWidthRow') || (l.includes('Section 2') && l.includes('预防措施'))) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
