import fs from 'fs';

const content = fs.readFileSync('src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('if (isPu202a) {') || l.includes('G-35')) {
    console.log(`${i+1}: ${l.trim().slice(0, 90)}`);
  }
});
