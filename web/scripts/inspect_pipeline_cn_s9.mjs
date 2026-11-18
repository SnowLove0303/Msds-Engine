import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('formatSection9LabelCell') || l.includes('s9.rows') || l.includes('理化特性') || l.includes('sec9')) {
    if (i > 1000 && i < 2000) {
      console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
    }
  }
});
