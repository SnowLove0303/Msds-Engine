import fs from 'fs';

const skillPath = 'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md';
const content = fs.readFileSync(skillPath, 'utf8');
const lines = content.split('\n');
console.log('SKILL.md total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Phase 0') || lines[i].includes('门禁 1') || lines[i].includes('8 格式') || lines[i].includes('冠志/国彩')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
