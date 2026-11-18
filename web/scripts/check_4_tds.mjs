import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A';

async function checkTds(fName) {
  const p = `${dir}/${fName}`;
  const buf = await fs.readFile(p);
  const eng = await loadDocx(buf, fName);
  console.log(`\n--- ${fName} ---`);
  for (const pNode of Array.from(eng.documentXml.getElementsByTagName('w:p'))) {
    const t = (pNode.textContent || '').trim();
    if (t.includes('供应形式') || t.includes('Supply Form') || t.includes('二甲基') || t.includes('三乙胺') || t.includes('dimethyl') || t.includes('triethyl')) {
      console.log('Paragraph:', t);
    }
  }
  for (const tc of Array.from(eng.documentXml.getElementsByTagName('w:tc'))) {
    const t = (tc.textContent || '').trim();
    if (t.includes('PH') || t.includes('pH')) {
      console.log('Cell:', t);
    }
  }
}

async function main() {
  await checkTds('PU-2346A tds_CN 冠志.docx');
  await checkTds('PU-2346A tds_CN 国彩.docx');
  await checkTds('PU-2346A tds_EN Guanzhi.docx');
  await checkTds('PU-2346A tds_EN Guocai.docx');
}

main().catch(console.error);
