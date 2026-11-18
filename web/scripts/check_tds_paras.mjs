import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkAllText(p) {
  console.log(`\n=== All text in ${p} ===`);
  const buf = await fs.readFile(p);
  const eng = await loadDocx(buf, p);
  const ps = Array.from(eng.documentXml.getElementsByTagName('w:p'));
  for (const p of ps) {
    const t = (p.textContent || '').trim();
    if (t) console.log(t);
  }
}

async function main() {
  await checkAllText('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A tds_CN 冠志.docx');
  await checkAllText('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A tds_EN Guanzhi.docx');
}

main().catch(console.error);
