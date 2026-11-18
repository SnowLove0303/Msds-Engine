import fs from 'fs';
const de = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const lines = de.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('fetchPresetsFromApi')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j = i; j < i + 30; j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
      if (lines[j].startsWith('  }')) break;
    }
    break;
  }
}
