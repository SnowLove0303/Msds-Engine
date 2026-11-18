import fs from 'fs';
const api = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/msds-api-controller.js', 'utf8');
const lines = api.split('\n');

for (let i = 585; i < 635; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
