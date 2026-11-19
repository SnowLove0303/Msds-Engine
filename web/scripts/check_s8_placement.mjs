import fs from 'node:fs';

const content = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('getBenchmarkSpecsByCategory(modelCode)')) {
    console.log(`Line ${idx + 1}: ${l}`);
    for (let j = idx; j < idx + 25; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
});
