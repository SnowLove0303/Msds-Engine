import fs from 'node:fs/promises';
import path from 'node:path';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function scanPuPh() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU';
  const subdirs = await fs.readdir(dir);
  for (const s of subdirs.slice(0, 10)) {
    const full = path.join(dir, s);
    const files = await fs.readdir(full, { recursive: true });
    const doc = files.find(f => /msds_CN.*冠志\.docx$/i.test(f));
    if (doc) {
      const docPath = path.join(full, doc);
      try {
        const buf = await fs.readFile(docPath);
        const eng = await loadDocx(buf, 't.docx');
        const s9 = eng.records.find(r => r.sectionNumber === 9);
        const ph = s9?.rows?.find(r => /pH/i.test(r.cells[0]?.text || ''));
        console.log(`${s}: ${ph?.cells[0]?.text?.trim()} -> ${ph?.cells[1]?.text?.trim()}`);
      } catch (e) {}
    }
  }
}

scanPuPh().catch(console.error);
