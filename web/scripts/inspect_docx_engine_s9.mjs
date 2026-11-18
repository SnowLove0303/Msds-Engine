import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = content.split('\n');
console.log('Total lines in docx-engine.js:', lines.length);

lines.forEach((l, i) => {
  if (l.includes('Section 9') || l.includes('section9') || l.includes('applyStandardHangingIndent') || l.includes('writeCellLabel') || l.includes('formatSection9') || l.includes('tableIndex === 8')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
