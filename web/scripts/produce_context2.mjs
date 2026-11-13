#!/usr/bin/env node

/**
 * MSDS-Engine 原生 Context 2 受控生产脚本 (produce_context2.mjs)
 * 
 * 核心机制:
 * 1. 彻底废除旧 pipeline，由匹配引擎执行底层母版拓扑结构匹配（内容源自源文件，结构源自模板）；
 * 2. 由 Agent 规范治理器执行全局不变量与 16 章节局部规范的二次深度打磨；
 * 3. 产出可直接驱动通用编辑器万能原语受控写入的 Context 2 标准数据模型与 Markdown 事实表。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { matchContext1ToTemplateTopology } from '../src/smart-matching.js';
import { refineContext2WithSpecifications } from '../src/context-governor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    facts: null,
    output: null,
    variant: 'ALL', // ALL | CN | EN
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--source=')) options.source = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--facts=')) options.facts = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--output=')) options.output = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--variant=')) options.variant = arg.split('=', 2)[1].toUpperCase();
    else if (!options.source && !arg.startsWith('--')) options.source = arg.replace(/^["']|["']$/g, '');
  }

  return options;
}

async function main() {
  const startTime = Date.now();
  const options = parseArgs();

  if (options.help || (!options.source && !options.facts)) {
    console.log(`
MSDS-Engine 原生 Context 2 受控生产流水线 (Stage 3)
使用方法:
  node web/scripts/produce_context2.mjs [选项]

选项:
  --source=<path>    待解析的 Word 源文件路径 (.docx)
  --facts=<path>     已存在的 Context 1 事实 JSON 文件路径
  --output=<dir>     输出目录 (默认: output/<型号代码>)
  --variant=<CN|EN|ALL> 输出语言版本 (默认: ALL，产出中英双轨)
  -h, --help         显示帮助信息

示例:
  node web/scripts/produce_context2.mjs --source="算法训练材料/.../HPU-7651 msds_CN 冠志.docx"
`);
    process.exit(options.help ? 0 : 1);
  }

  let facts = null;

  // 1. 获取 Context 1 事实对象
  if (options.facts) {
    const factsPath = path.resolve(process.cwd(), options.facts);
    if (!fs.existsSync(factsPath)) {
      console.error(`❌ Context 1 事实文件不存在: ${factsPath}`);
      process.exit(1);
    }
    facts = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
    console.log(`📂 已加载 Context 1 事实 JSON: ${factsPath}`);
  } else {
    let sourcePath = path.resolve(process.cwd(), options.source);
    if (!fs.existsSync(sourcePath)) {
      const altPath = path.resolve(REPO_ROOT, options.source);
      if (fs.existsSync(altPath)) sourcePath = altPath;
      else {
        console.error(`❌ 源文件不存在: ${options.source}`);
        process.exit(1);
      }
    }
    console.log(`📄 正在识别源文件: ${sourcePath}`);
    const fileBuf = fs.readFileSync(sourcePath);
    facts = await recognizeSourceDocx(fileBuf, path.basename(sourcePath));
  }

  const modelCode = facts.modelCode || 'UNKNOWN_MODEL';
  const outDir = options.output ? path.resolve(process.cwd(), options.output) : path.resolve(REPO_ROOT, 'output', modelCode);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const variantsToProduce = options.variant === 'ALL' ? ['CN', 'EN'] : [options.variant];
  const results = {};

  console.log(`\n============================================================`);
  console.log(`🚀 MSDS-Engine Context 2 两阶流水线: ${modelCode}`);
  console.log(`   • 第一阶: 匹配引擎母版拓扑结构映射 (废除 pipeline)`);
  console.log(`   • 第二阶: Agent 全局与局部规范二次深度认知打磨`);
  console.log(`============================================================`);

  for (const v of variantsToProduce) {
    console.log(`\n▶ 正在生成 [${v}] 语言版本 Context 2...`);

    // 第一阶: 匹配引擎拓扑结构初筛
    const t0 = Date.now();
    const blueprint = matchContext1ToTemplateTopology(facts, v);
    const t1 = Date.now();
    console.log(`  ✓ 第一阶 [匹配引擎拓扑初筛]: 耗时 ${t1 - t0} ms, 覆盖 16 章节槽位`);

    // 落地第一阶结构蓝图
    const blueprintFile = path.join(outDir, `${modelCode}_context2_blueprint_${v}.json`);
    fs.writeFileSync(blueprintFile, JSON.stringify(blueprint, null, 2), 'utf8');

    // 第二阶: Agent 全局与局部规范二次认知打磨
    const refinedContext2 = refineContext2WithSpecifications(blueprint, {
      isNonHazardous: !facts.ghs?.isHazardous
    });
    const t2 = Date.now();
    console.log(`  ✓ 第二阶 [Agent 规范二次打磨]: 耗时 ${t2 - t1} ms, 组装 ${refinedContext2.editorOps.length} 项编辑器原语意图`);

    // 落地第二阶最终 Context 2 JSON 与 Markdown
    const jsonFile = path.join(outDir, `${modelCode}_context2_${v}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(refinedContext2, null, 2), 'utf8');
    console.log(`  📦 输出最终 Context 2 JSON: ${jsonFile}`);

    const mdFile = path.join(outDir, `${modelCode}_context2_${v}.md`);
    fs.writeFileSync(mdFile, refinedContext2.markdown, 'utf8');
    console.log(`  📝 输出最终 Context 2 Markdown: ${mdFile}`);

    results[v] = {
      blueprintFile,
      jsonFile,
      mdFile,
      editorOpsCount: refinedContext2.editorOps.length
    };
  }

  const durationMs = Date.now() - startTime;
  console.log(`\n------------------------------------------------------------`);
  console.log(`✅ Context 2 生产完毕！(总耗时: ${durationMs} ms)`);
  console.log(`   • 产出物目录: ${outDir}`);
  console.log(`============================================================\n`);
}

main().catch(err => {
  console.error(`💥 Context 2 生产过程中发生异常:`, err);
  process.exit(1);
});
