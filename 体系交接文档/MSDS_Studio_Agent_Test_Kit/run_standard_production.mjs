#!/usr/bin/env node

/**
 * MSDS-Studio 唯一标准七步覆写流水线统一执行入口 (Test Kit Standard Runner)
 *
 * 统一调度 ../../web/src/production-orchestrator.js (produceStandardDeliverables)，
 * 与 PA / HPU 全系统一，严禁绕过或使用旧版分步脚本。
 *
 * 用法:
 *   node run_standard_production.mjs [--source="<源文件路径>"] [--model="<产品型号>"] [--targetDir="<输出目录>"] [--wordDir="<Word目录>"] [--pdfDir="<PDF目录>"] [--skipUserSync]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { produceStandardDeliverables, extractModelCodeFromPath } from '../../web/src/production-orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    model: null,
    targetDir: null,
    wordDir: null,
    pdfDir: null,
    userSyncDir: null,
    facts: null,
    translations: null,
    prepareOnly: false,
    approveContext2: false,
    skipAudit: false,
    skipUserSync: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--source=')) options.source = arg.slice(9).replace(/^["']|["']$/g, '');
    else if (arg === '--source' && args[i + 1]) options.source = args[++i].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--sourceDocx=')) options.source = arg.slice(13).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--model=')) options.model = arg.slice(8).replace(/^["']|["']$/g, '');
    else if (arg === '--model' && args[i + 1]) options.model = args[++i].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--targetDir=')) options.targetDir = arg.slice(12).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--wordDir=')) options.wordDir = arg.slice(10).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--pdfDir=')) options.pdfDir = arg.slice(9).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--userSyncDir=')) options.userSyncDir = arg.slice(14).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--facts=')) options.facts = arg.slice(8).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--translations=')) options.translations = arg.slice(15).replace(/^["']|["']$/g, '');
    else if (arg === '--prepareOnly') options.prepareOnly = true;
    else if (arg === '--approveContext2') options.approveContext2 = true;
    else if (arg === '--skipAudit') options.skipAudit = true;
    else if (arg === '--skipUserSync') options.skipUserSync = true;
    else if (!options.source && !arg.startsWith('--')) options.source = arg.replace(/^["']|["']$/g, '');
  }
  return options;
}

async function main() {
  const options = parseArgs();
  if (options.help) {
    console.log(`
MSDS-Studio 唯一标准七步覆写流水线 Runner (Test Kit)
用法:
  node run_standard_production.mjs [选项]

选项:
  --source=<路径>      源文件路径 (默认: ./source/ 下第一个 docx)
  --model=<型号>       产品型号代码 (默认自动从源文件解析)
  --targetDir=<路径>   8 格式交付物生成目录 (默认: ./output/<型号>/)
  --wordDir=<路径>     可选：同步 4 份 DOCX 至指定 Word 目录
  --pdfDir=<路径>      可选：同步 4 份 PDF 至指定 PDF 目录
  --facts=<路径|JSON>  可选：非标源文件事实覆盖
  --skipUserSync       可选：跳过同步至 E:\\冠志\\...
  --skipAudit          仅调试用，正式生产严禁跳过审计
`);
    process.exit(0);
  }

  let sourcePath = options.source;
  if (!sourcePath) {
    const defaultSourceDir = path.resolve(__dirname, 'source');
    if (fs.existsSync(defaultSourceDir)) {
      const candidates = fs.readdirSync(defaultSourceDir).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
      if (candidates.length > 0) sourcePath = path.join(defaultSourceDir, candidates[0]);
    }
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error(`❌ 未找到有效的源文件: ${sourcePath || '未指定'}`);
    process.exit(1);
  }

  const modelCode = (options.model || extractModelCodeFromPath(sourcePath)).toUpperCase();
  const targetDir = options.targetDir
    ? path.resolve(options.targetDir)
    : path.resolve(__dirname, 'output', modelCode);

  let customFacts = {};
  if (options.facts) {
    customFacts = fs.existsSync(options.facts)
      ? JSON.parse(fs.readFileSync(options.facts, 'utf8'))
      : JSON.parse(options.facts);
  }

  if (options.translations) {
    const tObj = fs.existsSync(options.translations)
      ? JSON.parse(fs.readFileSync(options.translations, 'utf8'))
      : JSON.parse(options.translations);
    customFacts.translations = { ...(customFacts.translations || {}), ...tObj };
  }

  console.log(`============================================================`);
  console.log(`🚀 [MSDS-Studio Test Kit] 启动标准生产流水线 (${options.prepareOnly ? '阶段A: Context 2 预处理导出' : '阶段B: Agent 已校对批准，执行写入与产出'})`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 源文件路径: ${sourcePath}`);
  console.log(`   • 输出目录: ${targetDir}`);
  console.log(`============================================================\n`);

  const result = await produceStandardDeliverables({
    sourceFilePath: sourcePath,
    modelCode,
    targetDir,
    wordDir: options.wordDir,
    pdfDir: options.pdfDir,
    userSyncDir: options.userSyncDir,
    facts: customFacts,
    prepareOnly: options.prepareOnly,
    approveContext2: options.approveContext2,
    skipAudit: options.skipAudit,
    skipUserSync: options.skipUserSync
  });

  if (result.status === 'AWAITING_AGENT_PROOFREAD') {
    console.log(`\n============================================================`);
    console.log(`⏸️  [GATE: AWAITING_AGENT_PROOFREAD] ${result.modelCode} Context 2 校对包已导出！`);
    console.log(`   • 校对视图 (MD): ${result.reviewMdPath}`);
    console.log(`   • 译文补丁 (JSON): ${result.translationsJsonPath}`);
    console.log(`   • 未译项: ${result.untranslatedCount} | 事实指纹守恒: ${result.factFingerprintOk}`);
    console.log(`   • 下一步（强制）: Agent 逐行校对翻译后，使用 --approveContext2 --translations="${result.translationsJsonPath}" 放行产出！`);
    console.log(`============================================================\n`);
    return;
  }

  console.log(`\n============================================================`);
  console.log(`🎉 [SUCCESS] 🏆 ${result.modelCode} 标准七步覆写与机械审计全绿完成！`);
  console.log(`   • 总耗时: ${result.totalDurationSec} 秒`);
  console.log(`   • 交付目录: ${result.targetDir}`);
  console.log(`   • 下一步（强制）: 请立即触发 Agent 三任务审计（任务 1 合并 Context 3 内容审计 + 任务 2 7 维度拓扑审计 + 任务 3 无删减并集清单）！`);
  console.log(`============================================================\n`);
}

main().catch(err => {
  console.error('\n❌ 流水线执行异常中断:', err.message || err);
  process.exit(1);
});
