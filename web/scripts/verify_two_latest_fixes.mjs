import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  // 1. Check CN Section 2
  const cnBuf = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608\\PU-608 msds_CN 冠志.docx');
  const cnZip = await JSZip.loadAsync(cnBuf);
  const cnXml = await cnZip.file('word/document.xml').async('string');
  const cnDoc = new DOMParser().parseFromString(cnXml, 'text/xml');
  const cnTables = Array.from(cnDoc.getElementsByTagNameNS(W_NS, 'tbl'));
  const cnS2 = cnTables[1];
  const cnRows = Array.from(cnS2.getElementsByTagNameNS(W_NS, 'tr'));

  console.log('=== CN Doc Section 2 Rows ===');
  cnRows.forEach((r, idx) => {
    const text = (r.textContent || '').trim().replace(/\s+/g, ' ');
    console.log(`  Row ${idx}: ${text}`);
  });

  // 2. Check EN Section 8 Recommendation:
  const enBuf = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608\\PU-608 msds_EN Guanzhi.docx');
  const enZip = await JSZip.loadAsync(enBuf);
  const enXml = await enZip.file('word/document.xml').async('string');
  const enDoc = new DOMParser().parseFromString(enXml, 'text/xml');
  const enTables = Array.from(enDoc.getElementsByTagNameNS(W_NS, 'tbl'));
  const enS8 = enTables[7];
  const enS8Rows = Array.from(enS8.getElementsByTagNameNS(W_NS, 'tr'));

  console.log('\n=== EN Doc Section 8 Recommendation Check ===');
  enS8Rows.forEach((r, idx) => {
    if (r.textContent.includes('Recommendation')) {
      const c0 = r.getElementsByTagNameNS(W_NS, 'tc')[0];
      const p = c0?.getElementsByTagNameNS(W_NS, 'p')[0];
      const ind = p?.getElementsByTagNameNS(W_NS, 'ind')[0];
      const left = ind?.getAttributeNS(W_NS, 'left');
      const jc = p?.getElementsByTagNameNS(W_NS, 'jc')[0]?.getAttributeNS(W_NS, 'val');
      console.log(`  Row ${idx} c0 text='${c0?.textContent?.trim()}', left=${left}, jc=${jc}`);
    }
  });
}

main().catch(console.error);
