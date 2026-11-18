import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.split(/\r?\n/);

console.log("=== 1245 - 1310 (Section 2 CN) ===");
for (let i = 1245; i < 1285; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n=== 1340 - 1375 (Section 2 EN) ===");
for (let i = 1340; i < 1375; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n=== 1735 - 1760 (Section 8 hand protection CN) ===");
for (let i = 1735; i < 1760; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n=== 3380 - 3400 (Four engines loop) ===");
for (let i = 3380; i < 3400; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
