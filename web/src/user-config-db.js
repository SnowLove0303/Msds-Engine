import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = path.resolve(__dirname, '../data');
const DEFAULT_DB_PATH = process.env.MSDS_USER_CONFIG_DB_PATH || path.resolve(DEFAULT_DATA_DIR, 'user_config.db');

const dbInstances = new Map();

export function getUserConfigDb(customDbPath = null) {
  const dbPath = path.resolve(customDbPath || DEFAULT_DB_PATH);
  if (dbInstances.has(dbPath)) return dbInstances.get(dbPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  initUserConfigSchema(db);
  dbInstances.set(dbPath, db);
  return db;
}

export function closeUserConfigDb(customDbPath = null) {
  const dbPath = path.resolve(customDbPath || DEFAULT_DB_PATH);
  const db = dbInstances.get(dbPath);
  if (db) {
    try { db.close(); } catch {}
    dbInstances.delete(dbPath);
  }
}

export function initUserConfigSchema(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS user_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      language TEXT DEFAULT 'zh',
      file_name TEXT NOT NULL,
      sha256 TEXT DEFAULT '',
      docx_blob BLOB,
      topology_json TEXT DEFAULT '{}',
      completeness_ok INTEGER DEFAULT 0,
      sections_count INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_utpl_default ON user_templates(is_default, updated_at DESC);

    CREATE TABLE IF NOT EXISTS user_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      entity TEXT DEFAULT '',
      language TEXT DEFAULT 'zh',
      target_template_id TEXT DEFAULT '',
      header_footer_json TEXT DEFAULT '{}',
      field_overrides_json TEXT DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_upreset_enabled ON user_presets(enabled, is_default, updated_at DESC);

    CREATE TABLE IF NOT EXISTS user_naming_patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pattern TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const npCount = db.prepare('SELECT COUNT(*) AS cnt FROM user_naming_patterns').get();
  if (!npCount || npCount.cnt === 0) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO user_naming_patterns (id, name, pattern, description, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run('default_standard', '通用标准命名', '{docId}_{lang}_{preset}', '通用占位符: {docId}, {lang}, {preset}, {date}', now, now);
  }
}

// =========================================================================
// 1. User Templates (含 9 层 MsdsEngineStandardTopology 持久化缓存)
// =========================================================================

function mapTemplateRow(r, includeBlob = false) {
  if (!r) return null;
  let topology = null;
  try { topology = JSON.parse(r.topology_json || '{}'); } catch { topology = null; }
  const out = {
    id: r.id,
    name: r.name,
    language: r.language || 'zh',
    fileName: r.file_name,
    sha256: r.sha256 || '',
    topology,
    completenessOk: Boolean(r.completeness_ok),
    sectionsCount: Number(r.sections_count || 0),
    isDefault: Boolean(r.is_default),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
  if (includeBlob && r.docx_blob) {
    out.docxBuffer = Buffer.from(r.docx_blob);
  }
  return out;
}

export function saveUserTemplate({
  id = null,
  name,
  language = 'zh',
  fileName,
  docxBuffer = null,
  topology = null,
  isDefault = false
} = {}, customDbPath = null) {
  if (!name || !fileName) throw new Error('模板 name 和 fileName 不能为空');
  const db = getUserConfigDb(customDbPath);
  const now = Date.now();
  const targetId = id || `tpl_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const buf = docxBuffer ? (Buffer.isBuffer(docxBuffer) ? docxBuffer : Buffer.from(docxBuffer)) : null;
  const sha256 = buf ? crypto.createHash('sha256').update(buf).digest('hex') : (topology?.sourceSha256 || '');
  const completenessOk = topology?.completenessCheck?.ok ? 1 : 0;
  const sectionsCount = Number(topology?.sectionsCount || topology?.sections?.length || 0);
  const topologyJson = JSON.stringify(topology || {});

  if (isDefault) db.prepare('UPDATE user_templates SET is_default = 0').run();
  const existing = db.prepare('SELECT id FROM user_templates WHERE id = ?').get(targetId);
  if (existing) {
    db.prepare(`
      UPDATE user_templates
      SET name = ?, language = ?, file_name = ?, sha256 = ?, docx_blob = COALESCE(?, docx_blob),
          topology_json = ?, completeness_ok = ?, sections_count = ?, is_default = ?, updated_at = ?
      WHERE id = ?
    `).run(name, language, fileName, sha256, buf, topologyJson, completenessOk, sectionsCount, isDefault ? 1 : 0, now, targetId);
  } else {
    db.prepare(`
      INSERT INTO user_templates (id, name, language, file_name, sha256, docx_blob, topology_json, completeness_ok, sections_count, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetId, name, language, fileName, sha256, buf, topologyJson, completenessOk, sectionsCount, isDefault ? 1 : 0, now, now);
  }
  return getUserTemplateById(targetId, { includeBlob: false }, customDbPath);
}

export function listUserTemplates({ language = null, includeTopology = false } = {}, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  const rows = language
    ? db.prepare('SELECT * FROM user_templates WHERE language = ? ORDER BY is_default DESC, updated_at DESC').all(language)
    : db.prepare('SELECT * FROM user_templates ORDER BY is_default DESC, updated_at DESC').all();
  return rows.map((r) => {
    const mapped = mapTemplateRow(r, false);
    if (!includeTopology) delete mapped.topology;
    return mapped;
  });
}

export function getUserTemplateById(id, { includeBlob = false } = {}, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  const r = db.prepare('SELECT * FROM user_templates WHERE id = ?').get(id);
  return mapTemplateRow(r, includeBlob);
}

export function getDefaultUserTemplate(language = null, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  const r = language
    ? db.prepare('SELECT * FROM user_templates WHERE language = ? ORDER BY is_default DESC, updated_at DESC LIMIT 1').get(language)
    : db.prepare('SELECT * FROM user_templates ORDER BY is_default DESC, updated_at DESC LIMIT 1').get();
  return mapTemplateRow(r, false);
}

export function setDefaultUserTemplate(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  if (!db.prepare('SELECT id FROM user_templates WHERE id = ?').get(id)) {
    throw new Error(`未找到用户模板: ${id}`);
  }
  db.prepare('UPDATE user_templates SET is_default = 0').run();
  db.prepare('UPDATE user_templates SET is_default = 1, updated_at = ? WHERE id = ?').run(Date.now(), id);
  return getUserTemplateById(id, { includeBlob: false }, customDbPath);
}

export function deleteUserTemplate(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  db.prepare('DELETE FROM user_templates WHERE id = ?').run(id);
  return { deleted: true, id };
}

// =========================================================================
// 2. User Presets (零硬编码用户主体/内容预设)
// =========================================================================

function mapPresetRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    entity: r.entity || '',
    language: r.language || 'zh',
    targetTemplateId: r.target_template_id || '',
    headerFooter: JSON.parse(r.header_footer_json || '{}'),
    fieldOverrides: JSON.parse(r.field_overrides_json || '{}'),
    enabled: Boolean(r.enabled),
    isDefault: Boolean(r.is_default),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export function saveUserPreset({
  id = null,
  name,
  entity = '',
  language = 'zh',
  targetTemplateId = '',
  headerFooter = {},
  fieldOverrides = {},
  enabled = true,
  isDefault = false
} = {}, customDbPath = null) {
  if (!name) throw new Error('预设 name 不能为空');
  const db = getUserConfigDb(customDbPath);
  const now = Date.now();
  const targetId = id || `up_${now}_${Math.random().toString(36).slice(2, 6)}`;
  if (isDefault) db.prepare('UPDATE user_presets SET is_default = 0').run();
  const existing = db.prepare('SELECT id FROM user_presets WHERE id = ?').get(targetId);
  if (existing) {
    db.prepare(`
      UPDATE user_presets
      SET name = ?, entity = ?, language = ?, target_template_id = ?, header_footer_json = ?, field_overrides_json = ?, enabled = ?, is_default = ?, updated_at = ?
      WHERE id = ?
    `).run(name, entity, language, targetTemplateId, JSON.stringify(headerFooter || {}), JSON.stringify(fieldOverrides || {}), enabled ? 1 : 0, isDefault ? 1 : 0, now, targetId);
  } else {
    db.prepare(`
      INSERT INTO user_presets (id, name, entity, language, target_template_id, header_footer_json, field_overrides_json, enabled, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetId, name, entity, language, targetTemplateId, JSON.stringify(headerFooter || {}), JSON.stringify(fieldOverrides || {}), enabled ? 1 : 0, isDefault ? 1 : 0, now, now);
  }
  return getUserPresetById(targetId, customDbPath);
}

export function listUserPresets({ enabledOnly = false, language = null } = {}, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  let sql = 'SELECT * FROM user_presets WHERE 1=1';
  const params = [];
  if (enabledOnly) { sql += ' AND enabled = 1'; }
  if (language) { sql += ' AND language = ?'; params.push(language); }
  sql += ' ORDER BY is_default DESC, updated_at DESC';
  return db.prepare(sql).all(...params).map(mapPresetRow);
}

export function getUserPresetById(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  return mapPresetRow(db.prepare('SELECT * FROM user_presets WHERE id = ?').get(id));
}

export function setDefaultUserPreset(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  if (!db.prepare('SELECT id FROM user_presets WHERE id = ?').get(id)) {
    throw new Error(`未找到用户预设: ${id}`);
  }
  db.prepare('UPDATE user_presets SET is_default = 0').run();
  db.prepare('UPDATE user_presets SET is_default = 1, updated_at = ? WHERE id = ?').run(Date.now(), id);
  return getUserPresetById(id, customDbPath);
}

export function deleteUserPreset(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  db.prepare('DELETE FROM user_presets WHERE id = ?').run(id);
  return { deleted: true, id };
}

// =========================================================================
// 3. User Naming Patterns (可复用产出物命名格式)
// =========================================================================

function mapNamingRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    pattern: r.pattern,
    description: r.description || '',
    isDefault: Boolean(r.is_default),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export function listUserNamingPatterns(customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  return db.prepare('SELECT * FROM user_naming_patterns ORDER BY is_default DESC, updated_at DESC').all().map(mapNamingRow);
}

export function getUserNamingPatternById(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  return mapNamingRow(db.prepare('SELECT * FROM user_naming_patterns WHERE id = ?').get(id));
}

export function saveUserNamingPattern({ id = null, name, pattern, description = '', isDefault = false } = {}, customDbPath = null) {
  if (!name || !pattern) throw new Error('命名格式预设的 name 和 pattern 不能为空');
  const db = getUserConfigDb(customDbPath);
  const now = Date.now();
  const targetId = id || `unp_${now}_${Math.random().toString(36).slice(2, 6)}`;
  if (isDefault) db.prepare('UPDATE user_naming_patterns SET is_default = 0').run();
  const existing = db.prepare('SELECT id FROM user_naming_patterns WHERE id = ?').get(targetId);
  if (existing) {
    db.prepare(`
      UPDATE user_naming_patterns SET name = ?, pattern = ?, description = ?, is_default = ?, updated_at = ?
      WHERE id = ?
    `).run(String(name), String(pattern), String(description || ''), isDefault ? 1 : 0, now, targetId);
  } else {
    db.prepare(`
      INSERT INTO user_naming_patterns (id, name, pattern, description, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(targetId, String(name), String(pattern), String(description || ''), isDefault ? 1 : 0, now, now);
  }
  return getUserNamingPatternById(targetId, customDbPath);
}

export function setDefaultUserNamingPattern(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  if (!db.prepare('SELECT id FROM user_naming_patterns WHERE id = ?').get(id)) {
    throw new Error(`未找到命名格式预设: ${id}`);
  }
  db.prepare('UPDATE user_naming_patterns SET is_default = 0').run();
  db.prepare('UPDATE user_naming_patterns SET is_default = 1, updated_at = ? WHERE id = ?').run(Date.now(), id);
  return getUserNamingPatternById(id, customDbPath);
}

export function deleteUserNamingPattern(id, customDbPath = null) {
  const db = getUserConfigDb(customDbPath);
  if (id === 'default_standard') throw new Error('系统通用默认命名预设不可删除');
  db.prepare('DELETE FROM user_naming_patterns WHERE id = ?').run(id);
  return { deleted: true, id };
}
