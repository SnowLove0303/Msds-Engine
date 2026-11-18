import fs from 'fs';

const mainPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js';
const mainContent = fs.readFileSync(mainPath, 'utf8');

console.log('mainContent size:', mainContent.length);
console.log('Has exportConfig?', mainContent.includes('exportConfig:'));
console.log('Has renderUnifiedExportModal?', mainContent.includes('function renderUnifiedExportModal'));
console.log('Has renderPresetManagerModal?', mainContent.includes('function renderPresetManagerModal'));
