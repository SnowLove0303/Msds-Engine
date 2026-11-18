import fs from 'fs';

function findLeftChars(file) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  console.log(`=== ${file} ===`);
  lines.forEach((l, i) => {
    if (l.includes('leftChars') || l.includes('firstLineChars') || l.includes('hangingChars')) {
      console.log(`${i+1}: ${l.trim()}`);
    }
  });
}

findLeftChars('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js');
findLeftChars('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js');
findLeftChars('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js');
