import fs from 'fs';
const api = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/msds-api-controller.js', 'utf8');
const lines = api.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/api/msds/presets') || lines[i].includes('/api/msds/templates')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
