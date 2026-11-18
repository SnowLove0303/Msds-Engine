import fs from 'fs';

const p = 'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md';
const content = fs.readFileSync(p, 'utf8');
const lines = content.split('\n');

console.log('--- Lines 1-40 ---');
for (let i = 0; i < 40; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
