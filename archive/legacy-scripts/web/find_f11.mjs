import fs from 'fs';

const txt = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = txt.split('\n');

lines.forEach((l, i) => {
  if (l.includes('formatSection11PreambleRow')) {
    console.log((i+1) + ': ' + l);
  }
});
