import { convertDocxToPdf } from '../src/pdf-converter.js';
import path from 'node:path';

const p1 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx';
const p2 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';

async function test(p) {
  const tmp = p.replace('.docx', '_test_source.pdf');
  await convertDocxToPdf(p, tmp);
  console.log(path.basename(p), 'converted to PDF successfully at', tmp);
}

await test(p1);
await test(p2);
