import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function inspectDoc(filePath, label) {
  console.log(`\n=== [${label}] ${filePath} ===`);
  try {
    const buf = await fs.readFile(filePath);
    const engine = await loadDocx(buf, filePath);
    
    // Section 14
    const s14 = engine.records.find(r => r.sectionNumber === 14);
    if (s14) {
      console.log('--- Section 14 Rows ---');
      for (let i = 0; i < s14.rows.length; i++) {
        const c0 = s14.rows[i].cells[0]?.text || '';
        const c1 = s14.rows[i].cells[1]?.text || '';
        console.log(`Row ${i}: [${c0.trim()}] | [${c1.trim()}]`);
      }
    } else {
      console.log('Section 14 NOT found!');
    }

    // Section 11
    const s11 = engine.records.find(r => r.sectionNumber === 11);
    if (s11) {
      console.log('--- Section 11 Rows ---');
      for (let i = 0; i < s11.rows.length; i++) {
        const c0 = s11.rows[i].cells[0]?.text || '';
        const c1 = s11.rows[i].cells[1]?.text || '';
        console.log(`Row ${i}: [${c0.trim()}] | [${c1.trim()}]`);
      }
    }
  } catch (e) {
    console.error(`Failed to read: ${e.message}`);
  }
}

async function main() {
  const srcCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const outCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.docx';
  const outEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_EN Guanzhi.docx';
  
  await inspectDoc(srcCn, 'SOURCE CN');
  await inspectDoc(outCn, 'OUTPUT CN');
  await inspectDoc(outEn, 'OUTPUT EN');
}

main().catch(console.error);
