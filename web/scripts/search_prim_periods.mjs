import fs from 'fs';

const content = fs.readFileSync('web/src/universal-editor-primitives.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (i >= 314 && i <= 850) {
    if (l.includes("endsWi") || l.includes("endsWith('.')") || l.includes("+= '.'") || l.includes("+ '.'") || l.includes("replace(/") && l.includes(".")) {
      console.log(`${i+1}: ${l}`);
    }
  }
});
