import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('8.1') || lines[i].includes('8. 接触控制') || lines[i].includes('Exposure controls:')) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
