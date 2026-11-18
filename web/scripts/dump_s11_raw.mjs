import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

async function dumpRawTable10() {
  const goldPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志 手做改版材料.docx';
  const genPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx';

  const zipGold = await JSZip.loadAsync(fs.readFileSync(goldPath));
  const docGold = new DOMParser().parseFromString(await zipGold.file('word/document.xml').async('text'), 'text/xml');
  const tblGold = docGold.getElementsByTagName('w:tbl')[10];

  const zipGen = await JSZip.loadAsync(fs.readFileSync(genPath));
  const docGen = new DOMParser().parseFromString(await zipGen.file('word/document.xml').async('text'), 'text/xml');
  const tblGen = docGen.getElementsByTagName('w:tbl')[10];

  const ser = new XMLSerializer();
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/s11_gold_raw.xml', ser.serializeToString(tblGold), 'utf8');
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/s11_gen_raw.xml', ser.serializeToString(tblGen), 'utf8');
  console.log('Written s11_gold_raw.xml and s11_gen_raw.xml successfully.');
}

dumpRawTable10().catch(console.error);
