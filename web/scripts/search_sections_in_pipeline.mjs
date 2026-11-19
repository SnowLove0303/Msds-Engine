import fs from 'node:fs';

const content = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('sectionNumber === 1') || line.includes('sectionNumber === 8') || line.includes('sectionNumber === 11') || line.includes('sectionNumber === 13') || line.includes('sectionNumber === 14') || line.includes('sectionNumber === 15')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
