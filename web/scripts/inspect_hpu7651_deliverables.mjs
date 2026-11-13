import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

async function inspectDocx(fileName) {
  const filePath = path.join(targetDir, fileName);
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const tblNodes = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  console.log(`\n============================================================`);
  console.log(`🔍 审查文档: ${fileName} (表格数量: ${tblNodes.length})`);
  console.log(`============================================================`);

  tblNodes.forEach((tbl, tIdx) => {
    const text = tbl.textContent || '';
    const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));

    // Section 1
    if (text.includes('化学品及企业标识') || text.includes('Chemical Product and Company')) {
      const s1Rows = trs.map(tr => Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map(tc => tc.textContent.trim().replace(/\s+/g, ' ')));
      console.log(`\n[Section 1] 行数: ${s1Rows.length}`);
      s1Rows.slice(0, 6).forEach((r, i) => console.log(`  Row ${i}:`, r.join(' | ')));
    }

    // Section 2
    if (text.includes('危险性概述') || text.includes('Hazards Identification')) {
      const s2Rows = trs.map(tr => Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map(tc => tc.textContent.trim().replace(/\s+/g, ' ')));
      console.log(`\n[Section 2] 行数: ${s2Rows.length}`);
      s2Rows.forEach((r, i) => console.log(`  Row ${i}:`, r.join(' | ')));
    }

    // Section 3
    if (text.includes('成分/组成信息') || text.includes('Composition/Information')) {
      const s3Rows = trs.map(tr => Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map(tc => tc.textContent.trim().replace(/\s+/g, ' ')));
      console.log(`\n[Section 3] 行数: ${s3Rows.length}`);
      s3Rows.forEach((r, i) => console.log(`  Row ${i}:`, r.join(' | ')));
    }

    // Section 8
    if (text.includes('接触控制') || text.includes('Exposure Controls')) {
      const s8Rows = trs.map(tr => Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map(tc => tc.textContent.trim().replace(/\s+/g, ' ')));
      console.log(`\n[Section 8] 行数: ${s8Rows.length}`);
      s8Rows.slice(0, 5).forEach((r, i) => console.log(`  Row ${i}:`, r.join(' | ')));
    }

    // Section 9
    if (text.includes('理化特性') || text.includes('Physical and Chemical')) {
      const s9Rows = trs.map(tr => Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map(tc => tc.textContent.trim().replace(/\s+/g, ' ')));
      console.log(`\n[Section 9] 行数: ${s9Rows.length}`);
      s9Rows.slice(0, 8).forEach((r, i) => console.log(`  Row ${i}:`, r.join(' | ')));
    }

    // Section 14
    if (text.includes('运输信息') || text.includes('Transport Information')) {
      const s14Rows = trs.map(tr => Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map(tc => tc.textContent.trim().replace(/\s+/g, ' ')));
      console.log(`\n[Section 14] 行数: ${s14Rows.length}`);
      s14Rows.slice(0, 6).forEach((r, i) => console.log(`  Row ${i}:`, r.join(' | ')));
    }
  });

  // Check for Chinese residues in English deliverables
  if (fileName.includes('msds_EN')) {
    const fullText = doc.documentElement.textContent || '';
    const chineseMatches = fullText.match(/[\u4e00-\u9fa5]+/g) || [];
    console.log(`\n[英文文档中文字符检测]: 共发现 ${chineseMatches.length} 处中文字符`);
    const uniqueCn = Array.from(new Set(chineseMatches));
    console.log(`  排重中文字符样本:`, uniqueCn);
  }
}

async function run() {
  await inspectDocx('HPU-7651 msds_CN 冠志.docx');
  await inspectDocx('HPU-7651 msds_EN Guanzhi.docx');
}

run().catch(console.error);
