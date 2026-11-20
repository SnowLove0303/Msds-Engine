#!/usr/bin/env node

/**
 * 用户执行记录数据库 CLI 查询与台账管理工具 (query_exec_logs.mjs)
 *
 * 用法示例:
 *   node web/scripts/query_exec_logs.mjs --model=PA-4840
 *   node web/scripts/query_exec_logs.mjs --user=admin_dev --status=AUDIT_BLOCKED
 *   node web/scripts/query_exec_logs.mjs --runId=run_xxx
 *   node web/scripts/query_exec_logs.mjs --severity=FAIL --limit=30
 *   node web/scripts/query_exec_logs.mjs --resolve=12 --resolution=FALSE_POSITIVE --note="硬编码规则误报"
 */

import {
  queryExecutionRuns,
  getRunDetails,
  queryAuditFindings,
  updateFindingResolution,
  closeUserExecDb
} from '../src/user-exec-db.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    user: null,
    model: null,
    status: null,
    runId: null,
    severity: null,
    resolution: null,
    keyword: null,
    resolveId: null,
    note: '',
    limit: 20,
    json: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--json') opts.json = true;
    else if (arg.startsWith('--user=')) opts.user = arg.split('=', 2)[1];
    else if (arg.startsWith('--model=')) opts.model = arg.split('=', 2)[1];
    else if (arg.startsWith('--status=')) opts.status = arg.split('=', 2)[1].toUpperCase();
    else if (arg.startsWith('--runId=')) opts.runId = arg.split('=', 2)[1];
    else if (arg.startsWith('--severity=')) opts.severity = arg.split('=', 2)[1].toUpperCase();
    else if (arg.startsWith('--resolution=')) opts.resolution = arg.split('=', 2)[1].toUpperCase();
    else if (arg.startsWith('--keyword=')) opts.keyword = arg.split('=', 2)[1];
    else if (arg.startsWith('--resolve=')) opts.resolveId = Number(arg.split('=', 2)[1]);
    else if (arg.startsWith('--note=')) opts.note = arg.split('=', 2)[1];
    else if (arg.startsWith('--limit=')) opts.limit = Number(arg.split('=', 2)[1]) || 20;
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  if (opts.help) {
    console.log(`
MSDS-Studio 用户数据库与执行记录查询工具
用法:
  node web/scripts/query_exec_logs.mjs [选项]

选项:
  --user=<id>           按操作用户过滤
  --model=<code >       按产品型号模糊匹配
  --status=<status>     按批次状态过滤 (RUNNING | SUCCESS | FAILED | AUDIT_BLOCKED)
  --runId=<id>          查看指定执行批次的完整报错与审计缺陷明细
  --severity=<level>    直接检索审计缺陷 (CRITICAL | FAIL | WARNING)
  --keyword=<text>      按关键词检索审计缺陷
  --resolve=<findingId> 更新指定缺陷的排查状态 (需配合 --resolution=OPEN|FIXED|FALSE_POSITIVE)
  --note=<text>         更新排查状态时附带说明
  --limit=<n>           最大返回条数 (默认 20)
  --json                输出纯 JSON 结构
`);
    return;
  }

  // 1. 更新排查状态模式
  if (opts.resolveId) {
    const ok = updateFindingResolution(opts.resolveId, {
      resolutionStatus: opts.resolution || 'FIXED',
      note: opts.note
    });
    if (opts.json) {
      console.log(JSON.stringify({ updated: ok, findingId: opts.resolveId, resolutionStatus: opts.resolution || 'FIXED' }));
    } else {
      console.log(ok ? `✅ 已更新缺陷 #${opts.resolveId} 状态为 ${opts.resolution || 'FIXED'}` : `❌ 未找到缺陷 #${opts.resolveId}`);
    }
    return;
  }

  // 2. 查看单次执行批次详情模式
  if (opts.runId) {
    const details = getRunDetails(opts.runId);
    if (!details) {
      console.error(`❌ 未找到执行批次: ${opts.runId}`);
      process.exitCode = 1;
      return;
    }
    if (opts.json) {
      console.log(JSON.stringify(details, null, 2));
      return;
    }
    const { run, errors, findings } = details;
    console.log(`\n============================================================`);
    console.log(`📋 执行批次详情: ${run.run_id}`);
    console.log(`   • 操作用户: ${run.user_id} (${run.actor_type}) | 型号: ${run.model_code} | 模式: ${run.mode}`);
    console.log(`   • 最终状态: ${run.status} | 停驻阶段: ${run.current_phase} | 耗时: ${run.duration_ms} ms`);
    console.log(`   • 起止时间: ${run.started_at} -> ${run.finished_at || '进行中'}`);
    if (run.context1_path) console.log(`   • Context 1: ${run.context1_path}`);
    if (run.context2_path) console.log(`   • Context 2: ${run.context2_path}`);
    if (run.audit_brief_path) console.log(`   • 速查快照:  ${run.audit_brief_path}`);
    console.log(`============================================================`);

    console.log(`\n🚨 [工作流报错记录] (${errors.length} 条):`);
    if (errors.length === 0) {
      console.log('   (无)');
    } else {
      for (const err of errors) {
        console.log(`   - [${err.phase}] (${err.error_code}) ${err.message}`);
      }
    }

    const fails = findings.filter(f => f.severity === 'FAIL' || f.severity === 'CRITICAL');
    const warns = findings.filter(f => f.severity === 'WARNING');
    console.log(`\n🔍 [审计缺陷明细] (FAIL/CRITICAL: ${fails.length} 条 | WARNING: ${warns.length} 条):`);
    for (const f of fails) {
      console.log(`   ❌ [#${f.id} | ${f.auditor} | ${f.resolution_status}] ${f.title}`);
      if (f.measured_detail && f.measured_detail !== f.title) {
        console.log(`      ↳ 实测: ${f.measured_detail}`);
      }
    }
    if (warns.length > 0) {
      console.log(`   ⚠️ 警告项 (${warns.length} 条，展示前 10 条):`);
      for (const w of warns.slice(0, 10)) {
        console.log(`      - [#${w.id} | ${w.rule_id}] ${w.title}`);
      }
    }
    console.log('');
    return;
  }

  // 3. 审计缺陷专项检索模式
  if (opts.severity || opts.keyword || opts.resolution) {
    const findings = queryAuditFindings({
      userId: opts.user,
      modelCode: opts.model,
      severity: opts.severity,
      resolutionStatus: opts.resolution,
      keyword: opts.keyword,
      limit: opts.limit
    });
    if (opts.json) {
      console.log(JSON.stringify(findings, null, 2));
      return;
    }
    console.log(`\n🔍 检索到审计缺陷 ${findings.length} 条:`);
    for (const f of findings) {
      console.log(`  [#${f.id}] [${f.model_code}] [${f.auditor}/${f.severity}] [${f.resolution_status}] ${f.title}`);
      if (f.measured_detail && f.measured_detail !== f.title) {
        console.log(`      ↳ ${f.measured_detail}`);
      }
    }
    console.log('');
    return;
  }

  // 4. 默认：查询执行批次列表
  const runs = queryExecutionRuns({
    userId: opts.user,
    modelCode: opts.model,
    status: opts.status,
    limit: opts.limit
  });
  if (opts.json) {
    console.log(JSON.stringify(runs, null, 2));
    return;
  }
  console.log(`\n📊 用户执行记录数据库汇总 (最近 ${runs.length} 批次):`);
  console.log('--------------------------------------------------------------------------------------------');
  for (const r of runs) {
    console.log(
      `• ${r.run_id} | 用户:${r.user_id}(${r.actor_type}) | 型号:${r.model_code} | 状态:${r.status} | ` +
      `报错:${r.error_count} | FAIL:${r.fail_count} | WARN:${r.warning_count} | ${r.started_at}`
    );
  }
  console.log('--------------------------------------------------------------------------------------------');
  console.log('💡 提示: 使用 --runId=<run_id> 查看单次执行的所有报错与未通过项明细。\n');
}

try {
  main();
} finally {
  closeUserExecDb();
}
