import fs from 'fs';
import { JSDOM } from '../node_modules/jsdom/lib/api.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

async function dumpDocx(filePath, label) {
  const buf = fs.readFileSync(filePath);
  const engine = await loadDocx(buf);
  console.log(`\n=======================================================`);
  console.log(`=== ${label}: ${filePath}`);
  console.log(`=======================================================`);

  // Check header / footer
  const hfs = engine.zip.file(/word\/(header|footer)\d+\.xml/);
  console.log('Header/Footer files:', hfs.map(f => f.name));

  for (let secNum = 1; secNum <= 16; secNum++) {
    const sec = engine.records.find(r => r.sectionNumber === secNum);
    console.log(`\n--- [SECTION ${secNum}] ---`);
    if (!sec) {
      console.log('<< NOT FOUND AS TABLE >>');
      continue;
    }
    sec.rows.forEach((r, idx) => {
      const texts = r.cells.map(c => (c.text || '').replace(/\r?\n/g, '\\n').trim());
      console.log(`  Row ${idx} (${r.cells.length} cols): ${JSON.stringify(texts)}`);
    });
  }
}

async function main() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
  const cnOutPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const enOutPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';

  await dumpDocx(srcPath, 'SOURCE DOCUMENT (源文件母本)');
  await dumpDocx(cnOutPath, 'CN DELIVERABLE (中文交付物)');
  await dumpDocx(enOutPath, 'EN DELIVERABLE (英文交付物)');
}

main().catch(console.error);
