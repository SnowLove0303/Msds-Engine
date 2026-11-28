import fs from 'fs';
import path from 'path';

function findFiles(dir, filter) {
  let res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) res = res.concat(findFiles(full, filter));
    else if (filter(e.name)) res.push(full);
  }
  return res;
}

const docx = findFiles('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料', f => f.endsWith('.docx') && !f.startsWith('~$'));
console.log('Found docx files:', docx.length);
docx.slice(0, 15).forEach(f => console.log(f.replace('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\源文件材料\\', '')));
