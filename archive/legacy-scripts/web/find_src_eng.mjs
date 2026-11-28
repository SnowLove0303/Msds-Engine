import fs from 'fs';

const txt = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = txt.split('\n');

for (let i = 1328; i < 1550; i++) {
  const l = lines[i];
  if (l.includes('srcEngine')) {
    console.log((i+1) + ': ' + l);
  }
}
