import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

console.log('Total lines in main.js:', lines.length);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('openPresetManagerModal') || lines[i].includes('openUnifiedExportModal') || lines[i].includes('presets-modal') || lines[i].includes('export-modal')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
