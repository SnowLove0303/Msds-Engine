import fs from 'node:fs/promises';
import { loadDocx, writeCellValue } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function updateSourceDocx() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'PU-2346A msds_CN 冠志.docx');

  const s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    for (const r of s9.rows) {
      const lbl = r.cells[0]?.text?.trim();
      if (/pH/i.test(lbl)) {
        console.log(`Original pH row: [${lbl}] -> [${r.cells[1]?.text?.trim()}]`);
        writeCellValue(r.cells[1], '6-9');
        console.log(`Updated pH row: [${lbl}] -> [${r.cells[1]?.text?.trim()}]`);
      }
    }
  }

  const outBuf = await engine.exportArrayBuffer();
  await fs.writeFile(p, Buffer.from(outBuf));
  console.log('Source docx updated successfully!');
}

updateSourceDocx().catch(console.error);
