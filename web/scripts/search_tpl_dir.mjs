import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('TEMPLATES_DIR') || l.includes('正式模板')) {
    console.log(`${i + 1}: ${l}`);
  }
});
