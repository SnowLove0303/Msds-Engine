import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';
import { runSmartMatching } from './src/smart-matching.js';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function detailedDiff() {
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx';
  const outPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志.docx';

  const srcBuf = await fs.readFile(sourcePath);
  const srcEng = await loadDocx(srcBuf, 'source.docx');

  const outBuf = await fs.readFile(outPath);
  const outEng = await loadDocx(outBuf, 'output.docx');

  console.log('========================================================================');
  console.log('🔍 EP-1702 源文件 vs 产出物 (EP-1702 msds_CN 冠志.docx) 逐章节内容深度比对');
  console.log('========================================================================\n');

  for (let s = 1; s <= 16; s++) {
    const srcSec = srcEng.records.find(r => r.sectionNumber === s);
    const outSec = outEng.records.find(r => r.sectionNumber === s);

    console.log(`### 【第 ${s} 部分: ${srcSec?.title || outSec?.title || '未命名'}】`);
    console.log(`源文件行数: ${srcSec?.rows?.length ?? 0} | 产出物行数: ${outSec?.rows?.length ?? 0}`);

    const srcRows = (srcSec?.rows || []).map(r => r.cells.map(c => c.text.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '));
    const outRows = (outSec?.rows || []).map(r => r.cells.map(c => c.text.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '));

    console.log('--- 源文件内容 ---');
    srcRows.forEach((r, idx) => console.log(`  [S-R${idx}] ${r}`));

    console.log('--- 产出物内容 ---');
    outRows.forEach((r, idx) => console.log(`  [O-R${idx}] ${r}`));
    console.log('\n');
  }
}

detailedDiff().catch(console.error);
