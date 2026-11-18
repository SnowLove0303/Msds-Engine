import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = code.split('\n');

console.log("=== Lines 3375-3410 ===");
for (let j = 3374; j < Math.min(3410, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}

console.log("\n=== Lines 3650-3685 ===");
for (let j = 3649; j < Math.min(3685, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
