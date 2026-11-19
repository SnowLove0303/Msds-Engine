import fs from 'node:fs';

const content = fs.readFileSync('web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('function applyMatchResultToEditor') || line.includes('function cleanSlateTemplate')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
