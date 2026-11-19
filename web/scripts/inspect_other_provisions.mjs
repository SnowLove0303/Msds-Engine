import fs from 'fs';

const pe = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');

lines.forEach((l, i) => {
  if (l.includes('Other provisions') || l.includes('Complies with the following')) {
    console.log(`${i+1}: ${l}`);
  }
});
