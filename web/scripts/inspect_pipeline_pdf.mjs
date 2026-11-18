import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('soffice') || l.includes('convertDocxToPdf') || l.includes('execSync')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
