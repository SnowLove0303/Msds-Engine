import fs from 'fs';
import path from 'path';

function find(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) find(p);
    else if (f.includes('PA-4780 msds_CN')) console.log(p);
  }
}
find('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料');
