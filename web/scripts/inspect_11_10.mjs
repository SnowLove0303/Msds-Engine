import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx';
const buf = fs.readFileSync(filePath);

async function inspect11_10() {
  const zip = await JSZip.loadAsync(buf);
  const docEntry = zip.file('word/document.xml');
  const xmlStr = await docEntry.async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const t11 = tables[10];
  const rows = Array.from(t11.getElementsByTagNameNS(W_NS, 'tr'));
  const r12 = rows.find(r => r.textContent.includes('11.10'));
  console.log('11.10 row XML:\n', r12.toString());
}

inspect11_10().catch(console.error);
