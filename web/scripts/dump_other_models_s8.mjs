import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;

async function dumpTable8(docxPath, label) {
  if (!fs.existsSync(docxPath)) {
    console.log(`[NOT FOUND] ${docxPath}`);
    return;
  }
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
  await dumpTable8('算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx', 'EC-1804');
  await dumpTable8('算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8123/BL-8123 msds_CN 冠志.docx', 'BL-8123');
  await dumpTable8('算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-6088E/PU-6088E msds_CN 冠志.docx', 'PU-6088E');
}

main().catch(console.error);
