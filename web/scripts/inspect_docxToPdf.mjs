import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('docxToPdf') || l.includes('soffice')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
