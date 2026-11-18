import fs from 'fs';
const css = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css', 'utf8');
const lines = css.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('preset-manager') || lines[i].includes('unified-export')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
