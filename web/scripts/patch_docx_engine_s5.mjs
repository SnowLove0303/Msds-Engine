import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

const target = "if (cell?.record?.sectionNumber && ![2, 6, 9, 10, 11, 12].includes(cell.record.sectionNumber))";
const replacement = "if (cell?.record?.sectionNumber && ![2, 5, 6, 9, 10, 11, 12].includes(cell.record.sectionNumber))";

if (!orig.includes(target)) {
  throw new Error('Target not found in docx-engine.js!');
}

const updated = orig.replace(target, replacement);
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/docx_engine_proposed.js', updated, 'utf8');
console.log('docx_engine_proposed.js created.');
