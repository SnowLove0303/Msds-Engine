import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
import path from 'path';

const filePath = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_CN 冠志.docx';
const buf = fs.readFileSync(filePath);

async function checkNumPr() {
  const zip = await JSZip.loadAsync(buf);
  const docEntry = zip.file('word/document.xml');
  const xmlStr = await docEntry.async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  console.log('Tables count:', tables.length);

  tables.forEach((tbl, tIdx) => {
    const numPrs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'numPr'));
    if (numPrs.length > 0) {
      console.log(`Table ${tIdx + 1} has ${numPrs.length} numPr elements:`);
      const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      rows.forEach((r, rIdx) => {
        const rNumPrs = Array.from(r.getElementsByTagNameNS(W_NS, 'numPr'));
        if (rNumPrs.length > 0) {
          const text = r.textContent?.replace(/\s+/g, ' ').trim() || '';
          console.log(`  Row ${rIdx}: "${text.slice(0, 40)}" has ${rNumPrs.length} numPr`);
        }
      });
    }
  });

  // check body paragraphs outside tables
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0];
  const directPs = Array.from(body.childNodes).filter(n => n.nodeName === 'w:p');
  console.log(`Direct body paragraphs outside tables: ${directPs.length}`);
  const outsideNumPrs = directPs.flatMap(p => Array.from(p.getElementsByTagNameNS(W_NS, 'numPr')));
  console.log(`Outside tables numPr count: ${outsideNumPrs.length}`);
}

checkNumPr().catch(console.error);
