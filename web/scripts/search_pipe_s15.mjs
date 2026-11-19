import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for Section 15 in pipeline-engine.js:');
lines.forEach((l, i) => {
  if (l.includes('sectionNumber === 15') || l.includes('s === 15') || l.includes('344') || l.includes('591') || l.includes('GB 30000') || l.includes('GB 20576')) {
    console.log(`${i + 1}: ${l.slice(0, 100)}`);
  }
});
