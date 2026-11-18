import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(1510, 1550).join('\n'));
