import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function findDocx(dir, pattern) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const res = findDocx(p, pattern);
      if (res) return res;
    } else if (e.name.toLowerCase().includes(pattern.toLowerCase()) && e.name.endsWith('.docx') && !e.name.startsWith('~$')) {
      return p;
    }
  }
  return null;
}

async function extractRawSourceLines(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const docXmlStr = await zip.file('word/document.xml').async('string');
  const parser = new DOMParser();
  const doc = parser.parseFromString(docXmlStr, 'application/xml');
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0];

  const rawLines = [];
  let drawingCount = 0;

  if (body) {
    drawingCount = body.getElementsByTagNameNS(W_NS, 'drawing').length;
    const paragraphs = Array.from(body.getElementsByTagNameNS(W_NS, 'p'));
    for (const p of paragraphs) {
      const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) rawLines.push(text);
    }
  }

  const rawChars = rawLines.join('').replace(/\s+/g, '').length;
  return { rawLines, rawChars, drawingCount };
}

function collectContext1Text(facts) {
  const c1Texts = [];
  for (let s = 1; s <= 16; s++) {
    const sec = facts.sections?.[s];
    if (!sec) continue;
    if (sec.title) c1Texts.push(sec.title);
    for (const row of (sec.rows || [])) {
      for (const cell of (row.cells || [])) {
        if (cell.text) c1Texts.push(cell.text);
      }
    }
  }
  return c1Texts;
}

async function auditFile(label, filePath) {
  const out = [];
  out.push(`\n## 样本: ${label}`);
  out.push(`- **源文件路径**: \`${filePath}\``);

  const { rawLines, rawChars, drawingCount } = await extractRawSourceLines(filePath);
  const facts = await recognizeSourceDocx(filePath, path.basename(filePath));
  const c1Texts = collectContext1Text(facts);
  const c1Joined = c1Texts.join('\n').replace(/\s+/g, '');

  // Check missing lines from raw source
  const missingLines = [];
  for (const line of rawLines) {
    const compact = line.replace(/\s+/g, '');
    if (compact.length >= 2 && !c1Joined.includes(compact)) {
      // Check if individual fragments exist or truly missing
      missingLines.push(line);
    }
  }

  const emptySections = [];
  for (let s = 1; s <= 16; s++) {
    const sec = facts.sections?.[s];
    if (!sec || sec.rowsCount === 0) {
      emptySections.push(s);
    }
  }

  const conservationRatio = rawChars > 0 ? ((c1Joined.length / rawChars) * 100).toFixed(2) : '0.00';

  out.push(`- **原始正文非空段落数**: ${rawLines.length} | **原始总字符数**: ${rawChars} | **Drawing 象形图数**: ${drawingCount}`);
  out.push(`- **Context 1 提取字符数**: ${c1Joined.length} | **表观字符守恒率**: ${conservationRatio}%`);
  out.push(`- **空缺章节 (rowsCount===0)**: ${emptySections.length > 0 ? emptySections.join(', ') : '无 (16/16 全覆盖)'}`);
  out.push(`- **未在 Context 1 ` + '`sections[1..16]`' + ` 中完整匹配到的原始段落数**: ${missingLines.length}`);
  if (missingLines.length > 0) {
    out.push(`  - 缺失段落样本（前15条）:`);
    for (const ml of missingLines.slice(0, 15)) {
      out.push(`    - \`${ml.slice(0, 120)}\``);
    }
  }

  // Check semantic/structural anti-patterns in current recognition-engine
  const defects = [];
  if (facts.transport?.packingGroup && /温度|高于|低于|远离|非危险/i.test(facts.transport.packingGroup)) {
    defects.push(`[S14.4 错位] packingGroup 被污染为: "${facts.transport.packingGroup}"`);
  }
  if (facts.ghs?.hazardStatements?.some(h => h.text && !rawLines.join(' ').includes(h.text.slice(0, 8)))) {
    defects.push(`[GHS 字典外生替换] hazardStatements 存在未在源文件中出现的文本`);
  }
  if (facts.transport?.additionalInfo?.itemsEn?.length > 0 || facts.transport?.specialPrecautions?.primaryEn) {
    defects.push(`[职责越界] Context 1 内混杂了英文翻译输出 (应交由 Context 2)`);
  }
  if (facts.componentsNotes?.length === 0 && rawLines.some(l => /请注意以下物质|中和剂|已键合为盐/i.test(l))) {
    defects.push(`[S3 附注遗漏] 源文件包含成盐/聚合物附注，但 componentsNotes 为空`);
  }

  out.push(`- **结构与污染诊断**: ${defects.length > 0 ? defects.join('； ') : '无'}`);
  return out.join('\n');
}

async function main() {
  const base = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料';
  const targets = [
    ['PA-4840', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx'],
    ['PA-4902', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx'],
    ['PU-202A', findDocx(base, 'PU-202A msds_CN')],
    ['PU-2346A', findDocx(base, 'PU-2346A msds_CN')],
    ['EP-8801', findDocx(base, 'EP-8801 msds_CN')],
    ['OS-79A', findDocx(base, 'OS-79A msds_CN')]
  ];

  const report = ['# 识别模块 (Context 1) 源文件直读 vs 提取结果对照审计报告\n'];
  for (const [label, fp] of targets) {
    if (!fp || !fs.existsSync(fp)) {
      report.push(`\n## 样本: ${label}\n- ❌ 未找到源文件`);
      continue;
    }
    report.push(await auditFile(label, fp));
  }

  const outPath = 'C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/context1_audit_report.md';
  fs.writeFileSync(outPath, report.join('\n'), 'utf8');
  console.log('Audit complete. Report written to:', outPath);
}

main().catch(console.error);
