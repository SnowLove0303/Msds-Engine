import fs from 'fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/CHANGELOG.md';
console.log('CHANGELOG.md exists?', fs.existsSync(p));
if (fs.existsSync(p)) {
  console.log('First 500 chars:\n', fs.readFileSync(p, 'utf8').substring(0, 500));
}
