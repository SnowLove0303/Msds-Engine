import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
const idx = content.indexOf('// G-04:');
console.log(content.slice(idx, idx + 800));
