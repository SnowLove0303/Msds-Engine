import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');
const idx = code.indexOf('export function renderFullWidthRow');
console.log(code.substring(idx + 2500, idx + 4500));
