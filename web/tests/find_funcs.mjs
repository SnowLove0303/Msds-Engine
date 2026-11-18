import fs from 'node:fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (/export (async )?function/.test(line)) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
