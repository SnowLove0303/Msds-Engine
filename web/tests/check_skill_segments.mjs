import fs from 'fs';

const skillPath = 'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md';
const content = fs.readFileSync(skillPath, 'utf8');
const lines = content.split('\n');

console.log('--- Lines 1-30 ---');
for (let i = 0; i < 30; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('--- Lines 210-260 ---');
for (let i = 210; i < 260; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
