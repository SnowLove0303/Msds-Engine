#!/usr/bin/env node

/**
 * MSDS-Engine 原生通用源文件识别与 Context 1 生成统一入口 (Native Source Recognizer CLI)
 * 
 * 核心功能:
 * 1. 接收 DOC/DOCX 源文件路径，自动定位或无损解析；
 * 2. 调用 recognition-engine.js 进行多维语义分类与事实抽取；
 * 3. 一键产出标准化 Context 1 Markdown 资产与 JSON 事实对象；
 * 4. 彻底取代所有零散的临时调试脚本，秒级极速执行。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recognizeSourceDocx, serializeFactsToMarkdown } from '../src/msds-source-semantic-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    output: null,
    format: 'all', // all | md | json
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--source=')) options.source = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--output=')) options.output = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--format=')) options.format = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (!options.source && !arg.startsWith('--')) options.source = arg.replace(/^["']|["']$/g, '');
  }

  return options;
}

async function main() {
  const startTime = Date.now();
  const options = parseArgs();

  if (options.help || !options.source) {
    console.log(`
MSDS-Engine 原生源文件识别与 Context 1 生成工具
使用方法:
  node web/scripts/run_source_recognition.mjs --source=<源文件路径> [选项]

选项:
  --source=<path>    待解析的 Word 源文件路径 (.doc 或 .docx)
  --output=<dir>     输出目录 (默认: output/<型号代码>)
  --format=<format>  输出格式: all (默认) | md | json
  -h, --help         显示帮助信息

示例:
  node web/scripts/run_source_recognition.mjs --source="算法训练材料/.../PA-3612 msds_CN 冠志.doc"
`);
    process.exit(options.help ? 0 : 1);
  }

  let sourcePath = path.resolve(process.cwd(), options.source);
  if (!fs.existsSync(sourcePath)) {
    // 尝试在仓库根目录解析
    const altPath = path.resolve(REPO_ROOT, options.source);
    if (fs.existsSync(altPath)) sourcePath = altPath;
    else {
      console.error(`❌ 源文件不存在: ${options.source}`);
      process.exit(1);
    }
  }

  console.log(`\n============================================================`);
  console.log(`🚀 MSDS-Engine 原生源文件识别流水线 (Stage 2)`);
  console.log(`============================================================`);
  console.log(`📄 原始源文件: ${sourcePath}`);

  // 处理 .doc 转存 .docx 映射
  let docxPath = sourcePath;
  if (sourcePath.toLowerCase().endsWith('.doc')) {
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const convertedDir = path.resolve(REPO_ROOT, 'web/scratch/pa_doc_converted');
    const cand1 = path.join(convertedDir, `${baseName}.docx`);
    const cand2 = path.join(path.dirname(sourcePath), `${baseName}.docx`);

    if (fs.existsSync(cand1)) {
      docxPath = cand1;
      console.log(`🔄 自动绑定转换后 DOCX 实体: ${docxPath}`);
    } else if (fs.existsSync(cand2)) {
      docxPath = cand2;
      console.log(`🔄 自动绑定同目录 DOCX 实体: ${docxPath}`);
    } else {
      console.error(`❌ 未找到该 .doc 对应的 .docx 转换实体，请先将其转存为 .docx`);
      process.exit(1);
    }
  }

  // 1. 读取并识别
  const fileBuf = fs.readFileSync(docxPath);
  console.log(`⏳ 正在执行多维特征语义识别与抽取...`);
  const facts = await recognizeSourceDocx(fileBuf, path.basename(sourcePath));

  const modelCode = facts.modelCode || 'UNKNOWN_MODEL';
  const outDir = options.output ? path.resolve(process.cwd(), options.output) : path.resolve(REPO_ROOT, 'output', modelCode);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 2. 生成 Context 1 Markdown
  const mdContent = serializeFactsToMarkdown(facts);
  const mdFile = path.join(outDir, `${modelCode}_context1_recognition.md`);
  if (options.format === 'all' || options.format === 'md') {
    fs.writeFileSync(mdFile, mdContent, 'utf8');
    console.log(`📝 已输出 Context 1 Markdown: ${mdFile}`);

    // 同步备份到当前会话 artifact 目录 (若存在)
    const brainDir = path.resolve(process.env.USERPROFILE || 'C:/Users/Administrator', '.gemini/antigravity/brain');
    if (fs.existsSync(brainDir)) {
      try {
        const subDirs = fs.readdirSync(brainDir).filter(d => fs.statSync(path.join(brainDir, d)).isDirectory());
        if (subDirs.length > 0) {
          const latestBrain = path.join(brainDir, subDirs[subDirs.length - 1]);
          const artifactPath = path.join(latestBrain, `${modelCode}_context1_recognition.md`);
          fs.writeFileSync(artifactPath, mdContent, 'utf8');
        }
      } catch (err) {
        // ignore brain copy error
      }
    }
  }

  // 3. 输出 JSON 格式事实
  const jsonFile = path.join(outDir, `${modelCode}_raw_facts.json`);
  if (options.format === 'all' || options.format === 'json') {
    fs.writeFileSync(jsonFile, JSON.stringify(facts, null, 2), 'utf8');
    console.log(`📦 已输出结构化事实 JSON: ${jsonFile}`);
  }

  const durationMs = Date.now() - startTime;
  console.log(`\n------------------------------------------------------------`);
  console.log(`✅ 源文件识别与 Context 1 资产生成完毕！(耗时: ${durationMs} ms)`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 产品品名: ${facts.productName || '—'}`);
  console.log(`   • GHS 分类: ${facts.ghs?.isHazardous ? '危险化学品' : '非危险化学品 (未分类)'}`);
  console.log(`   • 组分数量: ${facts.components?.length || 0}`);
  console.log(`   • 理化指标: ${facts.physicalProperties?.length || 0} 项`);
  console.log(`============================================================\n`);
}

main().catch(err => {
  console.error(`💥 识别过程中发生未捕获异常:`, err);
  process.exit(1);
});
