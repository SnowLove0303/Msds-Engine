import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

async function traceLoop() {
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const buf = fs.readFileSync(sourcePath);
  const srcEngine = await loadDocx(buf, 'source.docx');
  const srcS2 = srcEngine.records.find(r => r.sectionNumber === 2);
  const rawParas = [];
  for (let r = 1; r < srcS2.rows.length; r++) {
    for (const cell of srcS2.rows[r].cells) {
      for (const p of cell.paragraphs) {
        const txt = p.runs.map(r => r.text).join('').trim();
        if (txt) rawParas.push(txt);
      }
    }
  }

  let mode = '';
  for (let i = 0; i < rawParas.length; i++) {
    const p = rawParas[i];
    console.log(`[i=${i}] p="${p}" | current mode="${mode}"`);
    if (/2\.1\s*GHS危险性类别/i.test(p) || /^物质或混合物分类/i.test(p)) {
      mode = 'cat';
      console.log(`  -> switched mode to 'cat'`);
      continue;
    }
    if (/2\.2\s*GHS标签要素/i.test(p) || /^标签要素/i.test(p)) {
      mode = 'label';
      console.log(`  -> switched mode to 'label'`);
      continue;
    }
  }
}

traceLoop().catch(console.error);
