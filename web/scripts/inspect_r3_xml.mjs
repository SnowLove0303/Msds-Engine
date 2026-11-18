import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx';
const buf = fs.readFileSync(filePath);

async function inspectRow3Xml() {
  const zip = await JSZip.loadAsync(buf);
  const docEntry = zip.file('word/document.xml');
  const xmlStr = await docEntry.async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const t8 = tables[7];
  const r2 = t8.getElementsByTagNameNS(W_NS, 'tr')[2]; // Row 2: 呼吸系统防护
  const r3 = t8.getElementsByTagNameNS(W_NS, 'tr')[3]; // Row 3: 手部防护
  console.log('Row 2 XML:\n', r2.toString());
  console.log('\nRow 3 XML:\n', r3.toString());
}

inspectRow3Xml().catch(console.error);
