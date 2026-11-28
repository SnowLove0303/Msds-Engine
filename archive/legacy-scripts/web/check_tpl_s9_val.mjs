import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkTplVal() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s9 = tbls[8];
  const trs = s9.getElementsByTagName('w:tr');
  console.log('Row 22 Cell 1 XML in template:');
  console.log(trs[22].getElementsByTagName('w:tc')[1]?.toString());
}
checkTplVal();
