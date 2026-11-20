/**
 * 用户数据库与覆写/审计全过程执行记录底座 (user-exec-db.js)
 *
 * 设计红线 (RTM-05):
 *   1. 本文件仅包含数据库底座（Schema 定义、建表初始化与 CRUD/查询接口），可安全纳入版本库；
 *   2. 实际生成的用户数据文件 (web/data/user_exec_logs.db*) 受 .gitignore 严格隔离保护，
 *      严禁混入业务模板库 msds_repo.db 或推送至远程仓库。
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_DIR = path.resolve(__dirname, '../data');
const DEFAULT_DB_PATH = process.env.MSDS_USER_EXEC_DB_PATH || path.resolve(DEFAULT_DATA_DIR, 'user_exec_logs.db');

const dbCache = new Map();

function nowIso() {
  return new Date().toISOString();
}

/**
 * 获取或按需初始化用户执行记录数据库实例
 * @param {string} [customDbPath]
 * @returns {DatabaseSync}
 */
export function getUserExecDb(customDbPath = null) {
  const dbPath = path.resolve(customDbPath || DEFAULT_DB_PATH);
  if (dbCache.has(dbPath)) {
    return dbCache.get(dbPath);
  }
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  initUserExecSchema(db);
  dbCache.set(dbPath, db);
  return db;
}

/**
 * 关闭指定或全部缓存数据库连接（用于测试清理）
 */
export function closeUserExecDb(customDbPath = null) {
  if (customDbPath) {
    const p = path.resolve(customDbPath);
    const db = dbCache.get(p);
    if (db) {
      db.close();
      dbCache.delete(p);
    }
    return;
  }
  for (const [p, db] of dbCache.entries()) {
    db.close();
    dbCache.delete(p);
  }
}

/**
 * 初始化用户数据库与执行记录四张核心表结构 (Database Base Schema)
 */
export function initUserExecSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      actor_type TEXT NOT NULL DEFAULT 'human',
      created_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_runs (
      run_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      model_code TEXT NOT NULL DEFAULT '',
      source_path TEXT NOT NULL DEFAULT '',
      target_dir TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'PURE_TOPOLOGY_SOURCE_INHERITED',
      status TEXT NOT NULL DEFAULT 'RUNNING',
      current_phase TEXT NOT NULL DEFAULT 'INIT',
      duration_ms INTEGER DEFAULT 0,
      context1_path TEXT DEFAULT '',
      context2_path TEXT DEFAULT '',
      audit_brief_path TEXT DEFAULT '',
      summary_json TEXT DEFAULT '{}',
      started_at TEXT NOT NULL,
      finished_at TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      error_code TEXT DEFAULT 'UNEXPECTED_ERROR',
      message TEXT NOT NULL,
      stack_trace TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      auditor TEXT NOT NULL,
      severity TEXT NOT NULL,
      rule_id TEXT DEFAULT '',
      section_ref TEXT DEFAULT '',
      title TEXT NOT NULL,
      measured_detail TEXT DEFAULT '',
      resolution_status TEXT NOT NULL DEFAULT 'OPEN',
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_runs_user_id ON execution_runs(user_id);
    CREATE INDEX IF NOT EXISTS idx_runs_model ON execution_runs(model_code);
    CREATE INDEX IF NOT EXISTS idx_runs_status ON execution_runs(status);
    CREATE INDEX IF NOT EXISTS idx_wf_err_run_id ON workflow_errors(run_id);
    CREATE INDEX IF NOT EXISTS idx_audit_run_id ON audit_findings(run_id);
    CREATE INDEX IF NOT EXISTS idx_audit_sev ON audit_findings(severity);
    CREATE INDEX IF NOT EXISTS idx_audit_res ON audit_findings(resolution_status);
  `);
}

/**
 * 解析当前默认操作用户标识
 */
export function resolveDefaultUserId() {
  return process.env.MSDS_USER_ID || os.userInfo().username || process.env.USERNAME || process.env.USER || 'local_user';
}

/**
 * 注册或更新用户活跃时间
 */
export function ensureUser({ userId, displayName = null, actorType = 'human' } = {}, customDbPath = null) {
  const db = getUserExecDb(customDbPath);
  const uid = String(userId || resolveDefaultUserId()).trim();
  const dName = String(displayName || uid).trim();
  const aType = ['human', 'agent', 'ci'].includes(actorType) ? actorType : 'human';
  const ts = nowIso();

  db.prepare(`
    INSERT INTO users (user_id, display_name, actor_type, created_at, last_active_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = COALESCE(NULLIF(excluded.display_name, ''), users.display_name),
      actor_type = excluded.actor_type,
      last_active_at = excluded.last_active_at
  `).run(uid, dName, aType, ts, ts);

  return db.prepare('SELECT * FROM users WHERE user_id = ?').get(uid);
}

/**
 * 创建新的覆写+审计执行批次记录
 */
export function createExecutionRun({
  runId = null,
  userId = null,
  displayName = null,
  actorType = 'human',
  modelCode = '',
  sourcePath = '',
  targetDir = '',
  mode = 'PURE_TOPOLOGY_SOURCE_INHERITED'
} = {}, customDbPath = null) {
  const db = getUserExecDb(customDbPath);
  const user = ensureUser({ userId, displayName, actorType }, customDbPath);
  const rid = runId || `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ts = nowIso();

  db.prepare(`
    INSERT INTO execution_runs (
      run_id, user_id, model_code, source_path, target_dir, mode,
      status, current_phase, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'RUNNING', 'INIT', ?)
  `).run(rid, user.user_id, String(modelCode || ''), String(sourcePath || ''), String(targetDir || ''), mode, ts);

  return rid;
}

/**
 * 更新执行批次阶段与产物路径快照
 */
export function updateRunPhase(runId, phase, patch = {}, customDbPath = null) {
  if (!runId) return;
  const db = getUserExecDb(customDbPath);
  const sets = ['current_phase = ?'];
  const params = [String(phase || '')];

  if (patch.context1Path !== undefined) {
    sets.push('context1_path = ?');
    params.push(String(patch.context1Path));
  }
  if (patch.context2Path !== undefined) {
    sets.push('context2_path = ?');
    params.push(String(patch.context2Path));
  }
  if (patch.auditBriefPath !== undefined) {
    sets.push('audit_brief_path = ?');
    params.push(String(patch.auditBriefPath));
  }
  if (patch.mode !== undefined) {
    sets.push('mode = ?');
    params.push(String(patch.mode));
  }

  params.push(runId);
  db.prepare(`UPDATE execution_runs SET ${sets.join(', ')} WHERE run_id = ?`).run(...params);
}

/**
 * 记录覆写工作流阶段性报错或异常中断
 */
export function recordWorkflowError({
  runId,
  phase = 'UNKNOWN',
  errorCode = 'WORKFLOW_ERROR',
  message = '',
  stackTrace = ''
}, customDbPath = null) {
  if (!runId) return null;
  const db = getUserExecDb(customDbPath);
  const ts = nowIso();
  const res = db.prepare(`
    INSERT INTO workflow_errors (run_id, phase, error_code, message, stack_trace, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(runId, String(phase), String(errorCode || 'WORKFLOW_ERROR'), String(message || ''), String(stackTrace || ''), ts);
  return res.lastInsertRowid;
}

/**
 * 批量记录审计未通过项/警告项明细
 */
export function recordAuditFindings(runId, findings = [], customDbPath = null) {
  if (!runId || !Array.isArray(findings) || findings.length === 0) return 0;
  const db = getUserExecDb(customDbPath);
  const ts = nowIso();
  const stmt = db.prepare(`
    INSERT INTO audit_findings (
      run_id, auditor, severity, rule_id, section_ref, title, measured_detail, resolution_status, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN;');
  try {
    for (const f of findings) {
      stmt.run(
        runId,
        String(f.auditor || 'UNKNOWN'),
        String(f.severity || 'FAIL'),
        String(f.ruleId || ''),
        String(f.sectionRef || ''),
        String(f.title || ''),
        String(f.measuredDetail || ''),
        String(f.resolutionStatus || 'OPEN'),
        String(f.note || ''),
        ts
      );
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
  return findings.length;
}

/**
 * 结束并归档执行批次状态
 */
export function finishExecutionRun(runId, { status = 'SUCCESS', durationMs = 0, summary = {} } = {}, customDbPath = null) {
  if (!runId) return;
  const db = getUserExecDb(customDbPath);
  const ts = nowIso();
  db.prepare(`
    UPDATE execution_runs
    SET status = ?, duration_ms = ?, summary_json = ?, finished_at = ?
    WHERE run_id = ?
  `).run(status, Number(durationMs || 0), JSON.stringify(summary || {}), ts, runId);
}

/**
 * 更新单条审计缺陷的处理状态 (OPEN | FIXED | FALSE_POSITIVE)
 */
export function updateFindingResolution(findingId, { resolutionStatus = 'OPEN', note = '' } = {}, customDbPath = null) {
  const db = getUserExecDb(customDbPath);
  const allowed = new Set(['OPEN', 'FIXED', 'FALSE_POSITIVE']);
  const nextStatus = allowed.has(resolutionStatus) ? resolutionStatus : 'OPEN';
  const res = db.prepare(`
    UPDATE audit_findings SET resolution_status = ?, note = ? WHERE id = ?
  `).run(nextStatus, String(note || ''), Number(findingId));
  return res.changes > 0;
}

/**
 * 查询执行批次列表
 */
export function queryExecutionRuns({ userId = null, modelCode = null, status = null, limit = 20 } = {}, customDbPath = null) {
  const db = getUserExecDb(customDbPath);
  const where = [];
  const params = [];

  if (userId) {
    where.push('r.user_id = ?');
    params.push(userId);
  }
  if (modelCode) {
    where.push('r.model_code LIKE ?');
    params.push(`%${modelCode}%`);
  }
  if (status) {
    where.push('r.status = ?');
    params.push(status);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `
    SELECT r.*, u.display_name, u.actor_type,
      (SELECT COUNT(*) FROM workflow_errors we WHERE we.run_id = r.run_id) AS error_count,
      (SELECT COUNT(*) FROM audit_findings af WHERE af.run_id = r.run_id AND af.severity IN ('FAIL', 'CRITICAL')) AS fail_count,
      (SELECT COUNT(*) FROM audit_findings af WHERE af.run_id = r.run_id AND af.severity = 'WARNING') AS warning_count
    FROM execution_runs r
    LEFT JOIN users u ON r.user_id = u.user_id
    ${whereSql}
    ORDER BY r.started_at DESC
    LIMIT ?
  `;
  params.push(Number(limit || 20));
  return db.prepare(sql).all(...params);
}

/**
 * 查询单次执行批次的完整详情（批次信息 + 工作流报错 + 审计缺陷）
 */
export function getRunDetails(runId, customDbPath = null) {
  const db = getUserExecDb(customDbPath);
  const run = db.prepare(`
    SELECT r.*, u.display_name, u.actor_type
    FROM execution_runs r
    LEFT JOIN users u ON r.user_id = u.user_id
    WHERE r.run_id = ?
  `).get(runId);
  if (!run) return null;

  const errors = db.prepare('SELECT * FROM workflow_errors WHERE run_id = ? ORDER BY id ASC').all(runId);
  const findings = db.prepare('SELECT * FROM audit_findings WHERE run_id = ? ORDER BY id ASC').all(runId);
  return { run, errors, findings };
}

/**
 * 检索审计未通过项与警告明细
 */
export function queryAuditFindings({
  runId = null,
  userId = null,
  modelCode = null,
  severity = null,
  resolutionStatus = null,
  keyword = null,
  limit = 100
} = {}, customDbPath = null) {
  const db = getUserExecDb(customDbPath);
  const where = [];
  const params = [];

  if (runId) {
    where.push('af.run_id = ?');
    params.push(runId);
  }
  if (userId) {
    where.push('r.user_id = ?');
    params.push(userId);
  }
  if (modelCode) {
    where.push('r.model_code LIKE ?');
    params.push(`%${modelCode}%`);
  }
  if (severity) {
    where.push('af.severity = ?');
    params.push(severity);
  }
  if (resolutionStatus) {
    where.push('af.resolution_status = ?');
    params.push(resolutionStatus);
  }
  if (keyword) {
    where.push('(af.title LIKE ? OR af.measured_detail LIKE ? OR af.rule_id LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `
    SELECT af.*, r.user_id, r.model_code, r.started_at
    FROM audit_findings af
    INNER JOIN execution_runs r ON af.run_id = r.run_id
    ${whereSql}
    ORDER BY af.id DESC
    LIMIT ?
  `;
  params.push(Number(limit || 100));
  return db.prepare(sql).all(...params);
}

/**
 * 解析各审计脚本输出文本为结构化缺陷明细数组
 * @param {'TOPOLOGY_ROLES' | 'BIPOLAR_BILAYER' | 'MASTER_AUDIT'} auditor
 * @param {string} rawOutput
 */
export function parseAuditOutput(auditor, rawOutput = '') {
  const findings = [];
  const lines = String(rawOutput || '').split(/\r?\n/);

  if (auditor === 'TOPOLOGY_ROLES') {
    for (const line of lines) {
      const m = line.match(/^\s*\[(CRITICAL|WARNING)\]\s+\(([^)]+)\)\s+([^:]+):\s*(.+)$/);
      if (m) {
        const secMatch = m[3].match(/S\d+/);
        findings.push({
          auditor,
          severity: m[1],
          ruleId: m[2].trim(),
          sectionRef: secMatch ? secMatch[0] : m[3].trim(),
          title: `${m[3].trim()}: ${m[4].trim()}`,
          measuredDetail: m[4].trim()
        });
      }
    }
    return findings;
  }

  if (auditor === 'BIPOLAR_BILAYER') {
    for (const line of lines) {
      const m = line.match(/❌\s*\[FAIL\]\s*(.+)$/);
      if (m) {
        const full = m[1].trim();
        const secMatch = full.match(/Section\s*\d+|S\d+/i);
        const ruleMatch = full.match(/\((L-[^)]+|INV-[^)]+)\)/);
        findings.push({
          auditor,
          severity: 'FAIL',
          ruleId: ruleMatch ? ruleMatch[1] : 'BIPOLAR_CHECK',
          sectionRef: secMatch ? secMatch[0] : '',
          title: full,
          measuredDetail: full
        });
      }
    }
    return findings;
  }

  if (auditor === 'MASTER_AUDIT') {
    let pending = null;
    for (const line of lines) {
      const itemMatch = line.match(/^\s*(\d+)\.\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s*(.+)$/);
      if (itemMatch) {
        if (pending) findings.push(pending);
        const secMatch = `${itemMatch[3]} ${itemMatch[4]}`.match(/Section\s*\d+(?:\.\d+)?|S\d+/i);
        pending = {
          auditor,
          severity: 'FAIL',
          ruleId: `${itemMatch[2]}:${itemMatch[3]}`,
          sectionRef: secMatch ? secMatch[0] : '',
          title: `[${itemMatch[3]}] ${itemMatch[4].trim()}`,
          measuredDetail: ''
        };
        continue;
      }
      const detailMatch = line.match(/↳\s*实测情况:\s*(.+)$/);
      if (detailMatch && pending) {
        pending.measuredDetail = detailMatch[1].trim();
        findings.push(pending);
        pending = null;
      }
    }
    if (pending) findings.push(pending);
    return findings;
  }

  return findings;
}
