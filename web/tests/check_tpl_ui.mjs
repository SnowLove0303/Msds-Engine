import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('TEMPLATE_OPTIONS') || lines[i].includes('template-select') || lines[i].includes('handleTemplateChange') || lines[i].includes('switchTemplate')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
