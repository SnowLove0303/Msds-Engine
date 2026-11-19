import fs from 'node:fs';

const content = fs.readFileSync('web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('getBenchmarkSpecsByCategory') && idx < 50) {
    console.log(`${idx + 1}: ${l}`);
  }
});
