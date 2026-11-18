import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.startsWith('export ') || l.startsWith('async function') || l.startsWith('function ')) {
    if (l.includes('execute') || l.includes('build') || l.includes('generate') || l.includes('pipeline') || l.includes('Chinese')) {
      console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
    }
  }
});
