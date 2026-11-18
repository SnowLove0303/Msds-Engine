import fs from 'fs';
import path from 'path';

const srcDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else if (f.endsWith('.docx') && f.includes('msds_CN')) {
      console.log('Found:', full);
    }
  }
}

scanDir(srcDir);
