import fs from 'fs';
import path from 'path';

// Search all occurrences of sectionNumber === 11 or secNum === 11 in pipeline-engine.js
const pCode = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = pCode.split('\n');
lines.forEach((l, i) => {
  if (l.includes('11') && (l.includes('sectionNumber') || l.includes('secNum') || l.includes('Table 11') || l.includes('s11'))) {
    console.log(`${i + 1}: ${l}`);
  }
});
