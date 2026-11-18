import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('preset-manager-dialog') || lines[i].includes('renderPresetManagerModal') || lines[i].includes('renderUnifiedExportModal') || lines[i].includes('export-dialog')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
