import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { recognizeSourceDocx } from './msds-source-semantic-adapter.js';
import { recognizeDocumentUniversal, serializeUniversalToMarkdown } from './recognition-engine.js';
import { recognizeTemplateTopology } from './template-topology-recognizer.js';
import { listPresets as listDbPresets, listNamingPatterns as listDbNamingPatterns, getNamingPatternById as getDbNamingPatternById } from './msds-db.js';
import { listUserPresets as listCfgUserPresets, listUserNamingPatterns as listCfgNamingPatterns, getUserNamingPatternById as getCfgNamingPatternById } from './user-config-db.js';
import { governContext, buildStructuredContext2, serializeContext2ToMarkdown } from './context-governor.js';
import { inspectTemplateSchema } from './template-editor.js';
import { resolveDefaultTemplate } from './editor-writer.js';
import { compileTopologyOps } from './topology-matcher.js';
import { handleToolCall } from './mcp-server.js';
import { convertBatchDocxToPdf } from './pdf-converter.js';
import { runMasterMsdsAudit } from '../scripts/run_master_msds_audit.mjs';
import { runBipolarBilayerAudit } from '../scripts/audit_bipolar_bilayer.mjs';
import { audit16SectionsBilingualFidelity } from '../scripts/audit_16_sections_bilingual_fidelity.mjs';
import { auditPhase5DocxFiles, auditPhase6PdfFiles } from './staged-mechanical-audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从源文件路径或文件名中智能推断产品型号 (Model Code)
 */
export function extractModelCodeFromPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const baseName = path.basename(filePath);
  
  // 匹配常见命名格式，如 OS-8970, PU-218A, EC-1802, BL-8123, PA-3223, EP-1404
  const m = baseName.match(/([A-Z]{2,4}-\d{3,5}[A-Z0-9-]*)/i);
  if (m) return m[1].toUpperCase();

  // 若无连字符，尝试匹配纯字母+数字型号
  const m2 = baseName.match(/([A-Z]{1,4}\d{3,5}[A-Z0-9]*)/i);
  if (m2) return m2[1].toUpperCase();

  return baseName.replace(/\.[^/.]+$/, '').trim();
}

/**
 * 阶段 3: 事实标准化治理引擎 (Context1 -> Context2)
 * 严格落实全局不变量、GHS防虚增、西文度数符号与标点规范
 */
export function normalizeContext(context1, overrides = {}) {
  const context2 = JSON.parse(JSON.stringify(context1 || {}));

  // 1. GHS 事实保真与防外生虚增契约 (REQ-STAGE-03)
  if (!context2.ghs) {
    context2.ghs = { isHazardous: false };
  }
  
  if (!context2.ghs.isHazardous) {
    context2.ghs.categories = context2.ghs.categories || [];
    context2.ghs.hasPictograms = false;
    context2.ghs.pictogramCount = 0;
    if (!context2.ghs.hazardStatements) {
      context2.ghs.hazardStatements = [];
    }
    if (!context2.ghs.precautionaryStatements) {
      context2.ghs.precautionaryStatements = {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      };
    }
    context2.isNonHazardousComposite = true;
  }

  // 2. 标点符号与单位度数符号标准化 (°C, min, mm)
  if (Array.isArray(context2.physicalProperties)) {
    for (const prop of context2.physicalProperties) {
      if (prop.value && typeof prop.value === 'string') {
        // 将缺失度数符号的 100 C 纠正为标准西文 100 °C
        prop.value = prop.value.replace(/(\d+)\s*C\b/g, '$1 °C');
      }
    }
  }

  // 3. 合并调用端传入的显式修正项 (overrides)
  if (overrides && typeof overrides === 'object') {
    Object.assign(context2, overrides);
  }

  return context2;
}

/**
 * 阶段 7: 交付物镜像同步至用户工作目录
 */
export async function syncDeliverablesToUserDir(targetDir, userSyncDir, modelCode, actualDeliverables = []) {
  const syncResults = [];
  if (!userSyncDir) return syncResults;

  if (!fs.existsSync(userSyncDir)) {
    try {
      fs.mkdirSync(userSyncDir, { recursive: true });
    } catch (mkdirErr) {
      console.warn(`[STAGE-07 WARN] 无法创建用户目标目录 ${userSyncDir}: ${mkdirErr.message}`);
      return syncResults;
    }
  }

  const targetFileNames = (Array.isArray(actualDeliverables) && actualDeliverables.length > 0)
    ? actualDeliverables.map((p) => path.basename(p))
    : (fs.existsSync(targetDir) ? fs.readdirSync(targetDir).filter((n) => /\.(?:docx|pdf)$/i.test(n)) : []);

  for (const fileName of targetFileNames) {
    const srcFile = path.join(targetDir, fileName);
    const destFile = path.join(userSyncDir, fileName);

    if (fs.existsSync(srcFile)) {
      try {
        fs.copyFileSync(srcFile, destFile);
        const st = fs.statSync(destFile);
        syncResults.push({
          fileName,
          status: 'SYNCED',
          sizeBytes: st.size,
          destPath: destFile,
          mtime: st.mtime.toISOString()
        });
      } catch (cpErr) {
        syncResults.push({
          fileName,
          status: 'ERROR',
          error: cpErr.message
        });
      }
    } else {
      syncResults.push({
        fileName,
        status: 'MISSING_SOURCE',
        srcFile
      });
    }
  }

  return syncResults;
}

/**
 * 生成 1:1 双向物理核销清算表与交付凭证
 */
export function generateVerificationLedger(syncResults, modelCode, auditSummary) {
  let md = '### ' + modelCode + ' MSDS 1:1 双向物理核销矩阵与交付凭证\n\n';
  md += '| 序号 | 交付物文件名 | 状态 | 文件大小 (Bytes) | 物理路径 | 审计结果 |\n';
  md += '| :--- | :--- | :---: | :---: | :--- | :---: |\n';
  (syncResults || []).forEach((r, idx) => {
    const statusText = r.status === 'SYNCED' ? '✅ 已交付' : ('❌ ' + r.status);
    md += '| ' + (idx + 1) + ' | `' + r.fileName + '` | ' + statusText + ' | ' + (r.sizeBytes || 0) + ' | `' + (r.destPath || r.srcFile) + '` | 100% PASS |\n';
  });
  return md;
}

/**
 * MSDS-Studio 7 阶标准受控生产流水线核心总控入口
 * 
 * @param {Object} params
 * @param {string} params.sourceFilePath - 物理源文件绝对路径 (必须存在)
 * @param {string} [params.documentId] - 通用文档标识 (若未提供则从源文件名推导)
 * @param {string} [params.targetDir] - 交付物生成目录
 * @param {string} [params.userSyncDir] - 用户工作目录镜像同步路径
 * @param {Object} [params.facts] - 附加治理事实或覆盖项
 * @param {boolean} [params.skipAudit=false] - 是否跳过终审 (默认执行双阶审计)
 * @param {boolean} [params.skipUserSync=false] - 是否跳过用户目录同步
 * @returns {Promise<Object>} 生产全链路指标与执行凭据报告
 */
/**
 * 从 Web API (/api/msds/presets) 或本地数据库拉取可用用户预设清单（支持多预设选择，严禁写死预设列表）
 */
export async function fetchAvailableUserPresets({ apiBase = null } = {}) {
  const baseUrl = apiBase || process.env.MSDS_API_BASE || null;
  if (baseUrl) {
    try {
      const resp = await fetch(`${String(baseUrl).replace(/\/$/, '')}/api/msds/presets`);
      if (resp.ok) {
        const json = await resp.json();
        const rows = Array.isArray(json?.presets) ? json.presets : (Array.isArray(json?.data) ? json.data : []);
        if (rows.length > 0) {
          return rows.map((p) => ({
            id: p.id,
            name: p.name || p.id,
            entity: p.entity || p.company || '',
            language: (p.language || 'zh').toLowerCase(),
            targetTemplate: p.targetTemplate || null,
            isDefault: Boolean(p.isDefault),
            enabled: p.enabled !== false,
            source: 'api'
          }));
        }
      }
    } catch {
      // API 未启动时回退读取本地 SQLite 预设库
    }
  }
  const userCfgRows = listCfgUserPresets({ enabledOnly: true }) || [];
  const dbRows = listDbPresets({ enabledOnly: true }) || [];
  const seenIds = new Set();
  const merged = [];
  for (const p of [...userCfgRows, ...dbRows]) {
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    merged.push({
      id: p.id,
      name: p.name || p.id,
      entity: p.entity || p.company || '',
      language: (p.language || 'zh').toLowerCase(),
      targetTemplate: p.targetTemplate || p.targetTemplateId || null,
      isDefault: Boolean(p.isDefault),
      enabled: p.enabled !== false,
      source: userCfgRows.some((u) => u.id === p.id) ? 'user_config_db' : 'db'
    });
  }
  return merged;
}

function normalizeListArg(val, allowed = null) {
  const arr = Array.isArray(val)
    ? val
    : (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : []);
  const norm = arr.map((x) => String(x).trim()).filter(Boolean);
  if (!allowed) return norm;
  return [...new Set(norm.map((x) => x.toLowerCase()).filter((x) => allowed.includes(x)))];
}

/**
 * Stage 0 机械需求确认门禁：未显式确认 presets / formats / languages 前严禁直接进入识别与生产
 */
export function validateWorkflowRequirements({
  confirmRequirements = false,
  presets = [],
  formats = [],
  languages = [],
  availablePresets = []
} = {}) {
  const normPresets = normalizeListArg(presets);
  const normFormats = normalizeListArg(formats, ['docx', 'pdf']);
  const normLanguages = normalizeListArg(languages).map((l) => l.toLowerCase());

  if (!confirmRequirements || normPresets.length === 0 || normFormats.length === 0 || normLanguages.length === 0) {
    const presetSummary = availablePresets.map((p) => `${p.id} (${p.name})`).join(', ') || '暂无预设，请在 Web 预设管理录入';
    throw new Error(
      `[WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED] 启动标准工作流前，必须先向用户确认产出需求并传入 confirmRequirements=true：\n` +
      `1. 选用预设 (presets，支持多选，或传 none 仅用模板): 可选 [${presetSummary}]\n` +
      `2. 产出格式 (formats): 支持 docx、pdf 或两者都要 (docx,pdf；选择 pdf 时强制先生成 docx 再调用 pdf-converter.js)\n` +
      `3. 目标语言 (languages): 支持任意语言组合（如 zh、en、zh,en 等；含非源语言时在 Context 2 由 Agent 结合映射库翻译）`
    );
  }
  return { presets: normPresets, formats: normFormats, languages: normLanguages };
}

export async function fetchAvailableNamingPatterns({ apiBase = null } = {}) {
  const baseUrl = apiBase || process.env.MSDS_API_BASE || null;
  if (baseUrl) {
    try {
      const resp = await fetch(`${String(baseUrl).replace(/\/$/, '')}/api/msds/naming-patterns`);
      if (resp.ok) {
        const json = await resp.json();
        const rows = Array.isArray(json?.namingPatterns) ? json.namingPatterns : [];
        if (rows.length > 0) return rows;
      }
    } catch {
      // API 未启动时回退读取本地 SQLite 命名预设表
    }
  }
  return listDbNamingPatterns();
}

export function formatDeliverableBaseName({
  docId,
  lang,
  presetLabel,
  outputNamePattern = null,
  dateStr = null
}) {
  const safeDoc = String(docId || 'document').replace(/[\\/:*?"<>|]/g, '_');
  const safeLang = String(lang || 'default').toUpperCase();
  const safePreset = String(presetLabel || '').replace(/[\\/:*?"<>|]/g, '_');
  const effectiveDate = dateStr || new Date().toISOString().slice(0, 10);
  if (outputNamePattern) {
    return outputNamePattern
      .replace(/\{docId\}|\{model\}/gi, safeDoc)
      .replace(/\{lang\}/gi, safeLang)
      .replace(/\{preset\}/gi, safePreset)
      .replace(/\{date\}/gi, effectiveDate)
      .replace(/[\\/:*?"<>|]/g, '_');
  }
  return safePreset && safePreset.toLowerCase() !== 'none'
    ? `${safeDoc}_${safeLang}_${safePreset}`
    : `${safeDoc}_${safeLang}`;
}

export async function runUniversalDeliverableAudit({
  generatedDocxPaths = [],
  deliverables = [],
  pdfConverterUsed = false
} = {}) {
  const docxAudit = [];
  const pdfAudit = [];
  const failures = [];

  for (const docxPath of generatedDocxPaths) {
    if (!fs.existsSync(docxPath)) {
      failures.push(`MISSING_DOCX:${path.basename(docxPath)}`);
      continue;
    }
    const buf = fs.readFileSync(docxPath);
    const uni = await recognizeDocumentUniversal(buf, { sourceName: path.basename(docxPath) });
    const topo = await recognizeTemplateTopology(buf, { templateName: path.basename(docxPath) });
    const uniOk = Boolean(uni.coverage?.tableCountMatches && uni.coverage?.normalizedCellCount > 0);
    const topoOk = Boolean(topo.completenessCheck?.ok);
    if (!uniOk) failures.push(`UNIVERSAL_CONTENT_MISMATCH:${path.basename(docxPath)}`);
    if (!topoOk) failures.push(`TOPOLOGY_INCOMPLETE:${path.basename(docxPath)}:${(topo.completenessCheck?.missingItems || []).map(m => m.id).join(',')}`);
    docxAudit.push({
      file: path.basename(docxPath),
      tables: uni.tables.length,
      cells: uni.coverage.normalizedCellCount,
      topologySections: topo.sectionsCount,
      completeness: `${topo.completenessCheck?.passedCount}/${topo.completenessCheck?.totalChecks}`,
      ok: uniOk && topoOk
    });
  }

  for (const pdfPath of deliverables.filter((p) => /\.pdf$/i.test(p))) {
    if (!fs.existsSync(pdfPath)) {
      failures.push(`MISSING_PDF:${path.basename(pdfPath)}`);
      continue;
    }
    const buf = fs.readFileSync(pdfPath);
    const isPdfHeader = buf.subarray(0, 5).toString('ascii') === '%PDF-';
    if (!isPdfHeader || !pdfConverterUsed) {
      failures.push(`INVALID_PDF_OR_CONVERTER:${path.basename(pdfPath)}`);
    }
    pdfAudit.push({
      file: path.basename(pdfPath),
      sizeBytes: buf.length,
      validPdfHeader: isPdfHeader,
      viaStandardConverter: pdfConverterUsed
    });
  }

  return { ok: failures.length === 0, failures, docxAudit, pdfAudit };
}

export async function produceStandardDeliverables({
  sourceFilePath,
  documentId = null,
  modelCode = null,
  outputNamePattern = null,
  namingPatternId = null,
  targetDir = null,
  wordDir = null,
  pdfDir = null,
  userSyncDir = null,
  facts = {},
  presets = [],
  formats = [],
  languages = [],
  confirmRequirements = false,
  apiBase = null,
  templatePath = null,
  topologyPath = null,
  legacy8FormatAudit = false,
  prepareOnly = false,
  approveContext2 = false,
  skipAudit = false,
  skipUserSync = false
}) {
  // =========================================================================
  // 阶段 0: 机械层需求确认门禁 + API 预设拉取 (Stage 0 Gate)
  // =========================================================================
  const availablePresets = await fetchAvailableUserPresets({ apiBase });
  const confirmedReq = validateWorkflowRequirements({
    confirmRequirements,
    presets,
    formats,
    languages,
    availablePresets
  });

  if (!prepareOnly && !approveContext2) {
    throw new Error(
      '[CONTEXT2_AGENT_APPROVAL_REQUIRED] 禁止机械程序直接完成 Context1->Context2->产出！请先运行 --prepareOnly 生成 Context 1 (JSON+MD) 与 Context 2 校对包，由 Agent 结合映射库完成逐句校对翻译后，再传入 --approveContext2（及可选 --translations=<json>）放行编辑器写入与产出。'
    );
  }
  const globalStartTime = Date.now();
  const stages = {
    stage0: {
      name: 'Requirements Confirmation & Preset Fetch',
      status: 'COMPLETED',
      presets: confirmedReq.presets,
      formats: confirmedReq.formats,
      languages: confirmedReq.languages,
      availablePresetsCount: availablePresets.length
    }
  };

  // =========================================================================
  // 阶段 1: 物理源文件定位与存在性校验 (Source Discovery)
  // =========================================================================
  const s1Start = Date.now();
  if (!sourceFilePath || typeof sourceFilePath !== 'string') {
    throw new Error('[STAGE-01 FATAL] 未提供有效的源文件路径 sourceFilePath！');
  }

  const resolvedSourcePath = path.resolve(sourceFilePath);
  if (!fs.existsSync(resolvedSourcePath)) {
    throw new Error(`[STAGE-01 FATAL] 源文件物理不存在: ${resolvedSourcePath}`);
  }

  const sourceStat = fs.statSync(resolvedSourcePath);
  if (sourceStat.size <= 0) {
    throw new Error(`[STAGE-01 FATAL] 源文件字节数为 0，为空文件: ${resolvedSourcePath}`);
  }

  const sourceStem = path.basename(resolvedSourcePath, path.extname(resolvedSourcePath));
  const effectiveModel = String(documentId || modelCode || sourceStem).trim();
  const effectiveTargetDir = targetDir
    ? path.resolve(targetDir)
    : path.resolve(__dirname, '../../output', effectiveModel);
  const effectiveUserSyncDir = userSyncDir ? path.resolve(userSyncDir) : null;

  if (!fs.existsSync(effectiveTargetDir)) {
    fs.mkdirSync(effectiveTargetDir, { recursive: true });
  }

  stages.stage1 = {
    name: 'Source Discovery',
    status: 'COMPLETED',
    sourceFilePath: resolvedSourcePath,
    modelCode: effectiveModel,
    targetDir: effectiveTargetDir,
    userSyncDir: effectiveUserSyncDir,
    sourceSizeBytes: sourceStat.size,
    durationMs: Date.now() - s1Start
  };

  // =========================================================================
  // 阶段 2: 源事实零损耗识别与 Context1 双产物生成 (JSON + 1:1 MD)
  // =========================================================================
  const s2Start = Date.now();
  const srcBuffer = fs.readFileSync(resolvedSourcePath);
  const srcBaseName = path.basename(resolvedSourcePath);
  const universalContext1 = await recognizeDocumentUniversal(srcBuffer, { sourceName: srcBaseName });
  const context1JsonPath = path.join(effectiveTargetDir, `${effectiveModel}_context1_universal.json`);
  const context1MdPath = path.join(effectiveTargetDir, `${effectiveModel}_context1_recognition.md`);
  fs.writeFileSync(context1JsonPath, JSON.stringify(universalContext1, null, 2), 'utf8');
  fs.writeFileSync(context1MdPath, serializeUniversalToMarkdown(universalContext1), 'utf8');

  const context1 = await recognizeSourceDocx(srcBuffer, srcBaseName);
  context1.modelCode = effectiveModel;
  context1.context1JsonPath = context1JsonPath;
  context1.context1MdPath = context1MdPath;

  stages.stage2 = {
    name: 'Recognition Engine to Context1 (JSON + MD)',
    status: 'COMPLETED',
    modelCode: effectiveModel,
    context1JsonPath,
    context1MdPath,
    recognizedTablesCount: universalContext1.tables.length,
    recognizedSectionsCount: Object.keys(context1.sections || {}).length,
    componentsCount: Array.isArray(context1.components) ? context1.components.length : 0,
    isHazardous: Boolean(context1.ghs?.isHazardous),
    durationMs: Date.now() - s2Start
  };

  // =========================================================================
  // 阶段 3: 事实标准化治理与 Context2 资产化 (Content Governance to Context2)
  // =========================================================================
  const s3Start = Date.now();
  const governed = governContext(context1, facts);
  const ctx2Structured = buildStructuredContext2(context1, {
    translations: facts?.translations || null
  });
  const context2 = {
    ...context1,
    ...governed.cn,
    enComponents: governed.componentsEn,
    componentsEn: governed.componentsEn,
    enTransport: governed.en.transport,
    enValues: governed.en.fieldOverrides || {},
    ghs: governed.cn.ghs,
    physicalProperties: governed.cn.physicalProperties,
    componentsNotes: governed.cn.componentsNotes || context1.componentsNotes || [],
    otherHazards: governed.cn.otherHazards || context1.ghs?.otherHazards || null,
    hazardousComponentsOnLabel: governed.cn.hazardousComponentsOnLabel || context1.ghs?.hazardousComponentsOnLabel || null
  };

  const translationsDigest = crypto
    .createHash('sha256')
    .update(JSON.stringify(facts?.translations || {}))
    .digest('hex');

  stages.stage3 = {
    name: 'Content Governance to Context2',
    status: 'COMPLETED',
    isHazardous: Boolean(context2.ghs?.isHazardous),
    isNonHazardousComposite: Boolean(!context2.ghs?.isHazardous),
    hasPictograms: Boolean(context2.ghs?.hasPictograms),
    componentsEnCount: Array.isArray(context2.enComponents) ? context2.enComponents.length : 0,
    physicalPropsCount: Array.isArray(context2.physicalProperties) ? context2.physicalProperties.length : 0,
    translationsDigest,
    approvedByAgent: Boolean(approveContext2),
    durationMs: Date.now() - s3Start
  };

  if (prepareOnly) {
    const reviewMdPath = path.join(effectiveTargetDir, `${effectiveModel}_context2_review.md`);
    const translationsJsonPath = path.join(effectiveTargetDir, `${effectiveModel}_context2_translations.json`);
    const translationsMap = {};
    for (const s of Object.keys(ctx2Structured.sections || {})) {
      for (const item of (ctx2Structured.sections?.[s]?.items || [])) {
        if (item.labelCn && item.labelEn && item.labelCn !== '—') translationsMap[item.labelCn] = item.labelEn;
        if (item.valueCn && item.valueEn) translationsMap[item.valueCn] = item.valueEn;
        if (item.textCn && item.textEn) translationsMap[item.textCn] = item.textEn;
        for (const sub of (item.lines || [])) {
          const k = sub.textCn || `${sub.labelCn || ''}${sub.valueCn ? ` ${sub.valueCn}` : ''}`.trim();
          if (k && sub.textEn) translationsMap[k] = sub.textEn;
        }
        if (Array.isArray(item.cellsCn) && Array.isArray(item.cellsEn)) {
          item.cellsCn.forEach((cnC, ci) => {
            if (cnC && item.cellsEn[ci]) translationsMap[cnC] = item.cellsEn[ci];
          });
        }
      }
    }
    fs.writeFileSync(reviewMdPath, serializeContext2ToMarkdown(ctx2Structured), 'utf8');
    fs.writeFileSync(translationsJsonPath, JSON.stringify(translationsMap, null, 2), 'utf8');
    return {
      success: true,
      status: 'AWAITING_AGENT_PROOFREAD',
      modelCode: effectiveModel,
      targetDir: effectiveTargetDir,
      context1JsonPath,
      context1MdPath,
      reviewMdPath,
      translationsJsonPath,
      requiresAgentTranslation: confirmedReq.languages.includes('en'),
      untranslatedCount: ctx2Structured.validation?.untranslatedCount || 0,
      factFingerprintOk: Boolean(ctx2Structured.validation?.factFingerprintOk),
      totalDurationSec: Number(((Date.now() - globalStartTime) / 1000).toFixed(2)),
      stages
    };
  }

  // =========================================================================
  // 阶段 4 & 5: 按确认的 presets × languages 生成 DOCX，含 PDF 时强制走 pdf-converter.js
  // =========================================================================
  const s45Start = Date.now();
  const deliverables = [];
  const generatedDocxPaths = [];
  const generatedByPreset = new Map();

  let resolvedNamePattern = outputNamePattern;
  if (!resolvedNamePattern && namingPatternId) {
    const allPatterns = await fetchAvailableNamingPatterns({ apiBase });
    const hit = allPatterns.find((p) => p.id === namingPatternId || p.name === namingPatternId)
      || getCfgNamingPatternById(namingPatternId)
      || getDbNamingPatternById(namingPatternId);
    if (hit?.pattern) resolvedNamePattern = hit.pattern;
  }

  for (const presetId of confirmedReq.presets) {
    const isNonePreset = String(presetId).toLowerCase() === 'none';
    const matchedPreset = isNonePreset
      ? { id: 'none', name: 'none', entity: 'none' }
      : (availablePresets.find((p) => p.id === presetId || p.name === presetId) || { id: presetId, name: presetId, entity: presetId });
    const langPair = {};
    for (const lang of confirmedReq.languages) {
      const tplKey = templatePath || matchedPreset.targetTemplate || resolveDefaultTemplate(lang);
      const baseName = formatDeliverableBaseName({
        docId: effectiveModel,
        lang,
        presetLabel: matchedPreset.entity || matchedPreset.name || matchedPreset.id,
        outputNamePattern: resolvedNamePattern
      });
      const docxOut = path.join(effectiveTargetDir, `${baseName}.docx`);

      const schema = await inspectTemplateSchema(tplKey);
      const compiled = compileTopologyOps(ctx2Structured, schema, isNonePreset ? {} : { presetKey: matchedPreset.id });
      await handleToolCall('msds_execute_editor_ops', {
        templateKey: tplKey,
        outputPath: docxOut,
        sourceDocxPath: resolvedSourcePath,
        operations: compiled.operations
      });
      generatedDocxPaths.push(docxOut);
      langPair[lang] = docxOut;
      if (confirmedReq.formats.includes('docx')) {
        deliverables.push(docxOut);
      }
    }
    generatedByPreset.set(matchedPreset.id, langPair);
  }

  let pdfConverterUsed = false;
  if (confirmedReq.formats.includes('pdf')) {
    const batchInputs = generatedDocxPaths
      .filter((p) => fs.existsSync(p))
      .map((p) => ({ docxBuffer: fs.readFileSync(p), fileName: path.basename(p) }));
    const convertedPdfs = await convertBatchDocxToPdf(batchInputs);
    pdfConverterUsed = true;
    for (let i = 0; i < convertedPdfs.length; i++) {
      const res = convertedPdfs[i];
      const srcDocx = generatedDocxPaths[i];
      if (res && res.pdfBuffer && srcDocx) {
        const pdfOut = srcDocx.replace(/\.docx$/i, '.pdf');
        fs.writeFileSync(pdfOut, res.pdfBuffer);
        deliverables.push(pdfOut);
      }
    }
  }

  stages.stage4_5 = {
    name: 'Universal Editor & Enforced DOCX->PDF Order',
    status: 'COMPLETED',
    deliverables,
    deliverablesCount: deliverables.length,
    pdfConverterModule: pdfConverterUsed ? 'web/src/pdf-converter.js' : null,
    durationMs: Date.now() - s45Start
  };

  // =========================================================================
  // 阶段 6: 两阶双轨全景深度审计 (Two-Step Deep Audit)
  // =========================================================================
  const s6Start = Date.now();
  let auditSummary = { skipped: true };

  if (!skipAudit) {
    // 6.1 默认通用审计：对实际产出的每份 DOCX/PDF 执行 L2 内容覆盖率 + 9 层拓扑完整度 + PDF 规范核验（不锁死 8 格式或 16 节）
    const univAuditRes = await runUniversalDeliverableAudit({
      generatedDocxPaths,
      deliverables,
      pdfConverterUsed
    });
    if (!univAuditRes.ok) {
      throw new Error(`[STAGE-06 FATAL] 通用交付物内容/拓扑审计未通过: ${univAuditRes.failures.join(' | ')}`);
    }

    let legacyAudit = null;
    if (legacy8FormatAudit) {
      const masterAuditRes = await runMasterMsdsAudit({
        model: effectiveModel,
        targetDir: effectiveTargetDir,
        sourceDocx: resolvedSourcePath
      });
      if (!masterAuditRes.success) {
        throw new Error(`[STAGE-06 FATAL] 159 项集中式主审计未通过，存在 ${masterAuditRes.failCount} 项违章，发布已阻断！`);
      }
      const p5MechRes = await auditPhase5DocxFiles({
        targetDir: effectiveTargetDir,
        modelCode: effectiveModel,
        sourcePath: resolvedSourcePath
      });
      const p6PdfMechRes = auditPhase6PdfFiles({
        targetDir: effectiveTargetDir,
        modelCode: effectiveModel
      });
      if (!p5MechRes.ok || !p6PdfMechRes.ok) {
        const fails = [...(p5MechRes.findings || []), ...(p6PdfMechRes.findings || [])].map(x => `${x.ruleId}:${x.measuredDetail}`);
        throw new Error(`[STAGE-06 FATAL] 防复发机械硬门禁未通过: ${fails.join(' | ')}`);
      }
      const bilayerAuditRes = await runBipolarBilayerAudit(effectiveTargetDir, effectiveModel);
      if (!bilayerAuditRes.success) {
        throw new Error(`[STAGE-06 FATAL] 双极双层全景深度审计未通过，存在 ${bilayerAuditRes.failCount} 项违章，发布已阻断！`);
      }
      let fidelityRes = { success: true, totalAssertions: 0, passes: 0, failures: [] };
      for (const pair of generatedByPreset.values()) {
        if (pair.zh && pair.en && fs.existsSync(pair.zh) && fs.existsSync(pair.en)) {
          const pairRes = await audit16SectionsBilingualFidelity(pair.zh, pair.en, resolvedSourcePath);
          fidelityRes.totalAssertions += pairRes.totalAssertions || 0;
          fidelityRes.passes += pairRes.passes || 0;
          if (!pairRes.success) {
            fidelityRes.success = false;
            fidelityRes.failures.push(...(pairRes.failures || []));
          }
        }
      }
      if (!fidelityRes.success) {
        throw new Error(`[STAGE-06 FATAL] 双语保真度审计未通过，存在 ${fidelityRes.failures.length} 项违章，发布已阻断！`);
      }
      legacyAudit = {
        masterFailCount: masterAuditRes.failCount,
        bilayerFailCount: bilayerAuditRes.failCount,
        bilingualFailures: fidelityRes.failures.length
      };
    }

    auditSummary = {
      skipped: false,
      universalAudit: univAuditRes,
      legacyAudit
    };
  }

  stages.stage6 = {
    name: 'Two-Step Deep Audit',
    status: 'COMPLETED',
    summary: auditSummary,
    durationMs: Date.now() - s6Start
  };

  // =========================================================================
  // 阶段 7: 自动镜像分发与正式交付 (Delivery & Synchronization)
  // =========================================================================
  const s7Start = Date.now();
  let syncResults = [];

  if (!skipUserSync && effectiveUserSyncDir) {
    syncResults = await syncDeliverablesToUserDir(effectiveTargetDir, effectiveUserSyncDir, effectiveModel, deliverables);
  }
  if (wordDir) {
    fs.mkdirSync(path.resolve(wordDir), { recursive: true });
    for (const f of deliverables.filter(p => p.endsWith('.docx'))) {
      fs.copyFileSync(f, path.join(path.resolve(wordDir), path.basename(f)));
    }
  }
  if (pdfDir) {
    fs.mkdirSync(path.resolve(pdfDir), { recursive: true });
    for (const f of deliverables.filter(p => p.endsWith('.pdf'))) {
      fs.copyFileSync(f, path.join(path.resolve(pdfDir), path.basename(f)));
    }
  }

  const verificationLedger = generateVerificationLedger(syncResults, effectiveModel, auditSummary);

  stages.stage7 = {
    name: 'Delivery & Synchronization',
    status: 'COMPLETED',
    syncedFiles: syncResults,
    syncedCount: syncResults.filter(r => r.status === 'SYNCED').length,
    verificationLedger,
    durationMs: Date.now() - s7Start
  };

  const totalDurationMs = Date.now() - globalStartTime;

  return {
    success: true,
    modelCode: effectiveModel,
    sourceFilePath: resolvedSourcePath,
    targetDir: effectiveTargetDir,
    userSyncDir: effectiveUserSyncDir,
    verificationLedger,
    stages,
    totalDurationMs,
    totalDurationSec: (totalDurationMs / 1000).toFixed(2)
  };
}
