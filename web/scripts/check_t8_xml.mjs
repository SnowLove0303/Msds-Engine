import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const outCnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";
const outEnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_EN Guanzhi.docx";

async function checkIndentAndSize() {
  const ser = new XMLSerializer();
  // Check CN
  const bufCn = fs.readFileSync(outCnPath);
  const zipCn = await JSZip.loadAsync(bufCn);
  const docCn = new DOMParser().parseFromString(await zipCn.file('word/document.xml').async('text'), 'text/xml');
  const tbl8Cn = docCn.getElementsByTagName('w:tbl')[7];
  const tr3Cn = tbl8Cn.getElementsByTagName('w:tr')[3];
  console.log('CN Hand Protection Row 3 Cell 0 XML:');
  console.log(ser.serializeToString(tr3Cn.getElementsByTagName('w:tc')[0]));

  // Check EN
  const bufEn = fs.readFileSync(outEnPath);
  const zipEn = await JSZip.loadAsync(bufEn);
  const docEn = new DOMParser().parseFromString(await zipEn.file('word/document.xml').async('text'), 'text/xml');
  const tbl8En = docEn.getElementsByTagName('w:tbl')[7];
  const tr3En = tbl8En.getElementsByTagName('w:tr')[3];
  console.log('\nEN Hand Protection Row 3 Cell 0 XML:');
  console.log(ser.serializeToString(tr3En.getElementsByTagName('w:tc')[0]));
}

checkIndentAndSize();
