#!/usr/bin/env node

/**
 * 分阶段纯确定性机械审计 CLI 入口 (run_staged_mechanical_audit.mjs)
 *
 * 用法:
 *   node web/scripts/run_staged_mechanical_audit.mjs --targetDir="..." --model=PA-4840 --source="..." [--stage=all|docx|pdf] [--json]
 */

import path from 'node:path';
import { runStagedMechanicalAudit } from '../src/staged-mechanical-audit.js';
import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { buildStructuredContext2 } from '../src/context-governor.js';

function parseArgs() {
  const opts = { stage: 'all', targetDir: null, model: null, source: null, json: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--json') opts.json = true;
    else if (a.startsWith('--stage=')) opts.stage = a.slice(8).toLowerCase();
    else if (a.startsWith('--targetDir=')) opts.targetDir = a.slice(12).replace(/^["']|["']$/g, '');
    else if (a.startsWith('--model=')) opts.model = a.slice(8).replace(/^["']|["']$/g, '');
    else if (a.startsWith('--source=')) opts.source = a.slice(9).replace(/^["']|["']$/g, '');
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  let context1 = null;
  let context2 = null;

  if (opts.source && (opts.stage === 'all' || opts.stage === 'phase1' || opts.stage === 'context2')) {
    context1 = await recognizeSourceDocx(opts.source, path.basename(opts.source));
    if (opts.model) context1.modelCode = opts.model;
    if (opts.stage === 'all' || opts.stage === 'context2') {
      context2 = buildStructuredContext2(context1);
    }
  }

  const res = await runStagedMechanicalAudit({
    stage: opts.stage,
    sourcePath: opts.source,
    context1,
    context2,
    targetDir: opts.targetDir,
    modelCode: opts.model
  });

  if (opts.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log(`\n=== [分阶段纯确定性机械审计] (${opts.model || 'N/A'} | stage=${opts.stage}) ===`);
    console.log(`通过: ${res.summary.passed} | CRITICAL: ${res.summary.critical} | FAIL: ${res.summary.fail} | WARNING: ${res.summary.warning}`);
    for (const f of res.findings) {
      console.log(`  [${f.severity}] (${f.ruleId}) [${f.sectionRef}] ${f.title} -> ${f.measuredDetail}`);
    }
    console.log(res.ok ? '✅ [STAGED MECHANICAL AUDIT PASSED]' : '❌ [STAGED MECHANICAL AUDIT BLOCKED]');
  }

  if (!res.ok) process.exit(1);
}

main().catch(err => {
  console.error('❌ [STAGED MECHANICAL AUDIT ERROR]', err);
  process.exit(1);
});
