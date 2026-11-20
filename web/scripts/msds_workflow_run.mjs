#!/usr/bin/env node
/**
 * MSDS-Studio 编排式工作流统一功能入口 (Orchestrated Workflow Entry Point)
 *
 * 将系统的核心模块编排为标准化三阶受控流水线：
 *   Stage 1: msds_recognize_source  -> 产出 Context 1 (无损物理事实 + integrity 指纹)
 *   Stage 2: audit_context1_mechanical -> 独立机械反向审计 (可配置 --skipAudit 跳过，默认开启)
 *   Stage 3: msds_govern_context2   -> 产出 Context 2 (16章节机械重分类 + 源继承 + 英文映射 + validation)
 *
 * 用法:
 *   node web/scripts/msds_workflow_run.mjs --source="<SOURCE_DOCX>" --outDir="<OUTPUT_DIR>"
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GATEWAY_PATH = path.resolve(__dirname, 'msds_mcp_gateway.mjs');
const AUDIT_PATH = path.resolve(__dirname, 'audit_context1_mechanical.mjs');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const eqIdx = token.indexOf('=');
    if (eqIdx !== -1) {
      args[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
    } else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function inferModelCode(sourcePath) {
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const match = base.match(/([A-Z]{1,4}-\d{2,5}(?:[A-Z](?![a-z]))?)/);
  return match ? match[1].toUpperCase() : base.replace(/[^\w-]+/g, '_');
}

function runNodeStep(label, scriptPath, stepArgs) {
  const t0 = Date.now();
  const res = spawnSync('node', [scriptPath, ...stepArgs], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return {
    label,
    durationMs: Date.now() - t0,
    exitCode: res.status ?? 1,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim()
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.source) {
    console.log(
      '用法: node web/scripts/msds_workflow_run.mjs --source="<SOURCE_DOCX>" [--outDir="<OUTPUT_DIR>"] [--skipAudit]'
    );
    process.exit(args.help ? 0 : 1);
  }

  const sourcePath = path.resolve(args.source);
  if (!fs.existsSync(sourcePath)) {
    console.error(`[WORKFLOW_ERROR] 源文件不存在: ${sourcePath}`);
    process.exit(1);
  }

  const modelCode = args.model || inferModelCode(sourcePath);
  const outDir = path.resolve(args.outDir || path.join(path.dirname(sourcePath), '_workflow_out'));
  fs.mkdirSync(outDir, { recursive: true });

  const ctx1Path = path.join(outDir, `${modelCode}_context1.md`);
  const ctx2Path = path.join(outDir, `${modelCode}_context2.md`);
  const reportPath = path.join(outDir, `${modelCode}_workflow_report.json`);

  const stages = [];

  // Stage 1: Context 1 Recognition
  const s1 = runNodeStep('Stage 1: msds_recognize_source', GATEWAY_PATH, [
    '--tool=msds_recognize_source',
    `--source=${sourcePath}`,
    '--format=md',
    `--out=${ctx1Path}`
  ]);
  stages.push(s1);
  if (s1.exitCode !== 0) {
    console.error(`[STAGE 1 FAILED] ${s1.stderr || s1.stdout}`);
    fs.writeFileSync(reportPath, JSON.stringify({ modelCode, sourcePath, status: 'FAILED', stages }, null, 2), 'utf8');
    process.exit(s1.exitCode);
  }

  // Stage 2: Mechanical Audit (optional skip via --skipAudit)
  if (!args.skipAudit && fs.existsSync(AUDIT_PATH)) {
    const s2 = runNodeStep('Stage 2: audit_context1_mechanical', AUDIT_PATH, [
      `--target=${ctx1Path}`,
      '--strict'
    ]);
    stages.push(s2);
    if (s2.exitCode !== 0) {
      console.error(`[STAGE 2 AUDIT FAILED]\n${s2.stdout}\n${s2.stderr}`);
      fs.writeFileSync(reportPath, JSON.stringify({ modelCode, sourcePath, status: 'AUDIT_FAILED', stages }, null, 2), 'utf8');
      process.exit(s2.exitCode);
    }
  }

  // Stage 3: Context 2 Governance
  const s3 = runNodeStep('Stage 3: msds_govern_context2', GATEWAY_PATH, [
    '--tool=msds_govern_context2',
    `--source=${sourcePath}`,
    '--format=md',
    `--out=${ctx2Path}`
  ]);
  stages.push(s3);
  if (s3.exitCode !== 0) {
    console.error(`[STAGE 3 FAILED] ${s3.stderr || s3.stdout}`);
    fs.writeFileSync(reportPath, JSON.stringify({ modelCode, sourcePath, status: 'FAILED', stages }, null, 2), 'utf8');
    process.exit(s3.exitCode);
  }

  const report = {
    modelCode,
    sourcePath,
    status: 'PASSED',
    outputs: { context1: ctx1Path, context2: ctx2Path, report: reportPath },
    stages: stages.map(({ label, durationMs, exitCode, stdout }) => ({
      label,
      durationMs,
      exitCode,
      summary: stdout
    }))
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`✅ [WORKFLOW PASSED] ${modelCode}`);
  for (const st of report.stages) {
    console.log(`  - ${st.label} (${st.durationMs}ms) -> exit ${st.exitCode}`);
  }
  console.log(`  - Context 1: ${ctx1Path}`);
  console.log(`  - Context 2: ${ctx2Path}`);
  console.log(`  - Report:    ${reportPath}`);
}

main();
