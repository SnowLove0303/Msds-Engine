import fs from 'fs';

const content = fs.readFileSync('src/smart-matching.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('detectNonHazardousComposite')) {
    console.log(`${i+1}: ${l.trim().slice(0, 90)}`);
  }
});
