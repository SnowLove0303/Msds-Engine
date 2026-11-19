import fs from 'node:fs';

const content = fs.readFileSync('web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('function runSmartMatching') || line.includes('export function runSmartMatching')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
