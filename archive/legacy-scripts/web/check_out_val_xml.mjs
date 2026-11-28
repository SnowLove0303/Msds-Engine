import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkOutputCell1Xml() {
  const buf = await fs.readFile('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s9 = tbls[8];
  const trs = s9.getElementsByTagName('w:tr');
  console.log('Row 22 Cell 1 in output:');
  console.log(trs[22].getElementsByTagName('w:tc')[1]?.toString());
}
checkOutputCell1Xml();
