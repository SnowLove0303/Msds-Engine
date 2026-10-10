import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DOCS_DIR = path.resolve(DATA_DIR, 'docs');
const DB_PATH = path.resolve(DATA_DIR, 'msds_repo.db');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

    dbInstance = new DatabaseSync(DB_PATH);
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      batch_id TEXT PRIMARY KEY,
      batch_name TEXT NOT NULL,
      total_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      created_by TEXT DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS msds_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      model TEXT DEFAULT '',
      language TEXT DEFAULT 'CN',
      entity TEXT DEFAULT '冠志',
      template_variant TEXT DEFAULT 'CN_GUANZHI',
      status TEXT DEFAULT 'PERFECT',
      matched_fields INTEGER DEFAULT 0,
      pruned_fields INTEGER DEFAULT 0,
      conflict_fields INTEGER DEFAULT 0,
      unmatched_fields INTEGER DEFAULT 0,
      annotations_count INTEGER DEFAULT 0,
      engine_version TEXT DEFAULT '1.3.0',
      raw_facts_json TEXT DEFAULT '{}',
      match_result_json TEXT DEFAULT '{}',
      annotations_json TEXT DEFAULT '[]',
      docx_path TEXT DEFAULT '',
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_batch_id ON msds_records(batch_id);
    CREATE INDEX IF NOT EXISTS idx_records_status ON msds_records(status);
    CREATE INDEX IF NOT EXISTS idx_records_model ON msds_records(model);
    CREATE INDEX IF NOT EXISTS idx_records_updated_at ON msds_records(updated_at DESC);
  `);
}

export function serializeRawFacts(records) {
  if (!Array.isArray(records)) return records || [];
  return records.map((rec) => ({
    id: rec.id,
    title: rec.title,
    section: rec.section,
    sectionNumber: rec.sectionNumber,
    searchText: rec.searchText,
    kind: rec.kind,
    rows: (rec.rows || []).map((row) => ({
      index: row.index,
      cells: (row.cells || []).map((c) => ({
        id: c.id,
        index: c.index,
        text: c.text || '',
        labelText: c.labelText || '',
        valueText: c.valueText || '',
        editable: Boolean(c.editable),
        role: c.role || 'value',
      })),
    })),
  }));
}

export function serializeMatchResult(matchRes) {
  if (!matchRes || typeof matchRes !== 'object') return {};
  return {
    success: matchRes.success,
    engineVersion: matchRes.engineVersion || '1.3.0',
    summary: matchRes.summary || {},
    fileNaming: matchRes.fileNaming || {},
    headerFooter: matchRes.headerFooter || {},
    matchedSections: (matchRes.matchedSections || []).map((sec) => ({
      sectionNumber: sec.sectionNumber,
      title: sec.title,
      matchedRows: (sec.matchedRows || []).map((r) => ({
        key: r.key,
        slotId: r.slotId,
        standardLabel: r.standardLabel,
        conditionQualifier: r.conditionQualifier || '',
        value: r.value || '',
        logicalLines: r.logicalLines || [],
        lineBreakPolicy: r.lineBreakPolicy,
        structuralDisposition: r.structuralDisposition,
        status: r.status,
        reason: r.reason,
        rawSnippet: r.rawSnippet || '',
        hasDrawing: Boolean(r.drawingNode),
      })),
      components: sec.components || [],
      stats: sec.stats || {},
    })),
  };
}

export function createBatch({ batchId, batchName, createdBy = 'manual' }) {
  const db = getDb();
  const id = batchId || `BATCH-${Date.now()}`;
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO batches (batch_id, batch_name, total_count, created_at, created_by)
    VALUES (?, ?, COALESCE((SELECT total_count FROM batches WHERE batch_id = ?), 0), ?, ?)
  `);
  stmt.run(id, batchName || `批次-${new Date(now).toLocaleString('zh-CN')}`, id, now, createdBy);
  return { batchId: id, batchName, createdAt: now, createdBy };
}

export function listBatches() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT b.*, COUNT(r.id) AS actual_count
    FROM batches b
    LEFT JOIN msds_records r ON b.batch_id = r.batch_id
    GROUP BY b.batch_id
    ORDER BY b.created_at DESC
  `);
  return stmt.all();
}

export function saveDocxFile(id, buffer) {
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  const docxFile = path.resolve(DOCS_DIR, `${id}.docx`);
  fs.writeFileSync(docxFile, Buffer.from(buffer));
  return `docs/${id}.docx`;
}

export function getDocxBuffer(id) {
  const docxFile = path.resolve(DOCS_DIR, `${id}.docx`);
  if (!fs.existsSync(docxFile)) return null;
  return fs.readFileSync(docxFile);
}

export function saveRecord(record) {
  const db = getDb();
  const now = Date.now();
  const id = record.id || `REC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let docxRelPath = record.docxPath || '';

  if (record.docxBuffer) {
    docxRelPath = saveDocxFile(id, record.docxBuffer);
  }

  const rawFactsStr = typeof record.rawFactsJson === 'string'
    ? record.rawFactsJson
    : JSON.stringify(serializeRawFacts(record.rawFactsJson));

  const matchResultStr = typeof record.matchResultJson === 'string'
    ? record.matchResultJson
    : JSON.stringify(serializeMatchResult(record.matchResultJson));

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO msds_records (
      id, batch_id, file_name, model, language, entity, template_variant,
      status, matched_fields, pruned_fields, conflict_fields, unmatched_fields,
      annotations_count, engine_version, raw_facts_json, match_result_json,
      annotations_json, docx_path, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  stmt.run(
    id,
    record.batchId || 'default',
    record.fileName || 'unknown.docx',
    record.model || '',
    record.language || 'CN',
    record.entity || '冠志',
    record.templateVariant || 'CN_GUANZHI',
    record.status || 'PERFECT',
    Number(record.matchedFields || 0),
    Number(record.prunedFields || 0),
    Number(record.conflictFields || 0),
    Number(record.unmatchedFields || 0),
    Number(record.annotationsCount || 0),
    record.engineVersion || '1.3.0',
    rawFactsStr,
    matchResultStr,
    typeof record.annotationsJson === 'string' ? record.annotationsJson : JSON.stringify(record.annotationsJson || []),
    docxRelPath,
    now
  );

  return { id, docxPath: docxRelPath, updatedAt: now };
}

export function getRecords({ batchId = 'all', status = 'all', query = '', limit = 100, offset = 0 } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (batchId && batchId !== 'all') {
    conditions.push('batch_id = ?');
    params.push(batchId);
  }

  if (status && status !== 'all') {
    if (status === 'perfect') {
      conditions.push('conflict_fields = 0 AND unmatched_fields = 0');
    } else if (status === 'conflicts') {
      conditions.push('conflict_fields > 0');
    } else if (status === 'unmatched') {
      conditions.push('unmatched_fields > 0');
    } else if (status === 'annotated') {
      conditions.push('annotations_count > 0');
    } else {
      conditions.push('status = ?');
      params.push(status);
    }
  }

  if (query && query.trim()) {
    conditions.push('(model LIKE ? OR file_name LIKE ?)');
    const q = `%${query.trim()}%`;
    params.push(q, q);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT id, batch_id, file_name, model, language, entity, template_variant,
           status, matched_fields, pruned_fields, conflict_fields, unmatched_fields,
           annotations_count, engine_version, docx_path, updated_at
    FROM msds_records
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const stmt = db.prepare(sql);
  const rawRecords = stmt.all(...params);

  // 获取总数
  const countSql = `SELECT COUNT(*) AS total FROM msds_records ${whereClause}`;
  const countStmt = db.prepare(countSql);
  const countParams = params.slice(0, -2);
  const countResult = countStmt.get(...countParams);

  const records = rawRecords.map((r) => {
    const totalFields = (r.matched_fields || 0) + (r.conflict_fields || 0) + (r.unmatched_fields || 0);
    const score = totalFields > 0 ? Math.round(((r.matched_fields || 0) / totalFields) * 100) : 0;
    const targetTemplate = r.template_variant === 'CN_GUANZHI' ? 'CN 冠志'
      : r.template_variant === 'EN_GUANZHI' ? 'EN 冠志'
      : r.template_variant === 'CN_GUOCAI' ? 'CN 国彩'
      : r.template_variant === 'EN_GUOCAI' ? 'EN 国彩'
      : (r.template_variant || 'CN 冠志');
    const statusBadge = (r.conflict_fields || 0) > 0 ? 'conflict' : ((r.unmatched_fields || 0) > 0 ? 'unmatched' : 'perfect');

    return {
      ...r,
      target_template: targetTemplate,
      review_ambiguous_fields: r.conflict_fields || 0,
      match_score: score,
      status_badge: statusBadge,
      annotation_count: r.annotations_count || 0,
    };
  });

  return {
    records,
    total: countResult?.total || 0,
    limit,
    offset,
  };
}

export function getRecordById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM msds_records WHERE id = ?');
  const record = stmt.get(id);
  if (!record) return null;

  try {
    record.rawFacts = JSON.parse(record.raw_facts_json || '{}');
  } catch {
    record.rawFacts = {};
  }
  try {
    record.matchResult = JSON.parse(record.match_result_json || '{}');
  } catch {
    record.matchResult = {};
  }
  try {
    record.annotations = JSON.parse(record.annotations_json || '[]');
  } catch {
    record.annotations = [];
  }

  return record;
}

export function deleteRecord(id) {
  const db = getDb();
  const docxFile = path.resolve(DOCS_DIR, `${id}.docx`);
  if (fs.existsSync(docxFile)) {
    try { fs.unlinkSync(docxFile); } catch {}
  }
  const stmt = db.prepare('DELETE FROM msds_records WHERE id = ?');
  stmt.run(id);
  return { success: true, id };
}

export function updateRecordMatch(id, matchResult, engineVersion = '1.3.0') {
  const db = getDb();
  const now = Date.now();
  const summary = matchResult.summary || {};
  const matched = summary.matchedFields || 0;
  const pruned = summary.prunedFields || 0;
  const conflicts = summary.reviewAmbiguousFields || 0;
  const unmatched = summary.unmatchedFields || 0;
  const status = conflicts > 0 ? 'HAS_CONFLICTS' : (unmatched > 0 ? 'HAS_UNMATCHED' : 'PERFECT');

  const serialized = serializeMatchResult(matchResult);

  const stmt = db.prepare(`
    UPDATE msds_records
    SET status = ?,
        matched_fields = ?,
        pruned_fields = ?,
        conflict_fields = ?,
        unmatched_fields = ?,
        engine_version = ?,
        match_result_json = ?,
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(status, matched, pruned, conflicts, unmatched, engineVersion, JSON.stringify(serialized), now, id);
  return { id, status, matched, pruned, conflicts, unmatched, updatedAt: now };
}

export function updateRecordAnnotations(id, annotations) {
  const db = getDb();
  const count = Array.isArray(annotations) ? annotations.length : 0;
  const stmt = db.prepare(`
    UPDATE msds_records
    SET annotations_count = ?,
        annotations_json = ?,
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(count, JSON.stringify(annotations || []), Date.now(), id);
  return { id, annotationsCount: count };
}

export function getRepoStats() {
  const db = getDb();
  const totalStmt = db.prepare('SELECT COUNT(*) AS count FROM msds_records');
  const perfectStmt = db.prepare('SELECT COUNT(*) AS count FROM msds_records WHERE conflict_fields = 0 AND unmatched_fields = 0');
  const conflictStmt = db.prepare('SELECT COUNT(*) AS count FROM msds_records WHERE conflict_fields > 0');
  const unmatchedStmt = db.prepare('SELECT COUNT(*) AS count FROM msds_records WHERE unmatched_fields > 0');
  const annotatedStmt = db.prepare('SELECT COUNT(*) AS count FROM msds_records WHERE annotations_count > 0');
  const batchStmt = db.prepare('SELECT COUNT(*) AS count FROM batches');

  return {
    totalRecords: totalStmt.get()?.count || 0,
    perfectCount: perfectStmt.get()?.count || 0,
    conflictCount: conflictStmt.get()?.count || 0,
    unmatchedCount: unmatchedStmt.get()?.count || 0,
    annotatedCount: annotatedStmt.get()?.count || 0,
    batchCount: batchStmt.get()?.count || 0,
  };
}
