import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

const pyCode = `
import pymupdf, sys
doc = pymupdf.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A tds_CN 冠志.pdf")
for page in doc:
    print(page.get_text())
`;

async function readTds() {
  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/read_tds.py', pyCode);
  const out = execSync('python "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/read_tds.py"', { encoding: 'utf8' });
  console.log(out);
}

readTds().catch(console.error);
