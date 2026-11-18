import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'node:fs/promises';

async function testUniversalOmissionCheck() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A';
  const cnBuf = await fs.readFile(`${targetDir}/PU-2346A msds_CN 冠志.docx`);
  const enBuf = await fs.readFile(`${targetDir}/PU-2346A msds_EN Guanzhi.docx`);
  const cnDocx = await loadDocx(cnBuf);
  const enDocx = await loadDocx(enBuf);

  let omissionPass = true;
  let omissionDetails = [];

  for (let sNum = 1; sNum <= 16; sNum++) {
    const cnSec = cnDocx.records.find(r => r.sectionNumber === sNum);
    const enSec = enDocx.records.find(r => r.sectionNumber === sNum);
    if (!cnSec || !enSec) continue;

    const cnText = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    const enText = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');

    // 1. Check OECD guidelines
    const oecdMatches = Array.from(cnText.matchAll(/OECD\s*(?:化学品测试指南|测试导则)?\s*(\d+[A-Za-z]?)/gi));
    for (const m of oecdMatches) {
      const guidelineNum = m[1];
      const enRegex = new RegExp(`OECD(?:\\s*Test\\s*Guideline)?\\s*${guidelineNum}`, 'i');
      if (!enRegex.test(enText)) {
        omissionPass = false;
        omissionDetails.push(`Section ${sNum} 英文遗漏 OECD 导则号 ${guidelineNum}`);
      }
    }
  }

  console.log('Universal Omission Result:', { omissionPass, omissionDetails });
}

testUniversalOmissionCheck().catch(console.error);
