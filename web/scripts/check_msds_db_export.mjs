import fs from 'node:fs';

const content = fs.readFileSync('web/src/msds-db.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('getBenchmarkSpecsByCategory')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
