import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = content.slice(0, 3000);
console.log('Import check:', lines.includes('formatSection9LabelCell'));
