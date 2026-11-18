import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7700/HPU-7700 msds_CN 冠志.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('text'), 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  console.log('S1:', tbls[0]?.textContent?.slice(0, 150));
  console.log('S2:', tbls[1]?.textContent?.slice(0, 150));
  console.log('S3:', tbls[2]?.textContent?.slice(0, 150));
  console.log('S9:', tbls[8]?.textContent?.slice(0, 200));
}

main().catch(console.error);
