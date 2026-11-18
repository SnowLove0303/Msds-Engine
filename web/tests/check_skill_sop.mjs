import fs from 'fs';

const p = 'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md';
const content = fs.readFileSync(p, 'utf8');
const lines = content.split('\n');

for (let i = 210; i < 280; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
