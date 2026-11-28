#!/usr/bin/env node

/**
 * 合并版 Context 3 识别与三方对照报告生成器 (Agent 审计任务 1 专用)
 *
 * 核心职责：
 * 1. 通过官方受控 MCP 网关 (msds_recognize_source) 分别识别主预设中文版与英文版最终 DOCX 产出物（以及可选源文件 Context 1）；
 * 2. 将同一型号的中、英文 Context 3 识别结果合并写入同一篇 .md 文档；
 * 3. 自动生成 1–16 章 Context 1 vs Context 3 (CN & EN) 三方对照总览表，并标注底层硬性规定白名单（如 Section 8 固定 8.1 暴露控制 -> 8.2 控制参数）。
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { callMcpTool } from './msds_mcp_gateway.mjs';
import { serializeFactsToMarkdown } from '../src/msds-source-semantic-adapter.js';

function parseCliArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--argsFile=')) {
      opts.argsFile = a.slice(11);
    } else if (a === '--argsFile' && argv[i + 1]) {
      opts.argsFile = argv[++i];
    } else if (a.startsWith('--model=')) {
      opts.modelCode = a.slice(8);
    } else if (a === '--model' && argv[i + 1]) {
      opts.modelCode = argv[++i];
    } else if (a.startsWith('--source=')) {
      opts.sourceFilePath = a.slice(9);
    } else if (a === '--source' && argv[i + 1]) {
      opts.sourceFilePath = argv[++i];
    } else if (a.startsWith('--cn=')) {
      opts.cnDocxPath = a.slice(5);
    } else if (a === '--cn' && argv[i + 1]) {
      opts.cnDocxPath = argv[++i];
    } else if (a.startsWith('--en=')) {
      opts.enDocxPath = a.slice(5);
    } else if (a === '--en' && argv[i + 1]) {
      opts.enDocxPath = argv[++i];
    } else if (a.startsWith('--out=')) {
      opts.outPath = a.slice(6);
    } else if (a === '--out' && argv[i + 1]) {
      opts.outPath = argv[++i];
    }
  }
  return opts;
}

function summarizeSectionText(sec) {
  if (!sec || !Array.isArray(sec.rows) || sec.rows.length === 0) {
    return { rows: 0, chars: 0, preview: '*(空)*' };
  }
  let chars = 0;
  for (const r of sec.rows) {
    chars += (r.label || '').length + (r.value || '').length;
  }
  const firstNonHdr = sec.rows.find((r, idx) => idx > 0 && ((r.label || '').trim() || (r.value || '').trim()));
  const rawPreview = firstNonHdr
    ? `${(firstNonHdr.label || '').trim()} ${(firstNonHdr.value || '').trim()}`.trim()
    : (sec.title || '');
  const cleanPreview = rawPreview.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 42);
  return {
    rows: sec.rows.length,
    chars,
    preview: cleanPreview + (rawPreview.length > 42 ? '…' : '')
  };
}

function buildSectionNote(secNum, c1Sec, cnSec, enSec) {
  const notes = [];
  if (secNum === 1) {
    notes.push('核查品名/型号/企业预设地址与联系方式');
  } else if (secNum === 2) {
    notes.push('非危品允许去重冗余象形图/信号词，核查 2.1/2.3 保全');
  } else if (secNum === 3) {
    notes.push('允许单格多行拆分为独立组分行，组分/CAS/浓度 100% 守恒');
  } else if (secNum === 8) {
    const cnHasOrder = cnSec?.rows?.some(r => /8\.1[\s\t]*暴露控制/.test(r.label || '')) &&
      cnSec?.rows?.some(r => /8\.2[\s\t]*控制参数/.test(r.label || ''));
    notes.push(cnHasOrder ? '✅ 硬规顺序：8.1 暴露控制 -> 8.2 控制参数' : '⚠️ 核查 8.1 暴露控制 -> 8.2 控制参数硬规顺序');
  } else if (secNum === 11) {
    notes.push('核查毒理端点完整继承、加粗分层与 OECD 导则号');
  } else if (secNum === 14) {
    notes.push('允许合并运输行拆分为 14.1~14.4 独立行');
  }
  if ((c1Sec?.rows?.length || 0) > 0 && ((cnSec?.rows?.length || 0) === 0 || (enSec?.rows?.length || 0) === 0)) {
    notes.push('❌ 检测到章节空缺');
  }
  return notes.join('；') || '核查内容继承与双语一致';
}

function formatEmbeddedContext3(data, langLabel) {
  const rawMd = serializeFactsToMarkdown(data);
  const relabeledMd = rawMd.replace(
    /^# (.+?) Context 1 原始化学事实与结构形态提取资产/m,
    `### $1 Context 3（${langLabel}）识别全量视图`
  ).replace(/^## /gm, '#### ').replace(/^### /gm, '##### ');

  const fingerprint = [
    '\n##### MCP 统一入口调用与物理无损自检指纹',
    `- **MCP 工具**: \`msds_recognize_source\` (via \`web/scripts/msds_mcp_gateway.mjs\`)`,
    `- **原始非空段落数**: ${data.integrity?.rawParagraphCount ?? '—'}`,
    `- **原始字符数 / 提取字符数**: ${data.integrity?.rawCharCount ?? '—'} / ${data.integrity?.extractedCharCount ?? '—'} (守恒率: ${data.integrity?.conservationRatio ?? '—'}%)`,
    `- **16 章节覆盖**: ${data.integrity?.coveredSectionsCount ?? '—'}/16 (空缺: ${data.integrity?.emptySections?.length ? data.integrity.emptySections.join(', ') : '无'})`,
    `- **未匹配原始段落数**: ${data.integrity?.missingParagraphCount ?? '—'}`,
    `- **无损判定**: ${data.integrity?.isLossless ? 'PASS (100% 无损)' : 'WARN'}`
  ].join('\n');

  return `${relabeledMd}\n${fingerprint}`;
}

async function recognizeViaMcp(filePath) {
  const res = await callMcpTool('msds_recognize_source', { sourceFilePath: filePath });
  const textPayload = res?.result?.content?.[0]?.text;
  return textPayload ? JSON.parse(textPayload) : (res?.result || res);
}

async function main() {
  let opts = parseCliArgs(process.argv.slice(2));
  if (opts.argsFile) {
    const fileOpts = JSON.parse(await fs.readFile(opts.argsFile, 'utf8'));
    opts = { ...fileOpts, ...opts };
  }

  if (!opts.cnDocxPath || !opts.enDocxPath || !opts.outPath) {
    console.error('用法: node generate_context3_report.mjs --model=<MODEL> [--source=<SOURCE_DOCX>] --cn=<CN_DOCX> --en=<EN_DOCX> --out=<OUT_MD>');
    process.exit(1);
  }

  const [c1Data, cnData, enData] = await Promise.all([
    opts.sourceFilePath ? recognizeViaMcp(opts.sourceFilePath) : Promise.resolve(null),
    recognizeViaMcp(opts.cnDocxPath),
    recognizeViaMcp(opts.enDocxPath)
  ]);

  const model = opts.modelCode || cnData.modelCode || enData.modelCode || 'MSDS';
  const now = new Date().toISOString();

  const lines = [];
  lines.push(`# ${model} Context 3 中英文合并识别与内容审计报告（Agent 审计任务 1）\n`);
  lines.push(`> **生成时间**：${now}`);
  lines.push(`> **适用阶段**：最终工作流 · Agent 审计任务 1（内容审计）`);
  lines.push(`> **审计原则**：内容来源于源文件、源文件内容继承（兼顾底层硬性规定白名单）`);
  if (opts.sourceFilePath) lines.push(`> **源文件 (Context 1)**：\`${opts.sourceFilePath}\``);
  lines.push(`> **中文产出物 (Context 3 CN)**：\`${opts.cnDocxPath}\``);
  lines.push(`> **英文产出物 (Context 3 EN)**：\`${opts.enDocxPath}\`\n`);

  lines.push(`## 一、识别无损指纹汇总\n`);
  lines.push(`| 资产维度 | 源文件文件名 | 非空段落数 | 章节覆盖 | 未匹配段落 | 无损判定 |`);
  lines.push(`| :--- | :--- | :---: | :---: | :---: | :---: |`);
  if (c1Data) {
    lines.push(`| **Context 1 (源文)** | \`${c1Data.sourceName || path.basename(opts.sourceFilePath)}\` | ${c1Data.integrity?.rawParagraphCount ?? '—'} | ${c1Data.integrity?.coveredSectionsCount ?? '—'}/16 | ${c1Data.integrity?.missingParagraphCount ?? '—'} | ${c1Data.integrity?.isLossless ? 'PASS' : 'WARN'} |`);
  }
  lines.push(`| **Context 3 (CN)** | \`${cnData.sourceName || path.basename(opts.cnDocxPath)}\` | ${cnData.integrity?.rawParagraphCount ?? '—'} | ${cnData.integrity?.coveredSectionsCount ?? '—'}/16 | ${cnData.integrity?.missingParagraphCount ?? '—'} | ${cnData.integrity?.isLossless ? 'PASS' : 'WARN'} |`);
  lines.push(`| **Context 3 (EN)** | \`${enData.sourceName || path.basename(opts.enDocxPath)}\` | ${enData.integrity?.rawParagraphCount ?? '—'} | ${enData.integrity?.coveredSectionsCount ?? '—'}/16 | ${enData.integrity?.missingParagraphCount ?? '—'} | ${enData.integrity?.isLossless ? 'PASS' : 'WARN'} |\n`);

  lines.push(`## 二、Context 1 vs Context 3 (CN & EN) 16 章节三方对照总览表\n`);
  lines.push(`> **底层硬性规定白名单（合规调整不判 FAIL）**：`);
  lines.push(`> 1. **Section 8 规范子节顺序**：底层强制 \`8.1 暴露控制 / Exposure controls\` 先于 \`8.2 控制参数 / Control parameters\`；`);
  lines.push(`> 2. **企业主体预设绑定**：Section 1 企业名称、注册地址（如黄埔区）、电话/传真随主体预设更新；`);
  lines.push(`> 3. **非危险品防虚增去重**：\`!isHazardous\` 时剔除冗余 \`GHS-象形图\` / \`信号词\` / 重复非危声明；`);
  lines.push(`> 4. **结构与符号规范化**：Section 3 / Section 14 合并行拆行，\`°C\` / \`≥\` 等符号标准化。\n`);

  lines.push(`| 章节 | Context 1 (源文行数/字符) | Context 3 CN (行数/字符) | Context 3 EN (行数/字符) | 对照要点与硬规判定提示 |`);
  lines.push(`| :---: | :---: | :---: | :---: | :--- |`);
  for (let s = 1; s <= 16; s++) {
    const c1Sec = c1Data?.sections?.[s];
    const cnSec = cnData.sections?.[s];
    const enSec = enData.sections?.[s];
    const c1Sum = summarizeSectionText(c1Sec);
    const cnSum = summarizeSectionText(cnSec);
    const enSum = summarizeSectionText(enSec);
    const note = buildSectionNote(s, c1Sec, cnSec, enSec);
    const c1Col = c1Data ? `${c1Sum.rows} 行 / ${c1Sum.chars}` : '*(未传源文)*';
    lines.push(`| **Section ${s}** | ${c1Col} | ${cnSum.rows} 行 / ${cnSum.chars} | ${enSum.rows} 行 / ${enSum.chars} | ${note} |`);
  }
  lines.push('');

  lines.push(`---\n`);
  lines.push(`## 三、中文产出物 Context 3 全量识别内容\n`);
  lines.push(formatEmbeddedContext3(cnData, '中文产出物'));
  lines.push('\n---\n');
  lines.push(`## 四、英文产出物 Context 3 全量识别内容\n`);
  lines.push(formatEmbeddedContext3(enData, '英文产出物'));
  lines.push('');

  await fs.mkdir(path.dirname(opts.outPath), { recursive: true });
  await fs.writeFile(opts.outPath, lines.join('\n'), 'utf8');

  const ok = Boolean(cnData.integrity?.isLossless) &&
    Boolean(enData.integrity?.isLossless) &&
    cnData.integrity?.coveredSectionsCount === 16 &&
    enData.integrity?.coveredSectionsCount === 16;

  console.log(JSON.stringify({
    status: ok ? 'success' : 'warn',
    modelCode: model,
    outPath: opts.outPath,
    cnIntegrity: cnData.integrity,
    enIntegrity: enData.integrity
  }, null, 2));

  process.exit(ok ? 0 : 1);
}

main().catch(err => {
  console.error(JSON.stringify({ status: 'error', error: err.message }, null, 2));
  process.exit(1);
});
