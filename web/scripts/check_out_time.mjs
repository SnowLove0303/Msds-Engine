import fs from 'fs';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80';
fs.readdirSync(dir).forEach(f => {
  const stat = fs.statSync(dir + '/' + f);
  console.log(f, stat.size, 'bytes, mtime:', stat.mtime.toLocaleTimeString());
});
