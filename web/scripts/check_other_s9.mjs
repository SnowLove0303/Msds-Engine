import fs from 'fs';
import { JSDOM } from '../node_modules/jsdom/lib/api.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

async function checkS9(filePath, label) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  const engine = await loadDocx(buf);
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  console.log(`\n=== ${label} S9 rows count: ${s9?.rows?.length} ===`);
  s9?.rows?.forEach((r, idx) => {
    console.log(`  Row ${idx}: ${JSON.stringify(r.cells.map(c => c.text.trim()))}`);
  });
}

async function main() {
  await checkS9('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx', 'PU-218A Deliverable');
  await checkS9('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx', 'PU-218A Source');
}
main().catch(console.error);
