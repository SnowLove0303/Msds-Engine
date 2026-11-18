import fs from 'node:fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('function translateToxicologyValueToEnglish')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
