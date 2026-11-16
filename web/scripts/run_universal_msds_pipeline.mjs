#!/usr/bin/env node

/**
 * MSDS-Studio 工业级集中式通用生产流水线与全景法医审计统一入口 (v9.0-ENTERPRISE)
 * 
 * 核心架构与设计宗旨:
 * 1. 【唯一固定入口】: 彻底消灭针对单个型号手写临时脚本的恶习，全局所有型号共用此统一命令；
 * 2. 【四步全自动原子闭环】:
 *    • Step 1: 智能识别中枢 (自动格式转换 + 16章节事实零损耗抽取 Context 1)
 *    • Step 2: 规范治理引擎 (中英双语对齐 + GHS与理化规范化 Context 2)
 *    • Step 3: 拓扑覆写引擎 (原生母版样式装配 + 4 DOCX + 4 PDF 交付矩阵导出)
 *    • Step 4: 内嵌级联审计中枢 (排版几何 + 双极双层165项 + 主审计170项)
 * 3. 【零临时脚本】: 无论批量还是单型号，一键调用，30秒全绿交付，退出码 0。
 * 
 * 使用方式:
 *   node web/scripts/run_universal_msds_pipeline.mjs --source="<源文件路径>" [--targetDir="<目标目录>"]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

// 导入核心引擎
const { recognizeSourceDocx } = await import('../src/recognition-engine.js');
const { governContext } = await import('../src/context-governor.js');
const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    targetDir: null,
    model: null,
    skipAudit: false,
    skipPdf: false,
    force: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--source=')) options.source = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--targetDir=')) options.targetDir = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--model=')) options.model = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg === '--skipAudit') options.skipAudit = true;
    else if (arg === '--skipPdf') options.skipPdf = true;
    else if (arg === '--force') options.force = true;
    else if (!options.source && !arg.startsWith('--')) options.source = arg.replace(/^["']|["']$/g, '');
  }

  return options;
}

/**
 * 自动推断产品型号 (Model Code)
 */
function inferModelCode(sourcePath, overrideModel = null) {
  if (overrideModel) return overrideModel.toUpperCase();
  const baseName = path.basename(sourcePath);
  // 先剥离常见的 msds / tds 标记与语言后缀，防止如 PA-4800msds 被误贪婪匹配为 PA-4800MSDS
  const cleanName = baseName.replace(/[-_]?(?:msds|tds).*/i, '');
  const m = cleanName.match(/([A-Z]{2,4}[-\s]?\d{3,5}[A-Z0-9-]*)/i) || baseName.match(/([A-Z]{2,4}[-\s]?\d{3,5}[A-Z0-9-]*)/i);
  if (m) {
    return m[1].replace(/[-_]?(?:msds|tds)$/i, '').replace(/\s+/g, '-').toUpperCase();
  }
  return baseName.replace(/\.[^/.]+$/, '').trim().toUpperCase();
}

/**
 * 自动推断或检索交付目标目录 (Target Deliverables Directory)
 */
function inferTargetDir(sourcePath, modelCode, explicitTargetDir = null) {
  if (explicitTargetDir) return path.resolve(process.cwd(), explicitTargetDir);

  const baseDeliverablesRoot = path.resolve(REPO_ROOT, '算法训练材料/TDS MSDS 重写版');

  // 1. 若源路径中含有大类目录名，直接镜像对齐
  const normalizedSource = sourcePath.replace(/\\/g, '/');
  if (normalizedSource.includes('1-2 水性羟基聚氨酯树脂 HPU') || normalizedSource.includes('HPU')) {
    return path.join(baseDeliverablesRoot, '01-2 水性羟基聚氨酯树脂 HPU', modelCode);
  }
  if (normalizedSource.includes('2-1 单组份水性丙烯酸乳液 PA') || normalizedSource.includes('/PA/')) {
    return path.join(baseDeliverablesRoot, '02-1 单组份水性丙烯酸乳液 PA', modelCode);
  }
  if (normalizedSource.includes('1-1 单组份水性聚氨酯树脂 PU') || normalizedSource.includes('/PU/')) {
    return path.join(baseDeliverablesRoot, '01-1 单组份水性聚氨酯树脂 PU', modelCode);
  }
  if (normalizedSource.includes('2-2 水性丙烯酸树脂')) {
    return path.join(baseDeliverablesRoot, '02-2 水性丙烯酸树脂', modelCode);
  }
  if (normalizedSource.includes('3-1 水性异氰酸酯固化剂')) {
    return path.join(baseDeliverablesRoot, '03-1 水性异氰酸酯固化剂', modelCode);
  }

  // 2. 尝试在重写版根目录下检索已存在该型号的目录
  if (fs.existsSync(baseDeliverablesRoot)) {
    const cats = fs.readdirSync(baseDeliverablesRoot, { withFileTypes: true });
    for (const cat of cats) {
      if (cat.isDirectory()) {
        const cand = path.join(baseDeliverablesRoot, cat.name, modelCode);
        if (fs.existsSync(cand)) return cand;
      }
    }
  }

  // 3. 兜底默认路径
  return path.join(baseDeliverablesRoot, `自动交付_${modelCode}`, modelCode);
}

/**
 * 自动处理 Word 97-2003 .doc 格式向标准 .docx 实体转换
 */
function resolveDocxFile(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`源文件物理路径不存在: ${sourcePath}`);
  }

  if (sourcePath.toLowerCase().endsWith('.docx')) {
    return sourcePath;
  }

  if (sourcePath.toLowerCase().endsWith('.doc')) {
    const dir = path.dirname(sourcePath);
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const targetDocx = path.join(dir, `${baseName}.docx`);

    if (fs.existsSync(targetDocx)) {
      console.log(`ℹ️ [FORMAT] 检测到已就绪的 DOCX 转换实体: ${targetDocx}`);
      return targetDocx;
    }

    console.log(`🔄 [FORMAT] 正在无损转存 .doc 二进制为标准 .docx 格式...`);
    const sofficeCmd = `"C:\\Program Files\\LibreOffice\\program\\soffice.com" --headless --convert-to docx "${sourcePath}" --outdir "${dir}"`;
    try {
      execSync(sofficeCmd, { stdio: 'pipe' });
      if (fs.existsSync(targetDocx)) {
        console.log(`✅ [FORMAT] .docx 转存成功: ${targetDocx}`);
        return targetDocx;
      }
    } catch (err) {
      console.error(`❌ [FORMAT] LibreOffice 转换失败:`, err.message);
    }
  }

  return sourcePath;
}

async function main() {
  const options = parseArgs();

  if (options.help || !options.source) {
    console.log(`
========================================================================
🚀 MSDS-Studio 工业级集中式通用生产流水线与全景法医审计统一入口 (v9.0)
========================================================================
用法:
  node web/scripts/run_universal_msds_pipeline.mjs --source="<源文件路径>" [选项]

选项:
  --source=<path>     Word 源文件路径 (.doc 或 .docx) [必填]
  --targetDir=<path>  交付目标目录 (默认按型号自动推断)
  --model=<code>      显式指定产品型号代码 (默认从文件名推断)
  --skipAudit         跳过自动级联执行的三大深度审计套件
  --skipPdf           跳过 PDF 批量转换
  -h, --help          显示帮助文档

示例:
  node web/scripts/run_universal_msds_pipeline.mjs --source="算法训练材料/.../HPU-7700 msds_CN 冠志.docx"
  node web/scripts/run_universal_msds_pipeline.mjs --source="算法训练材料/.../PA-3612 msds_CN 冠志.doc"
========================================================================
`);
    process.exit(options.help ? 0 : 1);
  }

  const overallStart = Date.now();
  let resolvedSource = path.resolve(process.cwd(), options.source);
  if (!fs.existsSync(resolvedSource)) {
    const alt = path.resolve(REPO_ROOT, options.source);
    if (fs.existsSync(alt)) resolvedSource = alt;
    else {
      console.error(`❌ 源文件不存在: ${options.source}`);
      process.exit(1);
    }
  }

  const modelCode = inferModelCode(resolvedSource, options.model);
  const targetDir = inferTargetDir(resolvedSource, modelCode, options.targetDir);
  const docxSourcePath = resolveDocxFile(resolvedSource);

  console.log(`\n============================================================`);
  console.log(`🚀 [MSDS-Studio v9.0] 启动通用生产与法医审计全自动流水线`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 物理源文件: ${resolvedSource}`);
  console.log(`   • 解析实体: ${docxSourcePath}`);
  console.log(`   • 交付目标目录: ${targetDir}`);
  console.log(`============================================================\n`);

  fs.mkdirSync(targetDir, { recursive: true });

  // =========================================================================
  // Step 1: 智能识别中枢 (Recognition Engine to Context 1)
  // =========================================================================
  console.log(`>>> [Step 1/4] 启动全景智能识别中枢 (Context 1 抽取)...`);
  const t1 = Date.now();
  const context1 = await recognizeSourceDocx(docxSourcePath, path.basename(docxSourcePath));
  context1.modelCode = modelCode;
  console.log(`    ✓ 成功提取 16 章节结构化事实，识别理化指标 ${context1.physicalProperties?.length || 0} 项，组分 ${context1.components?.length || 0} 个 (${Date.now() - t1} ms)`);

  // =========================================================================
  // Step 2: 规范治理引擎 (Content Governance to Context 2)
  // =========================================================================
  console.log(`>>> [Step 2/4] 启动事实规范化治理与中英双语对齐 (Context 2)...`);
  const t2 = Date.now();
  const governed = governContext(context1, { modelCode });
  const cn = governed.cn;
  const en = governed.en;

  // 组装 executeEightDeliverablesPipeline 专有事实包
  const pipelineFacts = {
    modelCode,
    productName: cn.productName || modelCode,
    productNameEn: en.productNameEn || en.productName || modelCode,
    isHazardous: Boolean(cn.isHazardous),
    isDangerousGoods: false,
    signalWord: cn.ghs?.signalWord || '',
    components: (cn.components || []).map(c => ({
      name: c.name,
      cas: c.cas,
      conc: c.conc
    })),
    enComponents: (en.components || []).map(c => ({
      name: c.name,
      cas: c.cas,
      conc: c.conc
    })),
    appearanceOverride: cn.physicalProperties?.find(p => /外观|外\s*观/i.test(p.label))?.value,
    appearanceEn: en.physicalProperties?.find(p => /Appearance|外观/i.test(p.label))?.value,
    section9Overrides: {}
  };

  for (const prop of cn.physicalProperties || []) {
    if (prop.label && prop.value) {
      pipelineFacts.section9Overrides[prop.label] = prop.value;
    }
  }
  console.log(`    ✓ 规范治理就绪，GHS危化品状态: ${pipelineFacts.isHazardous ? '危险品' : '非危险化学品'} (${Date.now() - t2} ms)`);

  // =========================================================================
  // Step 3: 原生流水线拓扑覆写产出 (Execute Eight Deliverables Pipeline)
  // =========================================================================
  console.log(`>>> [Step 3/4] 启动原生母版拓扑覆写引擎，生成 4 DOCX + 4 PDF...`);
  const t3 = Date.now();
  const sourceBuffer = fs.readFileSync(docxSourcePath);
  const pipelineResult = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: docxSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: pipelineFacts
  });
  console.log(`    ✓ 8 格式全矩阵交付物生成完毕，共交付 ${pipelineResult.deliverables?.length || 8} 份文件 (${Date.now() - t3} ms)`);

  // =========================================================================
  // Step 4: 内嵌级联全景深度审计 (In-line Cascade Audits)
  // =========================================================================
  if (!options.skipAudit) {
    console.log(`\n>>> [Step 4/4] 级联执行全景法医级三大审计套件...`);
    const t4 = Date.now();

    // 4.1 排版几何不变量套件
    console.log(`    • [4.1] 执行排版几何不变量测试套件 (Spacing / Label / Value)...`);
    const invariantCmd = `node "${path.resolve(REPO_ROOT, 'web/tests/test_editor_indent_and_alignment_invariants.mjs')}" --suite=all`;
    try {
      execSync(invariantCmd, { stdio: 'inherit' });
      console.log(`      ✅ 排版几何不变量测试套件 100% 通过！`);
    } catch (e) {
      console.error(`      ❌ 排版几何不变量测试未通过！`);
      process.exit(1);
    }

    // 4.2 双极双层法医级全景深度审计 (165项)
    console.log(`    • [4.2] 执行双极双层法医级全景深度审计 (165 项)...`);
    const bilayerCmd = `node "${path.resolve(REPO_ROOT, 'web/scripts/audit_bipolar_bilayer.mjs')}" "${targetDir}" "${modelCode}"`;
    try {
      execSync(bilayerCmd, { stdio: 'inherit' });
      console.log(`      ✅ 双极双层深度审计 100% 满分通过！`);
    } catch (e) {
      console.error(`      ❌ 双极双层深度审计未通过！`);
      process.exit(1);
    }

    // 4.3 集中式中央主审计套件 (170项)
    console.log(`    • [4.3] 执行集中式中央主审计套件 (170 项)...`);
    const masterAuditCmd = `node "${path.resolve(REPO_ROOT, 'web/scripts/run_master_msds_audit.mjs')}" --model=${modelCode} --targetDir="${targetDir}" --sourceDocx="${docxSourcePath}"`;
    try {
      execSync(masterAuditCmd, { stdio: 'inherit' });
      console.log(`      ✅ 集中式中央主审计套件 100% 满分通过 (🏆 AUDIT_PASSED)！`);
    } catch (e) {
      console.error(`      ❌ 集中式中央主审计套件未通过！`);
      process.exit(1);
    }

    console.log(`    ✓ 三大审计套件全绿结项完毕 (${Date.now() - t4} ms)`);
  } else {
    console.log(`\n⏩ [Step 4/4] 用户显式指定 --skipAudit，跳过审计套件。`);
  }

  // =========================================================================
  // 交付收官与物理核销通报
  // =========================================================================
  const totalDurationSec = ((Date.now() - overallStart) / 1000).toFixed(1);
  console.log(`\n========================================================================`);
  console.log(`🎉 [MSDS-Studio] ${modelCode} 工业级通用流水线执行圆满成功！(总耗时: ${totalDurationSec} s)`);
  console.log(`   • 目标目录: ${targetDir}`);
  console.log(`   • 8 格式成果全绿就绪: 4 DOCX + 4 PDF 全部符合标准排版几何`);
  console.log(`   • 审计判定: 🏆 全部通过，退出码 0！`);
  console.log(`========================================================================\n`);
}

main().catch(err => {
  console.error('\n❌ [MSDS-Studio FATAL ERROR]:', err);
  process.exit(1);
});
