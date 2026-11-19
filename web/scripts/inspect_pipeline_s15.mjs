import fs from 'fs';

const pe = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const lines = pe.split('\n');

lines.forEach((l, i) => {
  if (l.toLowerCase().includes('section 15') || l.toLowerCase().includes('section15') || (l.includes('15') && l.includes('法规'))) {
    console.log(`${i + 1}: ${l}`);
  }
});
