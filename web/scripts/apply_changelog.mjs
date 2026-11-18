import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/CHANGELOG.md';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/changelog_entry.md', 'utf8');

const insertIdx = content.indexOf('## [2026-11-10');
if (insertIdx === -1) {
  console.error('Insert point not found!');
  process.exit(1);
}

content = content.substring(0, insertIdx) + newEntry + '\n\n' + content.substring(insertIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('CHANGELOG.md updated successfully!');
