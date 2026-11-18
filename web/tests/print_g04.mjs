import fs from 'node:fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(175, 198).join('\n'));
