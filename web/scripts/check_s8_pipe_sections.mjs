import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');

console.log("=== Lines 1895-1925 ===");
for (let j = 1894; j < Math.min(1925, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}

console.log("\n=== Lines 4080-4105 ===");
for (let j = 4079; j < Math.min(4105, lines.length); j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
