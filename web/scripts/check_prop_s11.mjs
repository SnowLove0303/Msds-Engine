import fs from 'node:fs';

const content = fs.readFileSync('web/data/proposed_pipeline-engine.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export function detectSection11Paradigm')) {
    console.log(`Line ${i + 1}:`);
    for (let j = i; j < i + 20; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
}
