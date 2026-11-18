import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');

console.log("=== Lines 4100-4170 ===");
for (let j = 4100; j < Math.min(4170, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
