import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
let code = fs.readFileSync(filePath, 'utf8');

const oldS11Sz = `  const seqSz = !isEnglish ? (numberStr.length >= 5 ? '20' : '21') : (numberStr.length >= 5 ? '18' : '19');`;
const newS11Sz = `  const seqSz = !isEnglish ? (numberStr.length >= 5 ? '19' : '21') : (numberStr.length >= 5 ? '15' : '18');`;

if (!code.includes(oldS11Sz)) {
  console.error('oldS11Sz not found!');
  process.exit(1);
}
// Replace all occurrences (both S11 and S14)
code = code.replaceAll(oldS11Sz, newS11Sz);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/docx_engine_sz_proposed.js', code, 'utf8');
console.log('Successfully generated docx_engine_sz_proposed.js!');
