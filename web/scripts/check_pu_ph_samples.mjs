import fs from 'node:fs/promises';
import path from 'node:path';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkSamplePuModels() {
  const base = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU';
  const dirs = ['PU-202A', 'PU-202B', 'PU-303A', 'PU-608', 'PU-1003', 'PU-2346'];
  for (const d of dirs) {
    const cnDoc = path.join(base, d, `${d} msds_CN 冠志.docx`);
    const enDoc = path.join(base, d, `${d} msds_EN Guanzhi.docx`);
    try {
      const cnBuf = await fs.readFile(cnDoc);
      const cnEng = await loadDocx(cnBuf, 'cn.docx');
      const cnS9 = cnEng.records.find(r => r.sectionNumber === 9);
      const cnPhRow = cnS9?.rows?.find(r => /pH/i.test(r.cells[0]?.text || ''));

      const enBuf = await fs.readFile(enDoc);
      const enEng = await loadDocx(enBuf, 'en.docx');
      const enS9 = enEng.records.find(r => r.sectionNumber === 9);
      const enPhRow = enS9?.rows?.find(r => /pH/i.test(r.cells[0]?.text || ''));

      console.log(`[${d}]`);
      console.log('  CN:', cnPhRow?.cells[0]?.text?.trim(), '-->', cnPhRow?.cells[1]?.text?.trim());
      console.log('  EN:', enPhRow?.cells[0]?.text?.trim(), '-->', enPhRow?.cells[1]?.text?.trim());
    } catch (e) {
      // ignore missing
    }
  }
}

checkSamplePuModels().catch(console.error);
