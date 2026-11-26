#!/usr/bin/env node

/**
 * MSDS-Studio Agent 三任务审计前置采集器 (Test Kit)
 *
 * 为 Agent 审计任务 1（内容审计 · 单文件合并 Context 3）生成统一输入资产，
 * 随后由审计 Agent 独立完成任务 1、任务 2（7 维度拓扑审计）与任务 3（全量并集核销）。
 */

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATOR = path.resolve(__dirname, '../../web/scripts/generate_context3_report.mjs');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log('用法: node run_three_task_audit_prep.mjs --model=<MODEL> --source=<SOURCE_DOCX> --cn=<CN_DOCX> --en=<EN_DOCX> --out=<OUT_MD>');
  process.exit(0);
}

const res = spawnSync('node', [GENERATOR, ...args], { stdio: 'inherit' });
process.exit(res.status ?? 1);
