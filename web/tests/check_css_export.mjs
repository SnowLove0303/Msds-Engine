import fs from 'fs';
const css = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css', 'utf8');
const lines = css.split('\n');

for (let i = 2570; i < 2650; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
