import fs from 'node:fs';

const content = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (/section\s*1\b|s === 1\b|product_name/i.test(line) && idx < 3200) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
