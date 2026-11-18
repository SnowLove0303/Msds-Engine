import fs from 'fs';
const c = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = c.split('\n');
for (let i = 70; i < 85; i++) {
  console.log(i + ': ' + JSON.stringify(lines[i]));
}
