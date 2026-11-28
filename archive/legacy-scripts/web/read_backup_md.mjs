import fs from 'node:fs';
import path from 'node:path';

const fp = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736/源文件_用户提供文本备份.md';
if (fs.existsSync(fp)) {
  const content = fs.readFileSync(fp, 'utf8');
  console.log(content.slice(0, 2000));
} else {
  console.log('File does not exist');
}
