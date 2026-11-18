import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('Total lines in pipeline-engine.js:', lines.length);

lines.forEach((l, i) => {
  if (l.includes('section9') || l.includes('section9-label') || l.includes('formatSection9LabelCell') || l.includes('9.') || l.includes('11.')) {
    if (l.length < 150) {
      console.log(`${i+1}: ${l.trim()}`);
    }
  }
});
