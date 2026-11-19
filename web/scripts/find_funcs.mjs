import fs from 'fs';

const lines = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8').split('\n');
for (let i = 3001; i <= 3080; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
