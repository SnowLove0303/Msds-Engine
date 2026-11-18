import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkGuocai() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));
  console.log('DOCX files:', files);

  for (const f of files) {
    const p = `${dir}/${f}`;
    const zip = await JSZip.loadAsync(fs.readFileSync(p));
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const tbls = doc.getElementsByTagName('w:tbl');
    const tbl8 = tbls[7];
    const r2c1 = tbl8.getElementsByTagName('w:tr')[2]?.getElementsByTagName('w:tc')[1];
    const b2 = r2c1?.getElementsByTagName('w:b').length > 0;
    console.log(`${f} -> Tbl 8 Row 2 Cell 1 isBold: ${b2}, text: ${r2c1?.textContent?.trim()}`);
  }
}
checkGuocai().catch(console.error);
