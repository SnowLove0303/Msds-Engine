import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.startsWith('export function') || l.startsWith('export async function')) {
    console.log(`${i + 1}: ${l}`);
  }
});
