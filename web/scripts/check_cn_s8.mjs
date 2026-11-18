import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
const { loadDocx } = await import('../src/docx-engine.js');

async function main() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx');
  const engine = await loadDocx(buf, 'cn.docx');
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  console.log('CN Section 8 rows:', s8.rows.length);
  s8.rows.forEach((r, idx) => {
    console.log(`Row ${idx}: "${r.cells[0]?.text}" | "${r.cells[1]?.text || ''}"`);
  });
}
main();
