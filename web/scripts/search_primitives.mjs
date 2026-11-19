import fs from 'fs';

const p = 'web/src/universal-editor-primitives.js';
const content = fs.readFileSync(p, 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes(': .') || l.includes('Other provisions') || l.includes('Complies with') || l.includes('applyGlobalTypographyProjection')) {
    console.log(`${i+1}: ${l}`);
  }
});
