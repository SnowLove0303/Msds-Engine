import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SYSTEM_DEFAULT_PRESETS } from './docx-engine.js';

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

    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      baseline_id TEXT DEFAULT 'baseline_cn_guanzhi',
      entity TEXT DEFAULT '国彩',
      language TEXT DEFAULT 'CN',
      target_template TEXT DEFAULT 'CN 国彩',
      is_builtin INTEGER DEFAULT 0,
      enabled_for_export INTEGER DEFAULT 1,
      header_footer_json TEXT DEFAULT '{}',
      field_overrides_json TEXT DEFAULT '{}',
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_presets_entity ON presets(entity);
    CREATE INDEX IF NOT EXISTS idx_presets_language ON presets(language);

    CREATE TABLE IF NOT EXISTS benchmark_category_specs (
      category_code TEXT PRIMARY KEY,
      category_name TEXT NOT NULL,
      applicable_patterns TEXT NOT NULL DEFAULT '[]',
      ppe_hand_specs_json TEXT NOT NULL DEFAULT '{}',
      waste_disposal_specs_json TEXT NOT NULL DEFAULT '{}',
      regulatory_specs_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL
    );

  `);

  try {
    db.exec("ALTER TABLE presets ADD COLUMN baseline_id TEXT DEFAULT 'baseline_cn_guanzhi';");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE presets ADD COLUMN entity_json TEXT DEFAULT '{}';");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE presets ADD COLUMN is_default INTEGER DEFAULT 0;");
  } catch {
    // column already exists
  }
  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_presets_baseline_id ON presets(baseline_id);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_presets_is_default ON presets(is_default);");
    db.exec("UPDATE presets SET baseline_id = 'baseline_en_guanzhi' WHERE id IN ('preset_guocai_en', 'preset_guanzhi_en') OR language = 'EN';");
  } catch {
    // ignore
  }
  try {
    db.exec("ALTER TABLE benchmark_category_specs ADD COLUMN applicable_patterns TEXT DEFAULT '[]';");
  } catch {}
  try {
    db.exec("ALTER TABLE benchmark_category_specs ADD COLUMN waste_disposal_specs_json TEXT DEFAULT '{}';");
  } catch {}
  seedDefaultPresets(db);
  seedBenchmarkCategorySpecs(db);
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
    engineVersion: matchRes.engineVersion || '1.6.0',
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
    record.engineVersion || '1.6.0',
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

export function updateRecordMatch(id, matchResult, engineVersion = '1.6.0') {
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

// ============================================================
// 预设库持久化管理 (Presets Database Management)
// ============================================================

export const BUILTIN_COMPANY_PRESETS = [
  {
    id: 'preset_guanzhi_cn',
    name: '广州冠志（中文官方标准）',
    baselineId: 'baseline_cn_guanzhi',
    entity: '冠志',
    language: 'CN',
    targetTemplate: 'CN 冠志',
    isBuiltin: true,
    isDefault: true,
    enabledForExport: true,
    entityData: {
      name_zh: '广州冠志新材料科技有限公司',
      name_en: 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
      shortName_zh: '冠志',
      shortName_en: 'Guanzhi',
      creditCode: '91440101MA59XXXXXX',
      address_zh: '广州市萝岗区科学城掬泉路3号广州国际企业孵化器A区1106室',
      address_en: 'Room 1106, Area A, Guangzhou International Enterprise Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou',
      tel: '86-20-82567990',
      fax: '86-20-32214789',
      emergencyTel_zh: '86-20-82567990 (24小时应急咨询)',
      emergencyTel_en: '86-20-82567990 (24h Emergency Contact)'
    },
    headerFooterOverrides: {
      company: '广州冠志新材料科技有限公司',
      title: '化学品安全技术说明书',
      version: 'V1.0',
      customFileNamePattern: '{model} msds_CN 冠志.docx',
    },
    fieldOverrides: {
      supplier_name: '广州冠志新材料科技有限公司',
      supplier_address: '广州市萝岗区科学城掬泉路3号广州国际企业孵化器A区1106室',
      emergency_phone: '86-20-82567990',
      phone: '86-20-82567990',
      fax: '86-20-32214789'
    }
  },
  {
    id: 'preset_guanzhi_en',
    name: '广州冠志（英文官方标准）',
    baselineId: 'baseline_en_guanzhi',
    entity: 'Guanzhi',
    language: 'EN',
    targetTemplate: 'EN Guanzhi',
    isBuiltin: true,
    isDefault: true,
    enabledForExport: true,
    entityData: {
      name_zh: '广州冠志新材料科技有限公司',
      name_en: 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
      shortName_zh: '冠志',
      shortName_en: 'Guanzhi',
      address_zh: '广州市萝岗区科学城掬泉路3号广州国际企业孵化器A区1106室',
      address_en: 'Room 1106, Area A, Guangzhou International Enterprise Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou',
      tel: '86-20-82567990',
      fax: '86-20-32214789',
      emergencyTel_zh: '86-20-82567990',
      emergencyTel_en: '86-20-82567990'
    },
    headerFooterOverrides: {
      company: 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
      title: 'SAFETY DATA SHEET',
      version: 'V1.0',
      customFileNamePattern: '{model} msds_EN Guanzhi.docx',
    },
    fieldOverrides: {
      supplier_name: 'Guangzhou Guanzhi New Material Technology Co., Ltd.',
      supplier_address: 'Room 1106, Area A, Guangzhou International Enterprise Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou',
      emergency_phone: '86-20-82567990',
      phone: '86-20-82567990',
      fax: '86-20-32214789'
    }
  },
  {
    id: 'preset_guocai_cn',
    name: '英德国彩（中文官方标准）',
    baselineId: 'baseline_cn_guanzhi',
    entity: '国彩',
    language: 'CN',
    targetTemplate: 'CN 国彩',
    isBuiltin: true,
    isDefault: false,
    enabledForExport: true,
    entityData: {
      name_zh: '英德市国彩精细化工有限公司',
      name_en: 'Yingde Guocai Fine Chemical Co., Ltd.',
      shortName_zh: '国彩',
      shortName_en: 'Guocai',
      address_zh: '广东省英德市白沙镇太平村更古坑凯迪工业园区',
      address_en: 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde City, Guangdong Province',
      tel: '86-763-2811205',
      fax: '86-763-2811024',
      emergencyTel_zh: '86-763-2811205',
      emergencyTel_en: '86-763-2811205'
    },
    headerFooterOverrides: {
      company: '英德市国彩精细化工有限公司',
      title: '物料安全数据表',
      version: 'V1.0',
      customFileNamePattern: '{model} msds_CN 国彩.docx',
    },
    fieldOverrides: {
      supplier_name: '英德市国彩精细化工有限公司',
      supplier_address: '广东省英德市白沙镇太平村更古坑凯迪工业园区',
      emergency_phone: '86-763-2811205',
      phone: '86-763-2811205',
      fax: '86-763-2811024',
      postal_code: '513038',
    }
  },
  {
    id: 'preset_guocai_en',
    name: '英德国彩（英文官方标准）',
    baselineId: 'baseline_en_guanzhi',
    entity: 'Guocai',
    language: 'EN',
    targetTemplate: 'EN Guocai',
    isBuiltin: true,
    isDefault: false,
    enabledForExport: true,
    entityData: {
      name_zh: '英德市国彩精细化工有限公司',
      name_en: 'Yingde Guocai Fine Chemical Co., Ltd.',
      shortName_zh: '国彩',
      shortName_en: 'Guocai',
      address_zh: '广东省英德市白沙镇太平村更古坑凯迪工业园区',
      address_en: 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde City, Guangdong Province',
      tel: '86-763-2811205',
      fax: '86-763-2811024',
      emergencyTel_zh: '86-763-2811205',
      emergencyTel_en: '86-763-2811205'
    },
    headerFooterOverrides: {
      company: 'Yingde Guocai Fine Chemical Co., Ltd.',
      title: 'SAFETY DATA SHEET',
      version: 'V1.0',
      customFileNamePattern: '{model} msds_EN Guocai.docx',
    },
    fieldOverrides: {
      supplier_name: 'Yingde Guocai Fine Chemical Co., Ltd.',
      supplier_address: 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde City, Guangdong Province',
      emergency_phone: '86-763-2811205',
      phone: '86-763-2811205',
      fax: '86-763-2811024',
      postal_code: '513038',
    }
  }
];

export function seedDefaultPresets(db = getDb()) {
  try {
    const insertStmt = db.prepare(`
      INSERT INTO presets (
        id, name, baseline_id, entity, language, target_template,
        is_builtin, is_default, enabled_for_export,
        entity_json, header_footer_json, field_overrides_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        entity_json = excluded.entity_json,
        header_footer_json = excluded.header_footer_json,
        field_overrides_json = excluded.field_overrides_json,
        is_builtin = excluded.is_builtin,
        is_default = CASE WHEN presets.is_default = 1 THEN 1 ELSE excluded.is_default END
    `);
    const now = Date.now();
    for (const p of BUILTIN_COMPANY_PRESETS) {
      insertStmt.run(
        p.id,
        p.name,
        p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi'),
        p.entity || '冠志',
        p.language || 'CN',
        p.targetTemplate || `${p.language} ${p.entity}`,
        p.isBuiltin ? 1 : 0,
        p.isDefault ? 1 : 0,
        p.enabledForExport ? 1 : 0,
        JSON.stringify(p.entityData || {}),
        JSON.stringify(p.headerFooterOverrides || {}),
        JSON.stringify(p.fieldOverrides || {}),
        now
      );
    }
    // 确保 CN 与 EN 各自至少有一个默认预设
    const cnDefault = db.prepare("SELECT id FROM presets WHERE language = 'CN' AND is_default = 1").get();
    if (!cnDefault) {
      db.prepare("UPDATE presets SET is_default = 1 WHERE id = 'preset_guanzhi_cn'").run();
    }
    const enDefault = db.prepare("SELECT id FROM presets WHERE language = 'EN' AND is_default = 1").get();
    if (!enDefault) {
      db.prepare("UPDATE presets SET is_default = 1 WHERE id = 'preset_guanzhi_en'").run();
    }
  } catch (e) {
    console.warn('seedDefaultPresets error:', e);
  }
}

export function listPresets({ baselineId, entity, language, enabledOnly, isDefault } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM presets WHERE 1=1';
  const params = [];

  if (baselineId && baselineId !== 'all') {
    sql += ' AND baseline_id = ?';
    params.push(baselineId);
  }

  if (entity && entity !== 'all') {
    sql += ' AND entity = ?';
    params.push(entity);
  }
  if (language && language !== 'all') {
    sql += ' AND language = ?';
    params.push(language.toUpperCase());
  }
  if (enabledOnly) {
    sql += ' AND enabled_for_export = 1';
  }
  if (isDefault != null) {
    sql += ' AND is_default = ?';
    params.push(isDefault ? 1 : 0);
  }
  sql += ' ORDER BY is_default DESC, is_builtin DESC, updated_at DESC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    baselineId: r.baseline_id || (r.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi'),
    entity: r.entity,
    language: r.language,
    targetTemplate: r.target_template,
    isBuiltin: Boolean(r.is_builtin),
    isDefault: Boolean(r.is_default),
    enabledForExport: Boolean(r.enabled_for_export),
    entityData: JSON.parse(r.entity_json || '{}'),
    headerFooterOverrides: JSON.parse(r.header_footer_json || '{}'),
    fieldOverrides: JSON.parse(r.field_overrides_json || '{}'),
    updatedAt: r.updated_at,
  }));
}

export function getPresetById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM presets WHERE id = ?');
  const r = stmt.get(id);
  if (!r) return null;

  return {
    id: r.id,
    name: r.name,
    baselineId: r.baseline_id || (r.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi'),
    entity: r.entity,
    language: r.language,
    targetTemplate: r.target_template,
    isBuiltin: Boolean(r.is_builtin),
    isDefault: Boolean(r.is_default),
    enabledForExport: Boolean(r.enabled_for_export),
    entityData: JSON.parse(r.entity_json || '{}'),
    headerFooterOverrides: JSON.parse(r.header_footer_json || '{}'),
    fieldOverrides: JSON.parse(r.field_overrides_json || '{}'),
    updatedAt: r.updated_at,
  };
}

export function getDefaultPreset(language = 'CN') {
  const db = getDb();
  const lang = (language || 'CN').toUpperCase();
  const stmt = db.prepare('SELECT * FROM presets WHERE is_default = 1 AND language = ?');
  let row = stmt.get(lang);
  if (!row) {
    row = db.prepare('SELECT * FROM presets WHERE language = ? ORDER BY is_builtin DESC, updated_at DESC LIMIT 1').get(lang);
  }
  return row ? getPresetById(row.id) : null;
}

export function setDefaultPreset(id) {
  const db = getDb();
  const target = getPresetById(id);
  if (!target) {
    throw new Error(`未找到 ID 为 ${id} 的预设`);
  }
  // 取消同语言其他预设的默认标记
  db.prepare('UPDATE presets SET is_default = 0 WHERE language = ?').run(target.language);
  // 设当前预设为默认
  db.prepare('UPDATE presets SET is_default = 1 WHERE id = ?').run(id);
  return getPresetById(id);
}

export function savePreset(data) {
  const db = getDb();
  const now = Date.now();
  const id = data.id || `preset_custom_${now}`;
  const name = data.name || '新建自定义预设';
  const baselineId = data.baselineId || (data.language === 'EN' || data.targetTemplate?.includes('EN') ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
  const entity = typeof data.entity === 'string' ? data.entity : (data.entityData?.shortName_zh || '自定义');
  const language = (data.language || 'CN').toUpperCase();
  const targetTemplate = data.targetTemplate || `${language} ${entity}`;
  const isBuiltin = data.isBuiltin ? 1 : 0;
  const isDefault = data.isDefault ? 1 : 0;
  const enabledForExport = data.enabledForExport !== false ? 1 : 0;
  
  const entityData = data.entityData || (typeof data.entity === 'object' ? data.entity : {});
  const entityJson = JSON.stringify(entityData);
  const hfJson = JSON.stringify(data.headerFooterOverrides || {});
  const fieldsJson = JSON.stringify(data.fieldOverrides || {});

  if (isDefault) {
    // 若设为默认，先清空同语言已有默认
    db.prepare('UPDATE presets SET is_default = 0 WHERE language = ?').run(language);
  }

  const stmt = db.prepare(`
    INSERT INTO presets (
      id, name, baseline_id, entity, language, target_template,
      is_builtin, is_default, enabled_for_export,
      entity_json, header_footer_json, field_overrides_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      baseline_id = excluded.baseline_id,
      entity = excluded.entity,
      language = excluded.language,
      target_template = excluded.target_template,
      is_default = excluded.is_default,
      enabled_for_export = excluded.enabled_for_export,
      entity_json = excluded.entity_json,
      header_footer_json = excluded.header_footer_json,
      field_overrides_json = excluded.field_overrides_json,
      updated_at = excluded.updated_at
  `);

  stmt.run(id, name, baselineId, entity, language, targetTemplate, isBuiltin, isDefault, enabledForExport, entityJson, hfJson, fieldsJson, now);
  return getPresetById(id);
}

export function deletePreset(id) {
  const db = getDb();
  const existing = getPresetById(id);
  if (!existing) {
    throw new Error(`未找到 ID 为 ${id} 的预设`);
  }
  if (existing.isBuiltin) {
    throw new Error('系统内置官方标准预设受只读保护，禁止删除');
  }

  const stmt = db.prepare('DELETE FROM presets WHERE id = ?');
  stmt.run(id);
  return { id, deleted: true };
}

export const DEFAULT_BENCHMARK_CATEGORY_SPECS = [
  {
    category_code: '02-1',
    category_name: '单组份水性丙烯酸乳液 PA',
    applicable_patterns: JSON.stringify(['02-1', 'PA-', '水性丙烯酸', '丙烯酸乳液']),
    ppe_hand_specs_json: JSON.stringify({
      standard: 'EN 374-3',
      fkm: '厚度≥0.4 mm；穿透时间≥480 min.',
      fkm_en: 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min.',
      iir: '厚度≥0.5 mm；穿透时间≥480 min.',
      iir_en: 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min.',
      nbr: '厚度≥0.35 mm；穿透时间≥480 min.',
      nbr_en: 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min.',
      recommendation: '及时更换受污染手套，脱手套后彻底洗手。',
      recommendation_en: 'Discard contaminated gloves and wash hands thoroughly.',
      engineering_controls_en: 'Provide adequate ventilation and local exhaust.'
    }),
    waste_disposal_specs_json: JSON.stringify({
      general_law_cn: '必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。',
      general_law_en: 'Dispose of in accordance with applicable national standards and national or local regulations.',
      ewc_en: 'Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
      methods_supplement_cn: '尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。严禁直接排放至废水中。',
      methods_supplement_en: 'Empty containers as completely as possible (e. g., by pouring, scraping, or draining until "drip-dry"). They may be sent to an appropriate collection point under existing chemical industry recycling schemes. Recycle containers in accordance with national regulations and applicable environmental requirements. Do not discharge waste via wastewater.'
    }),
    regulatory_specs_json: JSON.stringify({
      regulations_cn: [
        '《危险化学品安全管理条例》（国务院令第591号）',
        'GB/T 16483-2008《化学品安全技术说明书 内容和项目顺序》',
        'GB 13690-2009《化学品分类和危险性公示 通则》',
        'GB 30000系列《化学品分类和标签规范》'
      ],
      regulations_en: [
        'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.',
        'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections.',
        'GB 13690-2009 General rules for classification and hazard communication of chemicals.',
        'GB 30000.2-29 Rules for classification and labelling of chemicals.'
      ]
    })
  },
  {
    category_code: 'default',
    category_name: '通用化工水性树脂/乳液基准',
    applicable_patterns: JSON.stringify(['default', '水性树脂', '乳液']),
    ppe_hand_specs_json: JSON.stringify({
      standard: 'EN 374-3',
      fkm: '厚度≥0.4 mm；穿透时间≥480 min.',
      fkm_en: 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min.',
      iir: '厚度≥0.5 mm；穿透时间≥480 min.',
      iir_en: 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min.',
      nbr: '厚度≥0.35 mm；穿透时间≥480 min.',
      nbr_en: 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min.',
      recommendation: '及时更换受污染手套，脱手套后彻底洗手。',
      recommendation_en: 'Discard contaminated gloves and wash hands thoroughly.',
      engineering_controls_en: 'Provide adequate ventilation and local exhaust.'
    }),
    waste_disposal_specs_json: JSON.stringify({
      general_law_cn: '必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。',
      general_law_en: 'Dispose of in accordance with applicable national standards and national or local regulations.',
      ewc_en: 'Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
      methods_supplement_cn: '尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。严禁直接排放至废水中。',
      methods_supplement_en: 'Empty containers as completely as possible (e. g., by pouring, scraping, or draining until "drip-dry"). They may be sent to an appropriate collection point under existing chemical industry recycling schemes. Recycle containers in accordance with national regulations and applicable environmental requirements. Do not discharge waste via wastewater.'
    }),
    regulatory_specs_json: JSON.stringify({
      regulations_cn: [
        '《危险化学品安全管理条例》（国务院令第591号）',
        'GB/T 16483-2008《化学品安全技术说明书 内容和项目顺序》',
        'GB 13690-2009《化学品分类和危险性公示 通则》',
        'GB 30000系列《化学品分类和标签规范》'
      ],
      regulations_en: [
        'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.',
        'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections.',
        'GB 13690-2009 General rules for classification and hazard communication of chemicals.',
        'GB 30000.2-29 Rules for classification and labelling of chemicals.'
      ]
    })
  }
];

export function seedBenchmarkCategorySpecs(db = getDb()) {
  try {
    const insertStmt = db.prepare(`
      INSERT INTO benchmark_category_specs (
        category_code, category_name, applicable_patterns,
        ppe_hand_specs_json, waste_disposal_specs_json, regulatory_specs_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_code) DO UPDATE SET
        category_name = excluded.category_name,
        applicable_patterns = excluded.applicable_patterns,
        ppe_hand_specs_json = excluded.ppe_hand_specs_json,
        waste_disposal_specs_json = excluded.waste_disposal_specs_json,
        regulatory_specs_json = excluded.regulatory_specs_json,
        updated_at = excluded.updated_at
    `);
    const now = Date.now();
    for (const spec of DEFAULT_BENCHMARK_CATEGORY_SPECS) {
      insertStmt.run(
        spec.category_code,
        spec.category_name,
        spec.applicable_patterns,
        spec.ppe_hand_specs_json,
        spec.waste_disposal_specs_json,
        spec.regulatory_specs_json,
        now
      );
    }
  } catch (e) {
    console.warn('seedBenchmarkCategorySpecs error:', e);
  }
}

export function getBenchmarkSpecsByCategory(categoryCodeOrKeyword = 'default') {
  const db = getDb();
  let row = null;
  if (categoryCodeOrKeyword && categoryCodeOrKeyword !== 'default') {
    row = db.prepare('SELECT * FROM benchmark_category_specs WHERE category_code = ?').get(categoryCodeOrKeyword);
    if (!row) {
      const allRows = db.prepare('SELECT * FROM benchmark_category_specs').all();
      for (const r of allRows) {
        if (r.category_code === 'default') continue;
        if (r.category_name && categoryCodeOrKeyword.includes(r.category_name)) {
          row = r;
          break;
        }
        let patterns = [];
        try { patterns = JSON.parse(r.applicable_patterns || '[]'); } catch {}
        if (patterns.some(p => categoryCodeOrKeyword.toUpperCase().includes(p.toUpperCase()) || p.toUpperCase().includes(categoryCodeOrKeyword.toUpperCase()))) {
          row = r;
          break;
        }
      }
    }
  }
  if (!row) {
    row = db.prepare("SELECT * FROM benchmark_category_specs WHERE category_code = 'default'").get();
  }
  if (!row) return null;
  return {
    categoryCode: row.category_code,
    categoryName: row.category_name,
    applicablePatterns: JSON.parse(row.applicable_patterns || '[]'),
    ppeHandSpecs: JSON.parse(row.ppe_hand_specs_json || '{}'),
    wasteDisposalSpecs: JSON.parse(row.waste_disposal_specs_json || '{}'),
    regulatorySpecs: JSON.parse(row.regulatory_specs_json || '{}'),
    updatedAt: row.updated_at
  };
}
