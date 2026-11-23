#!/usr/bin/env node
/**
 * MSDS-Studio Agent 介入审计速查包生成器 (generate_agent_audit_brief.mjs)
 *
 * 核心使命：
 *   彻底解决 Agent 每次介入审计时通读 330KB pipeline-engine.js 及分散规范耗时过长的问题。
 *   自动在目标目录生成 <MODEL>_agent_audit_brief.md，内含：
 *     1. 一页纸《Pipeline + 全局/局部规范终审速查契约》
 *     2. 《双主体（冠志 vs 国彩）页眉页脚实测提取对比》
 *     3. 《16 章节源文件 vs CN 产出 vs EN 产出逐节对照快照》
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { loadDocx } from '../src/docx-engine.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--targetDir=')) args.targetDir = a.slice(12).replace(/^["']|["']$/g, '');
    else if (a.startsWith('--model=')) args.model = a.slice(8).replace(/^["']|["']$/g, '');
    else if (a.startsWith('--source=')) args.source = a.slice(9).replace(/^["']|["']$/g, '');
  }
  return args;
}

async function extractHeaderFooterText(docxPath) {
  if (!fs.existsSync(docxPath)) return '*(文件不存在)*';
  const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
  const hfKeys = Object.keys(zip.files).filter(k => /^word\/(?:header|footer)\d+\.xml$/i.test(k)).sort();
  const texts = [];
  for (const k of hfKeys) {
    const xml = await zip.file(k).async('string');
    const plain = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain) texts.push(`[${path.basename(k)}] ${plain}`);
  }
  return texts.join(' | ') || '*(无文本)*';
}

function summarizeRecords(records) {
  const map = new Map();
  for (const rec of records || []) {
    if (!rec.sectionNumber || rec.sectionNumber < 1 || rec.sectionNumber > 16) continue;
    const rows = (rec.rows || []).slice(1);
    const preview = rows
      .map(r => (r.cells || []).map(c => (c.text || '').trim()).filter(Boolean).join(' : '))
      .filter(Boolean)
      .join(' / ');
    map.set(rec.sectionNumber, { rowCount: (rec.rows || []).length, preview });
  }
  return map;
}

export async function generateAgentAuditBrief({ targetDir, modelCode, sourcePath }) {
  const cnGzPath = path.join(targetDir, `${modelCode} msds_CN 冠志.docx`);
  const cnGcPath = path.join(targetDir, `${modelCode} msds_CN 国彩.docx`);
  const enGzPath = path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`);
  const enGcPath = path.join(targetDir, `${modelCode} msds_EN Guocai.docx`);

  const srcDoc = sourcePath && fs.existsSync(sourcePath) ? await loadDocx(fs.readFileSync(sourcePath), path.basename(sourcePath)) : null;
  const cnDoc = fs.existsSync(cnGzPath) ? await loadDocx(fs.readFileSync(cnGzPath), path.basename(cnGzPath)) : null;
  const cnGcDoc = fs.existsSync(cnGcPath) ? await loadDocx(fs.readFileSync(cnGcPath), path.basename(cnGcPath)) : null;
  const enDoc = fs.existsSync(enGzPath) ? await loadDocx(fs.readFileSync(enGzPath), path.basename(enGzPath)) : null;

  const srcMap = summarizeRecords(srcDoc?.records);
  const cnMap = summarizeRecords(cnDoc?.records);
  const cnGcMap = summarizeRecords(cnGcDoc?.records);
  const enMap = summarizeRecords(enDoc?.records);

  const hfCnGz = await extractHeaderFooterText(cnGzPath);
  const hfCnGc = await extractHeaderFooterText(cnGcPath);
  const hfEnGz = await extractHeaderFooterText(enGzPath);
  const hfEnGc = await extractHeaderFooterText(enGcPath);

  const esc = (v) => String(v || '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 140);

  const extractS13Supplier = (docObj) => {
    const s1 = (docObj?.records || []).find(r => r.sectionNumber === 1);
    if (!s1) return '*(缺失)*';
    return (s1.rows || [])
      .filter(r => /供应商|地址|电话|传真|应急|Supplier|Tel|Fax/i.test(r.cells?.[0]?.text || ''))
      .map(r => `${(r.cells?.[0]?.text || '').trim()} ${(r.cells?.[1]?.text || '').trim()}`.trim())
      .join(' / ') || '*(无)*';
  };
  const supplierGz = extractS13Supplier(cnDoc);
  const supplierGc = extractS13Supplier(cnGcDoc);

  const lines = [
    `# ${modelCode} Agent 介入审计速查包 (免通读 Pipeline 源码)`,
    '',
    `> **生成时间**：${new Date().toISOString()}`,
    `> **审计定位**：本文件专为 **Agent 非机械介入审计（纯语义/内容核销）** 服务，已浓缩核心业务契约、Preset 接管声明、跨章节危化逻辑摘要及 16 章节逐节对照快照。`,
    '',
    '## 一、 Pipeline + 全局/局部规范终审速查契约 (1 分钟核销清单)',
    '',
    '1. **内容来源与继承铁律**：产出内容必须 100% 源自源文件，严禁外部基准库捏造理化或毒理端点；源文中测试条件（如 `1:1稀释`、`+40°C/+5°C`）不可截断丢失。',
    '2. **Section 2 防外生虚增 (`INV-ZERO-EXOGENOUS`)**：非危险化学品严禁出现 `GHS象形图：无` / `信号词：无`；危险品保留完整 H/P 分类且通栏无内横虚线。',
    '3. **Section 1.1 & 1.3 双主体隔离**：CN 产品中文名称需含型号；冠志（广州 020）与国彩（清远英德 0763）公司名、地址、电话、传真及页眉页脚零串扰。',
    '4. **Section 3 & 8 & 11 拓扑形态**：S3 组分名称/CAS/浓度 1:1 对齐且无附注残余；S8 区分 OEL 多列表与手套参数；S11 中英文行数严格对称。',
    '5. **双语一致性与零中文残留**：EN 版不得残留中文、全角 `℃` 或直译错误（如中文“不适用”错译为“No data available”）。',
    '',
    '## 二、 双主体页眉页脚实测提取核对',
    '',
    `- **CN 冠志**：${esc(hfCnGz)}`,
    `- **CN 国彩**：${esc(hfCnGc)}`,
    `- **EN Guanzhi**：${esc(hfEnGz)}`,
    `- **EN Guocai**：${esc(hfEnGc)}`,
    '',
    '## 三、 Preset 覆盖槽位声明清单 (合法接管，非篡改源文)',
    '',
    `- **冠志版 S1.3 供应商槽位**：${esc(supplierGz)}`,
    `- **国彩版 S1.3 供应商槽位**：${esc(supplierGc)}`,
    '',
    '## 四、 跨章节危化逻辑一致性摘要 (S2 vs S3 vs S14)',
    '',
    `- **S2 危险性概述 (CN)**：${esc(cnMap.get(2)?.preview)}`,
    `- **S3 成分/组成 (CN)**：${esc(cnMap.get(3)?.preview)}`,
    `- **S14 运输信息 (CN)**：${esc(cnMap.get(14)?.preview)}`,
    '',
    '## 五、 16 章节源文件 vs 中文产出 vs 英文产出对照快照',
    '',
    '| 节 | 源行数 | CN行数 | EN行数 | 源文件摘要 (Ground Truth) | 中文产出摘要 (CN) | 英文产出摘要 (EN) |',
    '| :---: | :---: | :---: | :---: | :--- | :--- | :--- |'
  ];

  for (let s = 1; s <= 16; s++) {
    const sr = srcMap.get(s) || { rowCount: 0, preview: '—' };
    const cn = cnMap.get(s) || { rowCount: 0, preview: '—' };
    const en = enMap.get(s) || { rowCount: 0, preview: '—' };
    lines.push(`| S${s} | ${sr.rowCount} | ${cn.rowCount} | ${en.rowCount} | ${esc(sr.preview)} | ${esc(cn.preview)} | ${esc(en.preview)} |`);
  }

  lines.push('');
  lines.push('## 六、 Agent 介入审计结论核销栏');
  lines.push('- [ ] **源事实继承与零虚增**：核验 S1~S16 内容均忠实源自源文件，无外生捏造或遗漏。');
  lines.push('- [ ] **双语语义与专业术语**：核验 EN 版逐句语义地道准确、无直译错译或条件丢失。');
  lines.push('- [ ] **跨章节逻辑自洽与双主体**：核验 S2/S3/S14 危化逻辑一致，冠志/国彩 Preset 合法隔离。');

  const outPath = path.join(targetDir, `${modelCode}_agent_audit_brief.md`);
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  return outPath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { targetDir, model, source } = parseArgs();
  if (!targetDir || !model) {
    console.error('用法: node generate_agent_audit_brief.mjs --targetDir=<dir> --model=<model> [--source=<docx>]');
    process.exit(1);
  }
  const outPath = await generateAgentAuditBrief({ targetDir, modelCode: model, sourcePath: source });
  console.log(`✅ [AGENT AUDIT BRIEF] 已生成介入审计速查包: ${outPath}`);
}
