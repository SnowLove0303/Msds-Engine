import fs from 'node:fs/promises';
const txt = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/generate_pu2346a_deliverables.mjs', 'utf8');
const m = txt.match(/const sourcePath = '([^']+)';/);
console.log('sourcePath:', m ? m[1] : 'not found');
