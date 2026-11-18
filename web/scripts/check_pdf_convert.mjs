import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/generate_pu2346a_deliverables.mjs', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(0, 80).join('\n'));
