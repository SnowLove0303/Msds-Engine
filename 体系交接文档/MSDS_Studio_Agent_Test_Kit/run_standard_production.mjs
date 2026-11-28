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
import { produceStandardDeliverables, extractModelCodeFromPath, fetchAvailableUserPresets, fetchAvailableNamingPatterns } from '../../web/src/production-orchestrator.js';
import { recognizeDocumentUniversal, serializeUniversalToMarkdown } from '../../web/src/recognition-engine.js';
import { createTopologyPluginSlot } from '../../web/src/topology-plugin-slot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    model: null,
    documentId: null,
    outputNamePattern: null,
    namingPatternId: null,
    legacy8FormatAudit: false,
    targetDir: null,
    wordDir: null,
    pdfDir: null,
    userSyncDir: null,
    facts: null,
    translations: null,
    template: null,
    topology: null,
    presets: [],
    formats: [],
    languages: [],
    confirmRequirements: false,
    listPresets: false,
    listNamingPatterns: false,
    apiBase: null,
    recognizeOnly: false,
    buildTopology: false,
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
    else if (arg.startsWith('--documentId=')) options.documentId = arg.slice(13).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--outputNamePattern=')) options.outputNamePattern = arg.slice(20).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--namingPatternId=')) options.namingPatternId = arg.slice(18).replace(/^["']|["']$/g, '');
    else if (arg === '--legacy8FormatAudit') options.legacy8FormatAudit = true;
    else if (arg === '--listNamingPatterns') options.listNamingPatterns = true;
    else if (arg.startsWith('--targetDir=')) options.targetDir = arg.slice(12).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--wordDir=')) options.wordDir = arg.slice(10).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--pdfDir=')) options.pdfDir = arg.slice(9).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--userSyncDir=')) options.userSyncDir = arg.slice(14).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--facts=')) options.facts = arg.slice(8).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--translations=')) options.translations = arg.slice(15).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--template=')) options.template = arg.slice(11).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--topology=')) options.topology = arg.slice(11).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--presets=')) options.presets = arg.slice(10).replace(/^["']|["']$/g, '').split(',').map(s => s.trim()).filter(Boolean);
    else if (arg.startsWith('--formats=')) options.formats = arg.slice(10).replace(/^["']|["']$/g, '').split(',').map(s => s.trim()).filter(Boolean);
    else if (arg.startsWith('--languages=')) options.languages = arg.slice(12).replace(/^["']|["']$/g, '').split(',').map(s => s.trim()).filter(Boolean);
    else if (arg.startsWith('--apiBase=')) options.apiBase = arg.slice(10).replace(/^["']|["']$/g, '');
    else if (arg === '--confirmRequirements') options.confirmRequirements = true;
    else if (arg === '--listPresets') options.listPresets = true;
    else if (arg === '--recognizeOnly') options.recognizeOnly = true;
    else if (arg === '--buildTopology') options.buildTopology = true;
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
  --source=<路径>         源文件路径 (默认: ./source/ 下第一个 docx)
  --documentId=<标识>     通用文档标识 (默认取源文件名主干)
  --model=<型号>          可选：兼容别名，等同 --documentId
  --targetDir=<路径>      交付物生成目录 (默认: ./output/<documentId>/)
  --wordDir=<路径>        可选：同步实际产出的 DOCX 文件至指定目录
  --pdfDir=<路径>         可选：同步实际产出的 PDF 文件至指定目录
  --facts=<路径|JSON>     可选：非标源文件事实覆盖
  --template=<路径>       可选：指定自定义母版 .docx 路径
  --topology=<路径>       可选：指定 MsdsEngineStandardTopology JSON 路径
  --listPresets           通过 API/数据库列出全部可用用户预设
  --listNamingPatterns    通过 API/数据库列出全部可复用产出物命名格式预设
  --namingPatternId=<ID>  选用已保存的命名格式预设 ID
  --outputNamePattern=<P> 直接指定命名模板 (如 "{date}_{docId}_{lang}_{preset}")
  --presets=<id1,id2>     已确认的用户预设列表（支持多选，或传 none）
  --formats=<docx,pdf>    已确认的产出格式（含 pdf 时强制先生成 docx 再经 pdf-converter.js 转换）
  --languages=<zh,en>     已确认的目标语言（支持任意语言代码）
  --confirmRequirements   显式声明已完成 Stage 0 需求确认门禁
  --apiBase=<URL>         可选：Web API 服务基地址
  --recognizeOnly         仅执行 L2 通用全量识别，输出 JSON 与 1:1 原样 MD
  --buildTopology         仅执行 L2 9 层拓扑识别与标准可复用包构建
  --legacy8FormatAudit    可选：显式启用旧版 8 格式/16 节专项审计
  --skipUserSync          可选：跳过同步至外部目录
  --skipAudit             仅调试用，正式生产严禁跳过审计
`);
    process.exit(0);
  }

  if (options.listPresets) {
    const presets = await fetchAvailableUserPresets({ apiBase: options.apiBase });
    process.stdout.write(JSON.stringify({ count: presets.length, presets }, null, 2) + '\n');
    return;
  }
  if (options.listNamingPatterns) {
    const namingPatterns = await fetchAvailableNamingPatterns({ apiBase: options.apiBase });
    process.stdout.write(JSON.stringify({ count: namingPatterns.length, namingPatterns }, null, 2) + '\n');
    return;
  }

  if (options.recognizeOnly) {
    if (!options.source || !fs.existsSync(options.source)) {
      console.error(`❌ --recognizeOnly 需要有效的 --source 文件路径: ${options.source || '未指定'}`);
      process.exit(1);
    }
    const baseName = path.basename(options.source, path.extname(options.source));
    const outDir = options.targetDir ? path.resolve(options.targetDir) : path.resolve(__dirname, 'output', baseName);
    fs.mkdirSync(outDir, { recursive: true });
    const universal = await recognizeDocumentUniversal(options.source, { sourceName: path.basename(options.source) });
    const md = serializeUniversalToMarkdown(universal);
    const jsonOut = path.join(outDir, `${baseName}_universal_recognition.json`);
    const mdOut = path.join(outDir, `${baseName}_recognition_result.md`);
    fs.writeFileSync(jsonOut, JSON.stringify(universal, null, 2));
    fs.writeFileSync(mdOut, md);
    console.log(`✅ [RECOGNIZE_ONLY] 通用全量识别完成: ${universal.tables.length} 表 / ${universal.coverage.normalizedCellCount} 格`);
    console.log(`   • JSON: ${jsonOut}`);
    console.log(`   • MD (1:1): ${mdOut}`);
    return;
  }

  if (options.buildTopology) {
    const tplPath = options.template || options.source;
    if (!tplPath || !fs.existsSync(tplPath)) {
      console.error(`❌ --buildTopology 需要有效的 --template 或 --source 文件路径: ${tplPath || '未指定'}`);
      process.exit(1);
    }
    const baseName = path.basename(tplPath, path.extname(tplPath));
    const outDir = options.targetDir ? path.resolve(options.targetDir) : path.resolve(__dirname, 'output', baseName);
    fs.mkdirSync(outDir, { recursive: true });
    const slot = createTopologyPluginSlot();
    await slot.mountTemplate(tplPath, { templateName: path.basename(tplPath) });
    const bundle = slot.exportTopologyBundle();
    const topoOut = path.join(outDir, `${baseName}_built_topology.json`);
    fs.writeFileSync(topoOut, JSON.stringify(bundle, null, 2));
    slot.unmountTemplate();
    console.log(`✅ [BUILD_TOPOLOGY] 9层拓扑构建完成: ${bundle.sectionsCount} 节 | 完整度=${bundle.completenessCheck?.passedCount}/${bundle.completenessCheck?.totalChecks}`);
    console.log(`   • Bundle: ${topoOut}`);
    return;
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
    documentId: options.documentId,
    modelCode: options.model,
    outputNamePattern: options.outputNamePattern,
    namingPatternId: options.namingPatternId,
    targetDir,
    wordDir: options.wordDir,
    pdfDir: options.pdfDir,
    userSyncDir: options.userSyncDir,
    facts: customFacts,
    presets: options.presets,
    formats: options.formats,
    languages: options.languages,
    confirmRequirements: options.confirmRequirements,
    apiBase: options.apiBase,
    templatePath: options.template,
    topologyPath: options.topology,
    legacy8FormatAudit: options.legacy8FormatAudit,
    prepareOnly: options.prepareOnly,
    approveContext2: options.approveContext2,
    skipAudit: options.skipAudit,
    skipUserSync: options.skipUserSync
  });

  if (result.status === 'AWAITING_AGENT_PROOFREAD') {
    console.log(`\n============================================================`);
    console.log(`⏸️  [GATE: AWAITING_AGENT_PROOFREAD] ${result.modelCode} Context 1 & Context 2 已就绪！`);
    console.log(`   • Context 1 (JSON): ${result.context1JsonPath}`);
    console.log(`   • Context 1 (1:1 MD): ${result.context1MdPath}`);
    console.log(`   • Context 2 校对视图 (MD): ${result.reviewMdPath}`);
    console.log(`   • Context 2 译文补丁 (JSON): ${result.translationsJsonPath}`);
    console.log(`   • 未译项: ${result.untranslatedCount} | 事实指纹守恒: ${result.factFingerprintOk}`);
    console.log(`   • 下一步（强制）: Agent 基于 Context 1 MD 与映射库逐行校对翻译后，使用 --approveContext2 --translations="${result.translationsJsonPath}" 放行产出！`);
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
