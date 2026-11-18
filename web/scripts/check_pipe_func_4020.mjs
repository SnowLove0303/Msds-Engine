import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');

for (let j = 4020; j < 4080; j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
