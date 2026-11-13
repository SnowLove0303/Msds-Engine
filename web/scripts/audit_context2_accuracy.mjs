#!/usr/bin/env node

/**
 * MSDS-Studio Context 2 独立准确性审查器 (audit_context2_accuracy.mjs)
 * 
 * 核心使命:
 * 1. 严格审查 Context 2 生产成果，作为派发通用编辑器写入前的一票否决硬阻断门禁；
 * 2. 贯彻裁执物理隔离，不与生产逻辑共享内存或状态；
 * 3. 运行 C2-M01~M04 结构探针与 C2-P01~P04 事实与防虚增探针；
 * 4. 真实进程退出码 0 为充要通关条件。
 */

import fs from 'fs';
import path from 'path';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: null,
    strict: true,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--target=')) options.target = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (!options.target && !arg.startsWith('--')) options.target = arg.replace(/^["']|["']$/g, '');
  }

  return options;
}

export function auditContext2(context2Data) {
  const issues = [];
  const modelCode = context2Data.modelCode || 'UNKNOWN';
  const isNonHazardous = Boolean(context2Data.isNonHazardous);

  // M01: 16 章节完整性检测
  if (!Array.isArray(context2Data.sections) || context2Data.sections.length !== 16) {
    issues.push({
      code: 'C2-M01_SECTION_COUNT_INVALID',
      level: 'CRITICAL',
      message: `Context 2 必须包含严格 16 个章节，实际为: ${context2Data.sections?.length || 0}`
    });
  }

  // M02: 阶段标记检测
  if (context2Data.stage !== 'STAGE_2_AGENT_SPECIFICATION_REFINED') {
    issues.push({
      code: 'C2-M02_STAGE_UNVERIFIED',
      level: 'CRITICAL',
      message: `Context 2 未声明为 Agent 规范打磨阶段 (STAGE_2_AGENT_SPECIFICATION_REFINED)`
    });
  }

  // M03: 编辑器原语意图完备性检测
  if (!Array.isArray(context2Data.editorOps) || context2Data.editorOps.length < 16) {
    issues.push({
      code: 'C2-M03_INSUFFICIENT_EDITOR_OPS',
      level: 'CRITICAL',
      message: `Context 2 编辑器原语操作意图数量不足 (< 16)，至少每个章节必须有 pre-clear 意图`
    });
  }

  // 逐章检查
  for (const sec of context2Data.sections || []) {
    const sNum = sec.sectionNumber;

    // P01: GHS 非危品防虚增探针
    if (isNonHazardous && sNum === 2) {
      for (const slot of sec.slots || []) {
        if (/象形图|pictogram|信号词|signal\s*word/i.test(slot.label) || /象形图|信号词/i.test(slot.slotKey)) {
          issues.push({
            code: 'C2-P01_EXOGENOUS_NONHAZ_POLLUTION',
            level: 'CRITICAL',
            message: `Section 2 违反 INV-ZERO-EXOGENOUS：非危品严禁输出象形图或信号词虚增项 (触发槽位: ${slot.slotKey})`
          });
        }
      }
    }

    // P02: 度数符号西文化检测
    for (const slot of sec.slots || []) {
      const val = String(slot.value || '');
      if (/[\u2103]/.test(val)) { // 摄氏度符号 ℃
        issues.push({
          code: 'C2-P02_CHINESE_DEGREE_SYMBOL',
          level: 'CRITICAL',
          message: `槽位 ${slot.slotKey} 包含非法中文摄氏度符号 ℃，必须统一为西文 °C (当前值: ${val})`
        });
      }
    }

    // P03: 来源保真与槽位元数据
    for (const slot of sec.slots || []) {
      if (!slot.slotKey || !slot.semanticType || !slot.sourceOrigin) {
        issues.push({
          code: 'C2-P03_SLOT_METADATA_MISSING',
          level: 'CRITICAL',
          message: `章节 ${sNum} 存在未标注元数据或来源的非法槽位: ${JSON.stringify(slot)}`
        });
      }
    }
  }

  // P04: 编辑器原语合法性核验
  for (const op of context2Data.editorOps || []) {
    if (!op.op || !op.sectionNumber || op.sectionNumber < 1 || op.sectionNumber > 16) {
      issues.push({
        code: 'C2-P04_INVALID_EDITOR_OP',
        level: 'CRITICAL',
        message: `存在非法的编辑器原语指令: ${JSON.stringify(op)}`
      });
    }
  }

  const criticals = issues.filter(i => i.level === 'CRITICAL');
  const warnings = issues.filter(i => i.level === 'WARNING');

  return {
    passed: criticals.length === 0,
    modelCode,
    criticalCount: criticals.length,
    warningCount: warnings.length,
    issues
  };
}

async function main() {
  const options = parseArgs();

  if (options.help || !options.target) {
    console.log(`
MSDS-Studio Context 2 独立准确性审查器
使用方法:
  node web/scripts/audit_context2_accuracy.mjs --target=<Context2_JSON_Path>

选项:
  --target=<path>   待审查的 Context 2 JSON 文件路径
  -h, --help        显示帮助信息
`);
    process.exit(options.help ? 0 : 1);
  }

  const targetPath = path.resolve(process.cwd(), options.target);
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 审查目标文件不存在: ${targetPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetPath, 'utf8');
  let data = null;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`❌ 无法解析 Context 2 JSON 文件:`, err.message);
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`🛡️ MSDS-Studio Context 2 独立准确性审查器`);
  console.log(`📄 审查目标: ${targetPath}`);
  console.log(`============================================================`);

  const t0 = Date.now();
  const report = auditContext2(data);
  const durationMs = Date.now() - t0;

  console.log(`⏱️ 审查完成，耗时: ${durationMs} ms`);
  console.log(`📊 审查结果统计: 严重违规 (CRITICAL): ${report.criticalCount} | 警告 (WARNING): ${report.warningCount}`);

  if (report.criticalCount > 0) {
    console.error(`\n❌ Context 2 审查未通过！发现以下违规项:`);
    report.issues.forEach(i => {
      console.error(`   [${i.code}] ${i.message}`);
    });
    console.log(`============================================================\n`);
    process.exit(1);
  }

  console.log(`\n✅ Context 2 准确性审查 100% 满分通过！零格式破损、零虚增、编辑器原语完全就绪！`);
  console.log(`============================================================\n`);
  process.exit(0);
}

// 若直接运行命令行
if (process.argv[1] && process.argv[1].endsWith('audit_context2_accuracy.mjs')) {
  main();
}
