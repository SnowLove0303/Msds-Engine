import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function readDocxSummary(docxPath) {
  if (!fs.existsSync(docxPath)) return `文件不存在: ${docxPath}`;
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')?.async('text');
  if (!xml) return '无法解析 document.xml';
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
  return tbls.map((t, idx) => {
    const txt = (t.textContent || '').replace(/\s+/g, ' ').trim();
    return `[Sec ${idx + 1}] (${txt.length}字): ${txt.substring(0, 100)}...`;
  }).join('\n');
}

async function inspectSourceFiles() {
  const pu218aSrcCandidates = [
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-218A/PU-218A msds_CN 冠志.docx'
  ];
  console.log('=== PU-218A 源文件材料探查 ===');
  for (const p of pu218aSrcCandidates) {
    if (fs.existsSync(p)) {
      console.log(`\n读取路径: ${p}`);
      console.log(await readDocxSummary(p));
      break;
    }
  }

  const pu202cSrcCandidates = [
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-202C/PU-202C msds_CN 冠志.docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202C/源文件留存/PU-202C msds_CN 冠志_源文件留存.docx'
  ];
  console.log('\n=== PU-202C 源文件材料探查 ===');
  for (const p of pu202cSrcCandidates) {
    if (fs.existsSync(p)) {
      console.log(`\n读取路径: ${p}`);
      console.log(await readDocxSummary(p));
      break;
    }
  }
}

inspectSourceFiles().catch(console.error);
