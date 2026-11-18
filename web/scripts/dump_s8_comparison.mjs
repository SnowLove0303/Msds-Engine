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
  await dumpTable8('算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1704/EP-1704 msds_CN 冠志.docx', 'EP-1704 Template CN');
  await dumpTable8('算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx', 'Generated EP-1736 CN');
}

main().catch(console.error);
