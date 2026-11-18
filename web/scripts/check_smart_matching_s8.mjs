import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('暴露控制') || lines[i].includes('工程控制') || lines[i].includes('sectionNumber === 8') || lines[i].includes('s8')) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
