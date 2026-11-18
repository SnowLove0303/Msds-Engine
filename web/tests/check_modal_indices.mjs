import fs from 'fs';
const main = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js', 'utf8');
const lines = main.split('\n');

console.log('computeExportTargets starts at:', lines.findIndex(l => l.includes('function computeExportTargets')) + 1);
console.log('renderUnifiedExportModal starts at:', lines.findIndex(l => l.includes('function renderUnifiedExportModal')) + 1);
console.log('renderPresetManagerModal starts at:', lines.findIndex(l => l.includes('function renderPresetManagerModal')) + 1);
console.log('renderVersionModal starts at:', lines.findIndex(l => l.includes('function renderVersionModal')) + 1);
