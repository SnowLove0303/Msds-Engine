/**
 * MSDS Studio 逐标签、逐值、逐位置批注与 Agent 友好导出数据引擎 (msds-review-bundle/v1)
 *
 * 核心职责：
 * 1. 维护审阅会话 ReviewSession (三方哈希、版本追踪)
 * 2. 6 维稳定锚点体系 (section, row, cell, label, value, position)，抗剪枝与序号重编号
 * 3. 三方事实证据链 (sourceEvidence, matchEvidence, templateEvidence) 与快照指纹
 * 4. 8 种批注生命周期状态机与漂移检测 (stale, orphaned)
 * 5. 导出门禁规则 checkExportGate (blocker/error 拦截，warning 放行)
 * 6. Agent 专属 NDJSON / manifest / review bundle 打包器
 */
import { extractSourceFacts, collectTemplateSlots } from './msds-handoff.js';

export const ANNOTATION_SCHEMA_VERSION = 'msds-review-bundle/v1';

export const ANNOTATION_STATUSES = [
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'accepted',
  'rejected',
  'stale',
  'orphaned',
];

export const ANNOTATION_SEVERITIES = [
  'blocker',
  'error',
  'warning',
  'info',
];

export const ANNOTATION_CATEGORIES = [
  'wrong_label',
  'wrong_value',
  'missing_value',
  'extra_value',
  'template_residual',
  'wrong_slot',
  'wrong_row',
  'wrong_cell',
  'wrong_section',
  'wrong_line_break',
  'missing_line_break',
  'extra_line_break',
  'wrong_sequence',
  'wrong_font',
  'wrong_bold',
  'wrong_alignment',
  'wrong_merge',
  'wrong_column',
  'source_conflict',
  'source_unreadable',
  'unmatched_fact',
  'ambiguous_mapping',
  'export_mismatch',
  'needs_manual_review',
];

export const ANNOTATION_PANELS = [
  'source_table',
  'matched_table',
  'source_preview',
  'editor',
];

export const ANCHOR_KINDS = [
  'section',
  'row',
  'cell',
  'label',
  'value',
  'position',
];

/**
 * 极简快速字符串哈希 (FNV-1a 32-bit hex)
 */
export function computeContentHash(content) {
  if (content == null) return '00000000';
  const str = String(content);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 规范化标签文本 (去前导序号、冒号与标点空白)
 */
export function normalizeAnchorLabel(text) {
  return String(text || '')
    .replace(/^\s*(?:v\s*)?\d+(?:[.．、]\d+)*(?:[.．、])?\s*/i, '')
    .replace(/[\s\u3000\t\r\n:：、，,。；;（）()\[\]【】—–\-_/\\]/g, '')
    .toLowerCase();
}

/**
 * 计算抗剪枝、抗序号重排的行指纹 rowFingerprint
 */
export function computeRowFingerprint({
  sectionNumber = 0,
  slotId = '',
  labelText = '',
  cellRoles = [],
  sequence = '',
} = {}) {
  const normLabel = normalizeAnchorLabel(labelText);
  const roles = Array.isArray(cellRoles) ? cellRoles.join(',') : String(cellRoles || '');
  const rawKey = `s${sectionNumber}|${slotId || 'none'}|${normLabel}|${roles}`;
  return `rfp_${sectionNumber}_${computeContentHash(rawKey)}`;
}

/**
 * 计算单元格指纹 cellFingerprint
 */
export function computeCellFingerprint({
  rowFingerprint = '',
  cellRole = '',
  colIndex = 0,
} = {}) {
  const rawKey = `${rowFingerprint}|c${colIndex}|${cellRole || 'cell'}`;
  return `cfp_${computeContentHash(rawKey)}`;
}

/**
 * 审阅会话实体
 */
export class ReviewSession {
  constructor({
    reviewSessionId = '',
    productModel = '',
    sourceFileName = '',
    sourceHash = '',
    templateName = 'CN 冠志',
    templateHash = '',
    matchingRunId = '',
    language = 'zh',
    companyVariant = 'guanzhi',
  } = {}) {
    this.schemaVersion = ANNOTATION_SCHEMA_VERSION;
    this.reviewSessionId = reviewSessionId || `RS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.productModel = productModel;
    this.sourceFileName = sourceFileName;
    this.sourceHash = sourceHash;
    this.templateName = templateName;
    this.templateHash = templateHash;
    this.matchingRunId = matchingRunId || `RUN-${Date.now().toString(36)}`;
    this.editorRevision = 0;
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.language = language;
    this.companyVariant = companyVariant;

    /** @type {Annotation[]} */
    this.annotations = [];

    /** @type {Object[]} */
    this.sourceFacts = [];

    /** @type {Object[]} */
    this.matchingSlots = [];
  }

  touch() {
    this.updatedAt = new Date().toISOString();
  }

  bumpRevision() {
    this.editorRevision += 1;
    this.touch();
  }

  addAnnotation(annotation) {
    annotation.reviewSessionId = this.reviewSessionId;
    this.annotations.push(annotation);
    this.touch();
    return annotation;
  }

  findAnnotation(annotationId) {
    return this.annotations.find((a) => a.annotationId === annotationId) || null;
  }

  removeAnnotation(annotationId) {
    const idx = this.annotations.findIndex((a) => a.annotationId === annotationId);
    if (idx >= 0) {
      const removed = this.annotations.splice(idx, 1)[0];
      this.touch();
      return removed;
    }
    return null;
  }
}

/**
 * 锚点实体构建器
 */
export function createAnchor(kind, options = {}) {
  if (!ANCHOR_KINDS.includes(kind)) {
    throw new Error(`Invalid anchor kind: ${kind}. Must be one of ${ANCHOR_KINDS.join(', ')}`);
  }

  const base = {
    kind,
    panel: options.panel || 'matched_table',
    sectionNumber: Number(options.sectionNumber) || 0,
    recordId: options.recordId || null,
  };

  switch (kind) {
    case 'section':
      return {
        ...base,
        sectionTitle: options.sectionTitle || '',
        recordFingerprint: options.recordFingerprint || `rec_${base.sectionNumber}`,
      };

    case 'row': {
      const rfp = options.rowFingerprint || computeRowFingerprint({
        sectionNumber: base.sectionNumber,
        slotId: options.slotId,
        labelText: options.labelText,
        cellRoles: options.cellRoles || [],
        sequence: options.sequence,
      });
      return {
        ...base,
        rowIndex: Number(options.rowIndex ?? -1),
        rowFingerprint: rfp,
        sequence: options.sequence || '',
        labelText: options.labelText || '',
        labelKey: normalizeAnchorLabel(options.labelText),
        slotId: options.slotId || '',
        rowRole: options.rowRole || 'data',
        cellCount: Number(options.cellCount || 2),
        mergeSignature: options.mergeSignature || '',
      };
    }

    case 'cell': {
      const rfp = options.rowFingerprint || computeRowFingerprint({
        sectionNumber: base.sectionNumber,
        slotId: options.slotId,
        labelText: options.labelText,
        cellRoles: [options.cellRole],
      });
      const cfp = options.cellFingerprint || computeCellFingerprint({
        rowFingerprint: rfp,
        cellRole: options.cellRole,
        colIndex: options.cellIndex ?? 0,
      });
      return {
        ...base,
        rowIndex: Number(options.rowIndex ?? -1),
        cellIndex: Number(options.cellIndex ?? -1),
        cellRole: options.cellRole || 'value',
        labelText: options.labelText || '',
        valueText: options.valueText || '',
        slotId: options.slotId || '',
        rowFingerprint: rfp,
        cellFingerprint: cfp,
        colspan: Number(options.colspan || 1),
        rowspan: Number(options.rowspan || 1),
      };
    }

    case 'label': {
      const rfp = options.rowFingerprint || computeRowFingerprint({
        sectionNumber: base.sectionNumber,
        slotId: options.slotId,
        labelText: options.labelText,
        cellRoles: ['label'],
      });
      return {
        ...base,
        rowIndex: Number(options.rowIndex ?? -1),
        cellIndex: Number(options.cellIndex ?? 0),
        labelText: options.labelText || '',
        labelKey: normalizeAnchorLabel(options.labelText),
        sequence: options.sequence || '',
        slotId: options.slotId || '',
        rowFingerprint: rfp,
        labelFormatSnapshot: {
          bold: Boolean(options.bold ?? true),
          font: options.font || 'SimSun',
          sizeHalfPoints: options.sizeHalfPoints || 21,
          underline: Boolean(options.underline),
          alignment: options.alignment || 'left',
        },
      };
    }

    case 'value': {
      const rfp = options.rowFingerprint || computeRowFingerprint({
        sectionNumber: base.sectionNumber,
        slotId: options.slotId,
        labelText: options.labelText,
        cellRoles: ['value'],
      });
      const cfp = options.cellFingerprint || computeCellFingerprint({
        rowFingerprint: rfp,
        cellRole: 'value',
        colIndex: options.valueCellIndex ?? 1,
      });
      return {
        ...base,
        rowIndex: Number(options.rowIndex ?? -1),
        cellIndex: Number(options.cellIndex ?? -1),
        valueCellIndex: Number(options.valueCellIndex ?? 1),
        slotId: options.slotId || '',
        labelText: options.labelText || '',
        valueText: options.valueText || '',
        valueHash: computeContentHash(options.valueText || ''),
        rowFingerprint: rfp,
        cellFingerprint: cfp,
        lineCount: (options.valueText || '').split('\n').filter(Boolean).length || 1,
        valueFormatSnapshot: {
          font: options.font || 'SimSun',
          sizeHalfPoints: options.sizeHalfPoints || 21,
          bold: Boolean(options.bold),
          alignment: options.alignment || 'left',
          cellWidth: options.cellWidth || null,
        },
      };
    }

    case 'position':
      return {
        ...base,
        rowIndex: Number(options.rowIndex ?? -1),
        cellIndex: Number(options.cellIndex ?? -1),
        logicalPath: options.logicalPath || `s${base.sectionNumber}:r${options.rowIndex}:c${options.cellIndex}`,
        visual: {
          pageIndex: Number(options.pageIndex || 1),
          x: Number(options.x || 0),
          y: Number(options.y || 0),
          width: Number(options.width || 0),
          height: Number(options.height || 0),
          coordinateSpace: options.coordinateSpace || 'viewport',
          zoom: Number(options.zoom || 1.0),
        },
      };

    default:
      return base;
  }
}

/**
 * 批注实体
 */
export class Annotation {
  constructor({
    annotationId = '',
    reviewSessionId = '',
    status = 'open',
    severity = 'error',
    category = 'wrong_value',
    title = '',
    comment = '',
    expected = '',
    actual = '',
    suggestedAction = '',
    author = 'MSDS Reviewer',
    anchor = null,
    sourceEvidence = null,
    matchEvidence = null,
    templateEvidence = null,
    snapshot = null,
  } = {}) {
    this.annotationId = annotationId || `ANN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    this.reviewSessionId = reviewSessionId;
    this.status = ANNOTATION_STATUSES.includes(status) ? status : 'open';
    this.severity = ANNOTATION_SEVERITIES.includes(severity) ? severity : 'error';
    this.category = ANNOTATION_CATEGORIES.includes(category) ? category : 'needs_manual_review';
    this.title = title || `${this.severity.toUpperCase()}: ${this.category}`;
    this.comment = comment || '';
    this.expected = expected || '';
    this.actual = actual || '';
    this.suggestedAction = suggestedAction || '';
    this.author = author || 'Agent/Auditor';
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.resolvedAt = null;

    this.anchor = anchor || {};
    this.sourceEvidence = sourceEvidence || {};
    this.matchEvidence = matchEvidence || {};
    this.templateEvidence = templateEvidence || {};
    this.snapshot = snapshot || {};
  }

  resolve(resolutionNote = '') {
    this.status = 'resolved';
    this.resolvedAt = new Date().toISOString();
    this.updatedAt = this.resolvedAt;
    if (resolutionNote) {
      this.comment = `${this.comment}\n[Resolution]: ${resolutionNote}`.trim();
    }
  }

  markStale(reason = '底层值已变更') {
    this.status = 'stale';
    this.updatedAt = new Date().toISOString();
  }

  markOrphaned(reason = '目标行已被剪枝剔除') {
    this.status = 'orphaned';
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * 锚点重解析器：在文档经历剪枝删行或重编号后，根据 slotId 与 rowFingerprint 精确重新定位目标行与单元格
 */
export function resolveAnchor(anchor, tableRecords = []) {
  if (!anchor || !Array.isArray(tableRecords)) {
    return { resolved: false, reason: 'invalid_inputs' };
  }

  const record = tableRecords.find((r) => r.sectionNumber === anchor.sectionNumber);
  if (!record || !record.rows) {
    return { resolved: false, reason: 'section_not_found' };
  }

  if (anchor.kind === 'section') {
    return { resolved: true, record, target: record };
  }

  // 1. 优先使用 rowFingerprint 精准匹配
  if (anchor.rowFingerprint) {
    for (const row of record.rows) {
      const c0 = row.cells?.[0];
      const rfp = computeRowFingerprint({
        sectionNumber: anchor.sectionNumber,
        slotId: anchor.slotId,
        labelText: c0?.labelText || c0?.text || '',
        cellRoles: (row.cells || []).map((c) => c.role || 'data'),
        sequence: anchor.sequence,
      });
      if (rfp === anchor.rowFingerprint) {
        return resolveWithinRow(anchor, record, row);
      }
    }
  }

  // 2. 备选方案：依据 slotId 或规范化标签查找
  if (anchor.slotId) {
    for (const row of record.rows) {
      const c0 = row.cells?.[0];
      const normLabel = normalizeAnchorLabel(c0?.labelText || c0?.text || '');
      if (anchor.labelKey && normLabel === anchor.labelKey) {
        return resolveWithinRow(anchor, record, row);
      }
    }
  }

  // 3. 兜底方案：依据原始物理 rowIndex
  if (anchor.rowIndex >= 0 && anchor.rowIndex < record.rows.length) {
    const row = record.rows[anchor.rowIndex];
    return resolveWithinRow(anchor, record, row);
  }

  return { resolved: false, reason: 'row_pruned_or_missing', record };
}

function resolveWithinRow(anchor, record, row) {
  if (anchor.kind === 'row') {
    return { resolved: true, record, row, target: row };
  }
  if (anchor.kind === 'label') {
    const labelCell = row.cells?.[0] || null;
    return { resolved: Boolean(labelCell), record, row, cell: labelCell, target: labelCell };
  }
  if (anchor.kind === 'value' || anchor.kind === 'cell') {
    const colIdx = anchor.cellIndex >= 0 ? anchor.cellIndex : (anchor.valueCellIndex ?? 1);
    const valueCell = row.cells?.find((c) => c.col === colIdx) || row.cells?.[colIdx] || row.cells?.[row.cells.length - 1];
    return { resolved: Boolean(valueCell), record, row, cell: valueCell, target: valueCell };
  }
  return { resolved: true, record, row, target: row };
}

/**
 * 漂移与失效检测：检查当前批注是否变为 stale 或 orphaned
 */
export function detectAnchorDrift(annotation, tableRecords = []) {
  if (!annotation || !annotation.anchor) return { drifted: false };
  const res = resolveAnchor(annotation.anchor, tableRecords);

  if (!res.resolved) {
    if (annotation.status !== 'orphaned' && annotation.status !== 'resolved') {
      annotation.markOrphaned('原目标行未找到或已被物理剪枝');
      return { drifted: true, type: 'orphaned' };
    }
    return { drifted: false };
  }

  // 若批注针对 value，检查 valueHash 是否改变
  if (annotation.anchor.kind === 'value' && res.cell) {
    const currentVal = res.cell.valueText ?? res.cell.text ?? '';
    const currentHash = computeContentHash(currentVal);
    if (annotation.snapshot?.valueHash && currentHash !== annotation.snapshot.valueHash) {
      if (annotation.status !== 'stale' && annotation.status !== 'resolved') {
        annotation.markStale(`值内容已变更: 原哈希 ${annotation.snapshot.valueHash} -> 现哈希 ${currentHash}`);
        return { drifted: true, type: 'stale', currentVal };
      }
    }
  }

  return { drifted: false };
}

/**
 * 导出门禁检查 (Gatekeeper)
 * 规则：
 * 1. 存在未解决 blocker 或 error 级别批注 -> 坚决阻止导出
 * 2. 仅存在 warning / stale / orphaned -> 允许导出但记录 warnings
 * 3. 只有 info 或全 resolved -> 正常放行
 */
export function checkExportGate(reviewSession) {
  if (!reviewSession || !Array.isArray(reviewSession.annotations)) {
    return {
      allowed: true,
      status: 'allowed',
      blockers: [],
      errors: [],
      warnings: [],
      stale: [],
      orphaned: [],
      message: '无批注，准予导出',
    };
  }

  const active = reviewSession.annotations.filter((a) => !['resolved', 'accepted', 'rejected'].includes(a.status));
  const blockers = active.filter((a) => a.severity === 'blocker');
  const errors = active.filter((a) => a.severity === 'error');
  const warnings = active.filter((a) => a.severity === 'warning');
  const stale = active.filter((a) => a.status === 'stale');
  const orphaned = active.filter((a) => a.status === 'orphaned');

  if (blockers.length > 0 || errors.length > 0) {
    return {
      allowed: false,
      status: 'blocked',
      blockers,
      errors,
      warnings,
      stale,
      orphaned,
      message: `存在未处理阻断项：${blockers.length} 个 blocker, ${errors.length} 个 error，禁止导出正式 MSDS！`,
    };
  }

  if (warnings.length > 0 || stale.length > 0 || orphaned.length > 0) {
    return {
      allowed: true,
      status: 'allowed_with_warnings',
      blockers: [],
      errors: [],
      warnings,
      stale,
      orphaned,
      message: `准予导出（带警告）：存在 ${warnings.length} 项警告，${stale.length} 项陈旧批注，${orphaned.length} 项孤儿批注。`,
    };
  }

  return {
    allowed: true,
    status: 'allowed',
    blockers: [],
    errors: [],
    warnings: [],
    stale: [],
    orphaned: [],
    message: '审阅通过，全部条目合格，准予正式导出！',
  };
}

function safeCleanObject(obj, seen = new WeakSet()) {
  if (obj == null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return '[Circular]';
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => safeCleanObject(item, seen));
  }

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'row' || k === 'cell' || k === 'record' || k === 'node' || k === 'paragraphs' || k === 'runs') {
      if (v && typeof v === 'object') {
        continue;
      }
    }
    clean[k] = safeCleanObject(v, seen);
  }
  return clean;
}

/**
 * 序列化为 NDJSON (一行一个独立 JSON)
 */
export function formatNdjson(items = []) {
  if (!Array.isArray(items)) return '';
  return items.map((item) => JSON.stringify(safeCleanObject(item))).join('\n') + (items.length ? '\n' : '');
}

/**
 * 从 NDJSON 解析对象列表
 */
export function parseNdjson(ndjsonText = '') {
  if (!ndjsonText) return [];
  return String(ndjsonText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * 生成审阅包文件清单与内容 (msds-review-bundle/v1)
 */
export function buildReviewBundle(reviewSession, options = {}) {
  const gate = checkExportGate(reviewSession);
  const now = new Date().toISOString();
  const finalMsdsFile = options.finalDocxName || `${reviewSession.productModel || 'MSDS'} msds_CN 冠志.docx`;

  const total = reviewSession.annotations.length;
  const openCount = reviewSession.annotations.filter((a) => a.status === 'open').length;
  const blockerCount = reviewSession.annotations.filter((a) => a.severity === 'blocker' && !['resolved', 'accepted'].includes(a.status)).length;
  const errorCount = reviewSession.annotations.filter((a) => a.severity === 'error' && !['resolved', 'accepted'].includes(a.status)).length;
  const warningCount = reviewSession.annotations.filter((a) => a.severity === 'warning').length;
  const staleCount = reviewSession.annotations.filter((a) => a.status === 'stale').length;
  const orphanedCount = reviewSession.annotations.filter((a) => a.status === 'orphaned').length;

  const manifest = {
    schemaVersion: ANNOTATION_SCHEMA_VERSION,
    reviewSessionId: reviewSession.reviewSessionId,
    productModel: reviewSession.productModel,
    sourceFileName: reviewSession.sourceFileName,
    sourceHash: reviewSession.sourceHash,
    templateName: reviewSession.templateName,
    templateHash: reviewSession.templateHash,
    matchingRunId: reviewSession.matchingRunId,
    editorRevision: reviewSession.editorRevision,
    annotationCount: total,
    openCount,
    blockerCount,
    errorCount,
    warningCount,
    staleCount,
    orphanedCount,
    finalMsdsFile,
    generatedAt: now,
    exportStatus: gate.status,
    gateMessage: gate.message,
  };

  const annotationsNdjson = formatNdjson(reviewSession.annotations);
  const sourceFactsNdjson = formatNdjson(reviewSession.sourceFacts);
  const matchingSlotsNdjson = formatNdjson(reviewSession.matchingSlots);

  // Section summary json
  const sectionSummary = {};
  for (let s = 1; s <= 16; s++) {
    const sAnns = reviewSession.annotations.filter((a) => a.anchor?.sectionNumber === s);
    sectionSummary[`section_${s}`] = {
      sectionNumber: s,
      totalAnnotations: sAnns.length,
      open: sAnns.filter((a) => a.status === 'open').length,
      resolved: sAnns.filter((a) => a.status === 'resolved').length,
      blocker: sAnns.filter((a) => a.severity === 'blocker').length,
      error: sAnns.filter((a) => a.severity === 'error').length,
      warning: sAnns.filter((a) => a.severity === 'warning').length,
    };
  }

  // Human-readable summary markdown
  const reviewSummaryMd = `# MSDS 审阅报告与批注汇总表

- **审阅会话**: \`${reviewSession.reviewSessionId}\`
- **产品型号**: **${reviewSession.productModel || '未提供'}**
- **源文件**: \`${reviewSession.sourceFileName}\` (Hash: \`${reviewSession.sourceHash || 'N/A'}\`)
- **使用模板**: \`${reviewSession.templateName}\`
- **导出门禁状态**: **${gate.status.toUpperCase()}**
- **门禁说明**: ${gate.message}
- **生成时间**: ${now}

## 📊 批注概览

| 批注总数 | 待处理 (Open) | 阻断项 (Blocker) | 错误项 (Error) | 警告项 (Warning) | 陈旧项 (Stale) | 孤儿项 (Orphaned) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **${total}** | ${openCount} | ${blockerCount} | ${errorCount} | ${warningCount} | ${staleCount} | ${orphanedCount} |

## 📑 逐条批注与 Agent 决策清单

${reviewSession.annotations.length === 0 ? '_当前会话无任何问题批注。_' : reviewSession.annotations.map((a, idx) => `
### ${idx + 1}. [${a.severity.toUpperCase()}] ${a.title} (\`${a.annotationId}\`)
- **状态**: \`${a.status}\` | **类别**: \`${a.category}\`
- **定位**: Section ${a.anchor?.sectionNumber || '-'} / Slot \`${a.anchor?.slotId || '-'}\` / 行指纹 \`${a.anchor?.rowFingerprint || '-'}\`
- **实际值 (Actual)**: \`${a.actual || a.anchor?.valueText || '-'}\`
- **期望值 (Expected)**: \`${a.expected || '-'}\`
- **审阅意见**: ${a.comment || '无'}
- **建议动作**: ${a.suggestedAction || '需人工复核'}
- **源事实证据**: \`${a.sourceEvidence?.sourceLocator || '-'}\` ${a.sourceEvidence?.sourceText ? `("${a.sourceEvidence.sourceText}")` : ''}
`).join('\n')}
`;

  return {
    manifest,
    files: {
      'manifest.json': JSON.stringify(manifest, null, 2),
      'annotations.ndjson': annotationsNdjson,
      'source-facts.ndjson': sourceFactsNdjson,
      'matching-slots.ndjson': matchingSlotsNdjson,
      'section-summary.json': JSON.stringify(sectionSummary, null, 2),
      'review-summary.md': reviewSummaryMd,
    },
  };
}

/**
 * 初始化并组装审阅会话（融合 sourceEngine 事实、matchResult 决策与 templateEngine 插槽）
 */
export function initReviewSession({
  sourceEngine = null,
  matchResult = null,
  templateEngine = null,
  productModel = '',
  templateName = 'CN 冠志',
} = {}) {
  const sourceHash = sourceEngine?.originalBytes ? computeContentHash(sourceEngine.originalBytes) : '';
  const templateHash = templateEngine?.originalBytes ? computeContentHash(templateEngine.originalBytes) : '';
  const sourceName = sourceEngine?.sourceName || '';

  const session = new ReviewSession({
    productModel: productModel || matchResult?.summary?.productName || sourceName.replace(/\.docx$/i, ''),
    sourceFileName: sourceName,
    sourceHash,
    templateName,
    templateHash,
    matchingRunId: `RUN-${Date.now().toString(36)}`,
  });

  // 1. 提取源事实
  if (sourceEngine) {
    const { facts } = extractSourceFacts(sourceEngine);
    session.sourceFacts = facts || [];
  }

  // 2. 提取模板插槽
  if (templateEngine) {
    const rawSlots = collectTemplateSlots(templateEngine) || [];
    session.matchingSlots = rawSlots.map((s) => ({
      slotId: s.slotId,
      section: s.section,
      recordId: s.recordId,
      rowIndex: s.rowIndex,
      valueCellIndex: s.valueCellIndex,
      labels: s.labels,
      labelKeys: s.labelKeys,
      noteKey: s.noteKey,
      rowText: s.rowText,
      componentRow: Boolean(s.componentRow),
    }));
  }

  // 3. 从 matchResult 自动提取并初始化存疑/冲突项为警告批注
  if (matchResult?.matchedSections) {
    for (const sec of matchResult.matchedSections) {
      for (const row of sec.matchedRows) {
        if (row.status === 'REVIEW_AMBIGUOUS') {
          session.addAnnotation(new Annotation({
            reviewSessionId: session.reviewSessionId,
            status: 'open',
            severity: 'warning',
            category: 'ambiguous_mapping',
            title: `Section ${sec.sectionNumber} 槽位存疑或冲突: ${row.standardLabel}`,
            comment: row.reason || '源文档存在多条冲突事实，需人工审校确认',
            actual: row.value,
            expected: '',
            suggestedAction: '请核对源文件事实并手动指定正确值',
            anchor: createAnchor('row', {
              panel: 'matched_table',
              sectionNumber: sec.sectionNumber,
              recordId: sec.sourceRecord?.id,
              slotId: row.slotId,
              labelText: row.standardLabel,
              valueText: row.value,
            }),
            matchEvidence: {
              matchingRunId: session.matchingRunId,
              matchKey: row.key,
              slotId: row.slotId,
              standardLabel: row.standardLabel,
              status: row.status,
              reason: row.reason,
              rawSnippet: row.rawSnippet,
            },
            snapshot: {
              valueHash: computeContentHash(row.value),
              sourceHash,
              templateHash,
            },
          }));
        }
      }
    }
  }

  return session;
}

