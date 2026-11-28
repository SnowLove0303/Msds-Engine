import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log(lines.slice(3913, 3935).map((l, i) => `${i+3914}: ${JSON.stringify(l)}`).join('\n'));
