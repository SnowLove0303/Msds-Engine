import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function run() {
  const buf = fs.readFileSync('public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml);
  const tbls = doc.getElementsByTagName('w:tbl');
  const s13 = tbls[12];
  const trs = s13.getElementsByTagName('w:tr');
  const r3 = trs[trs.length - 1];
  const c1 = r3.getElementsByTagName('w:tc')[1];
  const pPr = c1.getElementsByTagName('w:pPr')[0];
  const jc = pPr?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  console.log('CN template S13 c1 jc:', jc);
}
run();
