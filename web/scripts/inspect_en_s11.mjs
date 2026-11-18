import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const zipData = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_EN Guanzhi.docx');
const zip = await JSZip.loadAsync(zipData);
const docXmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(docXmlStr, 'application/xml');

const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
const s11Tbl = tbls[10];
const rows = Array.from(s11Tbl.getElementsByTagName('w:tr'));
for (const idx of [3, 12]) {
  const r = rows[idx];
  const c0 = Array.from(r?.getElementsByTagName('w:tc') || [])[0];
  const p = c0?.getElementsByTagName('w:p')[0];
  const r0 = Array.from(p?.getElementsByTagName('w:r') || [])[0];
  console.log(`EN Row ${idx}:`, r0?.toString());
}
