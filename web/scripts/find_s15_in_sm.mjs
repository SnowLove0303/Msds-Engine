import fs from 'node:fs';

const lines = fs.readFileSync('web/src/smart-matching.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('15') || l.includes('sec15') || l.includes('法规')) {
    console.log(i + 1, l);
  }
});
