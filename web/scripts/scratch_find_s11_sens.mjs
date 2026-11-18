import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A';
  const cnBuf = fs.readFileSync(path.join(targetDir, 'PU-2346A msds_CN 冠志.docx'));
  const engine = await loadDocx(cnBuf, 'cn.docx');
  const s11 = engine.records.find(r => r.sectionNumber === 11);
  s11.rows.forEach((r, i) => {
    if (/致敏/i.test(r.cells[0]?.text || '')) {
      console.log(`--- Row ${i}: ${r.cells[0]?.text} ---`);
      console.log(`Value paras (${r.cells[1]?.paragraphs?.length}):`);
      r.cells[1]?.paragraphs?.forEach((p, pi) => {
        console.log(`  p[${pi}]: ${JSON.stringify(p.text)}`);
      });
    }
  });
}

main().catch(console.error);
