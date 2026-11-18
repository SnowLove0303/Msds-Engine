import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function checkP4Runs() {
  const enGz = path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx');
  const enZip = await JSZip.loadAsync(fs.readFileSync(enGz));
  const enXml = await enZip.file('word/document.xml').async('string');
  const enDoc = new DOMParser().parseFromString(enXml, 'text/xml');
  const tbl7 = enDoc.getElementsByTagName('w:tbl')[7];
  const r3 = tbl7.getElementsByTagName('w:tr')[3];
  console.log('EN Table 7 Row 3 XML:\n', r3.toString());
}
checkP4Runs().catch(console.error);
