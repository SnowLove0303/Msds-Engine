import fs from 'fs';

const src = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = src.split('\n');
lines.forEach((l, i) => {
  if (l.includes('2.1') || l.includes('GHS危险性') || l.includes('renderFullWidthRow') || l.includes('Classification of the substance')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
