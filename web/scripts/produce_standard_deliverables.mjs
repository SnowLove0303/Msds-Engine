#!/usr/bin/env node

/**
 * MSDS-Studio 7 阶受控流水线标准生产命令行入口
 * 
 * 用法:
 *   node web/scripts/produce_standard_deliverables.mjs --model=OS-8970 --sourceDocx="<源文件路径>"
 * 
 * 选项:
 *   --model=<modelCode>       产品型号代码 (如 OS-8970, PU-218A)
 *   --sourceDocx=<path>       物理源 DOCX 文件路径 (必须存在)
 *   --targetDir=<dir>         8 格式正式交付物输出目录 (可选)
 *   --userSyncDir=<dir>       用户工作目录镜像同步路径 (可选)
 *   --skipAudit               跳过 159 项机械+双极双层审计 (不推荐)
 *   --skipUserSync            跳过用户目录同步
 *   --help, -h                显示帮助信息
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { produceStandardDeliverables } from '../src/production-orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHelp() {
  console.log(`
MSDS-Studio 7 阶受控流水线标准生产 CLI
======================================================
用法:
  node web/scripts/produce_standard_deliverables.mjs [选项]

必选参数:
  --sourceDocx=<path>       物理源 DOCX 文件绝对或相对路径

可选参数:
  --model=<modelCode>       产品型号代码 (若未提供，自动从源文件名解析)
  --targetDir=<dir>         8 格式正式交付物输出目录 (默认: web/output/<modelCode>)
  --userSyncDir=<dir>       用户工作目录镜像同步路径 (默认: E:\\冠志\\TDS MSDS (2)\\待处理文件\\<modelCode>)
  --skipAudit               跳过 159 项主审计与双极双层审计 (调试用)
  --skipUserSync            跳过向用户工作目录同步
  --help, -h                显示本帮助信息并退出

示例:
  node web/scripts/produce_standard_deliverables.mjs \\
    --model=OS-8970 \\
    --sourceDocx="算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx"
======================================================
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  let modelCode = null;
  let sourceDocx = null;
  let targetDir = null;
  let userSyncDir = null;
  let skipAudit = false;
  let skipUserSync = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--model=')) {
      modelCode = arg.slice(8);
    } else if (arg === '--model' && args[i + 1]) {
      modelCode = args[++i];
    } else if (arg.startsWith('--sourceDocx=')) {
      sourceDocx = arg.slice(13);
    } else if (arg === '--sourceDocx' && args[i + 1]) {
      sourceDocx = args[++i];
    } else if (arg.startsWith('--targetDir=')) {
      targetDir = arg.slice(12);
    } else if (arg === '--targetDir' && args[i + 1]) {
      targetDir = args[++i];
    } else if (arg.startsWith('--userSyncDir=')) {
      userSyncDir = arg.slice(14);
    } else if (arg === '--userSyncDir' && args[i + 1]) {
      userSyncDir = args[++i];
    } else if (arg === '--skipAudit') {
      skipAudit = true;
    } else if (arg === '--skipUserSync') {
      skipUserSync = true;
    }
  }

  if (!sourceDocx) {
    console.error('❌ 缺少必需参数: --sourceDocx');
    printHelp();
    process.exit(1);
  }

  console.log('🚀 [MSDS-Studio] 启动 7 阶标准受控生产流水线...');
  console.log(`   源文件: ${sourceDocx}`);
  if (modelCode) console.log(`   型号代码: ${modelCode}`);

  try {
    const result = await produceStandardDeliverables({
      sourceFilePath: sourceDocx,
      modelCode,
      targetDir,
      userSyncDir,
      skipAudit,
      skipUserSync
    });

    console.log('\n======================================================');
    console.log('🎉 [MSDS-Studio] 7 阶生产流水线全量执行完毕！');
    console.log(`   产品型号: ${result.modelCode}`);
    console.log(`   总耗时:   ${result.totalDurationSec} 秒`);
    console.log(`   输出目录: ${result.targetDir}`);
    console.log(`   同步目录: ${result.userSyncDir}`);
    console.log('------------------------------------------------------');
    console.log('阶段分解:');
    console.log(`   [阶段 1] 源文件发现:     ${result.stages.stage1.durationMs} ms (大小: ${result.stages.stage1.sourceSizeBytes} 字节)`);
    console.log(`   [阶段 2] 零损耗识别:     ${result.stages.stage2.durationMs} ms (章节: ${result.stages.stage2.recognizedSectionsCount}, 组分: ${result.stages.stage2.componentsCount})`);
    console.log(`   [阶段 3] 规范化治理:     ${result.stages.stage3.durationMs} ms (非危品: ${result.stages.stage3.isNonHazardousComposite})`);
    console.log(`   [阶段 4-5] 编辑器与工序: ${result.stages.stage4_5.durationMs} ms (交付物数: ${result.stages.stage4_5.deliverablesCount})`);
    console.log(`   [阶段 6] 两阶深度审计:   ${result.stages.stage6.durationMs} ms`);
    console.log(`   [阶段 7] 用户目录同步:   ${result.stages.stage7.durationMs} ms (已同步文件数: ${result.stages.stage7.syncedCount})`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n🚨 [MSDS-Studio 生产流水线发生异常]:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
