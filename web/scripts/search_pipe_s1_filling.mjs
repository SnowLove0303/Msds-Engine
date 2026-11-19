import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for Section 1 / Table 0 / fillSection1 in pipeline-engine.js:');
lines.forEach((l, i) => {
  if (l.includes('Table 0') || l.includes('sectionNumber === 1') || l.includes('s === 1') || l.includes('fillSection1') || l.includes('化学品分类') || l.includes('sec1.') || l.includes('chemical_category')) {
    console.log(`${i + 1}: ${l.slice(0, 100)}`);
  }
});
