import fs from 'fs';

const content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 902; i < 915; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
