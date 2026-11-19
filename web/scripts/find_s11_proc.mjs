import fs from 'node:fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('sectionNumber === 11') || lines[i].includes('s === 11')) {
    console.log(i + 1, lines[i]);
  }
}
