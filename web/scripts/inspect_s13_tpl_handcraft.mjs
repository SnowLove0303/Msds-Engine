import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function run() {
  console.log('=== TEMPLATE EN ===');
  const bufTpl = fs.readFileSync('public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const zipTpl = await JSZip.loadAsync(bufTpl);
  const xmlTpl = await zipTpl.file('word/document.xml').async('string');
  const docTpl = new DOMParser().parseFromString(xmlTpl);
  const tblsTpl = docTpl.getElementsByTagName('w:tbl');
  const s13Tpl = tblsTpl[12];
  const trsTpl = s13Tpl.getElementsByTagName('w:tr');
  const r3Tpl = trsTpl[trsTpl.length - 1];
  console.log('Template r3 xml:');
  console.log(r3Tpl.toString());

  console.log('\n=== HANDCRAFT CN ===');
  const bufCn = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志 手做改版材料.docx');
  const zipCn = await JSZip.loadAsync(bufCn);
  const xmlCn = await zipCn.file('word/document.xml').async('string');
  const docCn = new DOMParser().parseFromString(xmlCn);
  const tblsCn = docCn.getElementsByTagName('w:tbl');
  const s13Cn = tblsCn[12];
  const trsCn = s13Cn.getElementsByTagName('w:tr');
  const r3Cn = trsCn[trsCn.length - 1];
  console.log('Handcraft r3 xml:');
  console.log(r3Cn.toString());
}
run();
