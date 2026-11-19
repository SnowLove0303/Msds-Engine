import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Acute toxicity') || l.includes('Flammable') || l.includes('Skin irritation') || l.includes('category') || l.includes('categories')) {
    console.log(`${i + 1}: ${l.slice(0, 100)}`);
  }
});
