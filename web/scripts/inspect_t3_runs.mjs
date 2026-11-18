import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';

const filePath = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_CN 冠志.docx';
const buf = fs.readFileSync(filePath);

async function inspectT3Runs() {
  const zip = await JSZip.loadAsync(buf);
  const docEntry = zip.file('word/document.xml');
  const xmlStr = await docEntry.async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const t3 = tables[2];
  const r1 = t3.getElementsByTagNameNS(W_NS, 'tr')[1];
  console.log('Row 1 full XML:\n', r1.toString());
  const r2 = t3.getElementsByTagNameNS(W_NS, 'tr')[2];
  console.log('\nRow 2 full XML:\n', r2.toString());
}

inspectT3Runs().catch(console.error);
