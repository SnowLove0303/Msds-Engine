import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 0; i < 400; i++) {
  if (lines[i].includes('const state = {') || lines[i].includes('export const state = {')) {
    console.log(`State defined at line ${i+1}`);
    for (let j = i; j < i + 100; j++) {
      console.log(`${j+1}: ${lines[j]}`);
      if (lines[j].startsWith('};')) break;
    }
    break;
  }
}
