import fs from 'fs';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

async function check(relPath, label) {
  const p = 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\' + relPath;
  const buf = fs.readFileSync(p);
  const engine = await loadDocx(buf, label);
  console.log(`=== ${label} records length: ${engine.records.length} ===`);
  engine.records.forEach((r, i) => {
    console.log(`[${i}] ${r.kind}: secNum=${r.sectionNumber}, title=${(r.title || '').slice(0, 40).replace(/\n/g, ' ')}`);
  });
}

async function main() {
  await check('算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）.docx', 'PA-3654');
}

main().catch(console.error);
