import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;

async function dumpTable8(docxPath, label) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xmlStr = await zip.file('word/document.xml').async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  const t8 = tables[7];
  console.log(`=== ${label} Table 8 (Rows: ${t8 ? t8.getElementsByTagNameNS(W_NS, 'tr').length : 0}) ===`);
  if (!t8) return;
  const trs = Array.from(t8.getElementsByTagNameNS(W_NS, 'tr'));
  trs.forEach((tr, idx) => {
    const tcs = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
    const cellTexts = tcs.map(tc => {
      const ps = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
      return ps.map(p => Array.from(p.getElementsByTagNameNS(W_NS, 't')).map(t => t.textContent).join('')).join('\n');
    });
    console.log(`Row ${idx} [${tcs.length} cells]:`, JSON.stringify(cellTexts));
  });
}

async function main() {
  await dumpTable8('web/public/templates/正式模板_MSDS_CN_冠志(1).docx', 'Official Template CN');
  await dumpTable8('web/public/templates/正式模板_MSDS_EN_冠志(1).docx', 'Official Template EN');
}

main().catch(console.error);
