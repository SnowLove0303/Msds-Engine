import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(410, 520).join('\n'));
