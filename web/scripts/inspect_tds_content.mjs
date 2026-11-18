import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkTds(p) {
  console.log(`\n=== Checking TDS: ${p} ===`);
  const buf = await fs.readFile(p);
  const eng = await loadDocx(buf, p);
  const xml = eng.documentXml;
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tbls = Array.from(xml.getElementsByTagNameNS(W_NS, 'tbl'));
  for (let t = 0; t < tbls.length; t++) {
    console.log(`Table ${t}:`);
    const trs = Array.from(tbls[t].getElementsByTagNameNS(W_NS, 'tr'));
    for (let r = 0; r < trs.length; r++) {
      const tcs = Array.from(trs[r].getElementsByTagNameNS(W_NS, 'tc'));
      const texts = tcs.map(tc => (tc.textContent || '').trim());
      console.log(`  Row ${r}: ${texts.join(' | ')}`);
    }
  }
}

async function main() {
  await checkTds('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A tds_CN 冠志.docx');
  await checkTds('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A tds_EN Guanzhi.docx');
}

main().catch(console.error);
