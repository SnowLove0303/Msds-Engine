import fs from 'fs';
const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for Section 8 in pipeline-engine.js:');
lines.forEach((l, i) => {
  if (l.includes('sectionNumber === 8') || l.includes('s === 8') || l.includes('exposureControls') || l.includes('工程控制') || l.includes('Engineering controls') || l.includes('TLVTN') || l.includes('buildDynamicSection8Table')) {
    console.log(`${i + 1}: ${l.slice(0, 100)}`);
  }
});
