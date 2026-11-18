import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. G37 and G38
// ... let's see where '// G-04:' is in content:
const idx = content.indexOf('// G-04:');
console.log('Index:', idx);
console.log('Context:\n' + JSON.stringify(content.slice(idx - 50, idx + 200)));
