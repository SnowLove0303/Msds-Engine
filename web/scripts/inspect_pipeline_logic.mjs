import fs from 'fs';

function inspectFile(file, keywords) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log(`=== FILE: ${file} ===`);
  lines.forEach((line, idx) => {
    for (const kw of keywords) {
      if (line.includes(kw)) {
        console.log(`${idx + 1}: ${line.trim().slice(0, 130)}`);
        break;
      }
    }
  });
}

inspectFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', [
  'sectionNumber === 5',
  'sectionNumber === 10',
  'sectionNumber === 2',
  'sectionNumber === 8',
  '5.4',
  '10.2',
  '10.3',
  '10.4',
  '手部防护'
]);
