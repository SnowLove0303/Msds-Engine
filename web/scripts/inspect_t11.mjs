import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx';
const buf = fs.readFileSync(filePath);

async function inspectT11() {
  const zip = await JSZip.loadAsync(buf);
  const docEntry = zip.file('word/document.xml');
  const xmlStr = await docEntry.async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const t11 = tables[10]; // Table 11
  const rows = Array.from(t11.getElementsByTagNameNS(W_NS, 'tr'));
  console.log(`Table 11 rows: ${rows.length}`);
  rows.slice(0, 10).forEach((r, idx) => {
    const c0 = r.getElementsByTagNameNS(W_NS, 'tc')[0];
    const p = c0?.getElementsByTagNameNS(W_NS, 'p')[0];
    const ind = p?.getElementsByTagNameNS(W_NS, 'ind')[0];
    const text = c0?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const leftVal = ind?.getAttributeNS(W_NS, 'left') || ind?.getAttribute('w:left') || 'none';
    const hangVal = ind?.getAttributeNS(W_NS, 'hanging') || ind?.getAttribute('w:hanging') || 'none';
    const runs = Array.from(p?.getElementsByTagNameNS(W_NS, 'r') || []);
    const runsInfo = runs.map(rn => {
      const t = rn.getElementsByTagNameNS(W_NS, 't')[0]?.textContent || '';
      const hasTab = rn.getElementsByTagNameNS(W_NS, 'tab').length > 0;
      return `"${t}"${hasTab ? '+<tab/>' : ''}`;
    }).join(' | ');
    console.log(`Row ${idx}: "${text.slice(0, 30)}" -> left=${leftVal}, hang=${hangVal}\n    Runs: ${runsInfo}`);
  });
}

inspectT11().catch(console.error);
