
let lastActiveTriggerSelector = null;
let lastFocusedModalControlSelector = null;
const savedInertState = new Map();

function recordModalTrigger(triggerEl) {
  const el = triggerEl || document.activeElement;
  if (!el) {
    lastActiveTriggerSelector = null;
    return;
  }
  if (el.id) {
    lastActiveTriggerSelector = `#${el.id}`;
  } else if (el.dataset?.action) {
    const action = el.dataset.action;
    const extra = el.dataset.presetId ? `[data-preset-id="${el.dataset.presetId}"]` :
                  el.dataset.baselineId ? `[data-baseline-id="${el.dataset.baselineId}"]` :
                  el.dataset.targetKey ? `[data-target-key="${el.dataset.targetKey}"]` : '';
    lastActiveTriggerSelector = `${el.tagName.toLowerCase()}[data-action="${action}"]${extra}`;
  } else {
    lastActiveTriggerSelector = null;
  }
}

function restoreModalTrigger() {
  if (lastActiveTriggerSelector) {
    const el = document.querySelector(lastActiveTriggerSelector);
    if (el) {
      try { el.focus(); return; } catch (_) {}
    }
  }
}

function focusFirstInModal(selector) {
  setTimeout(() => {
    const modal = document.querySelector(selector);
    if (!modal) return;
    const focusable = modal.querySelector('input:not([disabled]), button:not([disabled]):not(.modal-close), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || modal.querySelector('.modal-close') || modal;
    if (focusable) {
      try {
        focusable.focus();
      } catch (_) {}
    }
  }, 60);
}

function applyModalInert() {
  const root = document.querySelector('#app');
  if (!root) return;
  const topbar = root.querySelector('header.topbar');
  const main = root.querySelector('main.page-shell');
  [topbar, main].forEach((el) => {
    if (el) {
      if (!savedInertState.has(el)) {
        savedInertState.set(el, el.hasAttribute('inert'));
      }
      el.setAttribute('inert', '');
    }
  });
}

function restoreModalInert() {
  if (state.editor.exportModalOpen || state.editor.managerModalOpen || state.editor.versionModalOpen) {
    return;
  }
  const root = document.querySelector('#app');
  if (!root) return;
  const topbar = root.querySelector('header.topbar');
  const main = root.querySelector('main.page-shell');
  [topbar, main].forEach((el) => {
    if (el && savedInertState.has(el)) {
      const hadInert = savedInertState.get(el);
      if (hadInert) {
        el.setAttribute('inert', '');
      } else {
        el.removeAttribute('inert');
      }
      savedInertState.delete(el);
    }
  });
}

function openUnifiedExportModal(triggerEl) {
  recordModalTrigger(triggerEl);
  state.editor.exportModalOpen = true;
  lastFocusedModalControlSelector = null;
  applyModalInert();
  renderApp();
  focusFirstInModal('.unified-export-dialog');
}

function closeUnifiedExportModal() {
  state.editor.exportModalOpen = false;
  lastFocusedModalControlSelector = null;
  restoreModalInert();
  renderApp();
  restoreModalTrigger();
}

function openPresetManagerModal(triggerEl) {
  recordModalTrigger(triggerEl);
  state.editor.managerModalOpen = true;
  lastFocusedModalControlSelector = null;
  applyModalInert();
  renderApp();
  focusFirstInModal('.preset-manager-dialog');
}

function closePresetManagerModal() {
  state.editor.managerModalOpen = false;
  lastFocusedModalControlSelector = null;
  restoreModalInert();
  renderApp();
  restoreModalTrigger();
}

function openVersionModal(triggerEl) {
  recordModalTrigger(triggerEl);
  state.editor.versionModalOpen = true;
  applyModalInert();
  renderApp();
  focusFirstInModal('.version-modal-card');
}

function closeVersionModal() {
  state.editor.versionModalOpen = false;
  restoreModalInert();
  renderApp();
  restoreModalTrigger();
}

import { renderAsync } from 'docx-preview';
import {
  addNoteRowAfter,
  addRowAfter,
  moveRowUp,
  moveRowDown,
  auditEngine,
  buildExportDocxName,
  extractHeaderFooterData,
  updateHeaderFooterData,
  cellRole,
  classifyLabelTier,
  deleteRow,
  DocxEngineError,
  loadDocx,
  normalizedSequence,
  portableModel,
  recordById,
  renumberRecord,
  restoreSectionToTemplate,
  writeCellLabel,
  writeCellValue,
  clearCellValue,
  clearSectionValues,
  applyPresetPriorityOverlay,
  PresetStore,
  DraftStore,
  getCellSemanticKey,
  findCellBySemanticKey,
  extractSemanticSnapshot,
  applySemanticOverrides,
  SYSTEM_BUILTIN_PRESETS,
  TEMPLATE_BASELINES,
} from './docx-engine.js';
import {
  escapeHtml,
  twipsToPx,
  cssValue,
  imageStyle,
  sourceParagraphStyle,
  sourceRunStyle,
  renderParagraph,
  sourceCellStyle,
  sourceRowStyle,
  sourceColumnMarkup,
  sourceTableStyle,
  needsFallbackGrid,
  renderCellContent,
  renderEditorCell,
  renderEditorTable as renderEditorTableMarkup,
} from './render-utils.js';
import {
  runSmartMatching,
  applyMatchResultToEditor,
} from './smart-matching.js';
import JSZip from 'jszip';
import {
  initReviewSession,
  ReviewSession,
  Annotation,
  createAnchor,
  resolveAnchor,
  detectAnchorDrift,
  checkExportGate,
  buildReviewBundle,
  computeContentHash,
  computeRowFingerprint,
} from './annotation-engine.js';
import { APP_VERSION, APP_BUILD_DATE, RELEASE_NOTES, UPDATE_COMMANDS } from './version.js';
import './styles.css';

const root = document.querySelector('#app');

const TEMPLATE_OPTIONS = {
  'CN 冠志': '正式模板_MSDS_CN_冠志(1).docx',
  'EN 冠志': '正式模板_MSDS_EN_冠志(1).docx',
};

// ==========================================
// 全局高性能多级内存池 (Instant Switch Cache)
// ==========================================
const templateBufferCache = new Map(); // templateName -> ArrayBuffer
const repoRecordMemoryCache = new Map(); // recordId -> record JSON
const repoEngineMemoryCache = new Map(); // recordId -> { inspectEngine, tplEngine, preview, matchResult }

const state = {
  view: 'inspect', // 'inspect' | 'matching' | 'editor'
  repo: {
    records: [],
    batches: [],
    selectedBatchId: 'all',
    query: '',
    statusFilter: 'all', // 'all' | 'perfect' | 'conflict' | 'unmatched' | 'annotated'
    loading: false,
    activeRecordId: null,
    stats: { totalRecords: 0, perfectCount: 0, conflictCount: 0, unmatchedCount: 0, annotatedCount: 0, batchCount: 0 },
    catalogModalOpen: false,
    batchModalOpen: false,
    batchScanDir: '',
    batchTargetTemplate: 'CN 冠志',
    batchNameInput: '',
    batchRecursive: true,
    batchImportProgress: null,
  },
  toast: null,
  sourcePreview: null, // { name: string, type: 'docx' | 'pdf' | 'doc', blobUrl?: string, file?: File }
  inspector: { engine: null, selectedRecordId: null, selectedCellId: null, query: '', showPreview: true, zoomScale: 'fit' },
  matching: { template: 'CN 冠志', templateEngine: null, result: null, selectedSectionNumber: 1, query: '', compareMode: 'doc-match', zoomScale: 'fit', isWidePreview: false, modelDropdownOpen: false, modelQuery: '' },
  editor: {
    engine: null,
    template: 'CN 冠志',
    currentBaselineId: 'baseline_cn_guanzhi',
    drafts: {},
    selectedRecordId: null,
    selectedCellId: null,
    allowLabelEdit: false,
    manageCellEditability: false,
    cellEditableOverrides: {},
    dirty: false,
    query: '',
    customFileName: '',
    isPresetEditing: false,
    editingPresetId: null,
    normalEngine: null,
    presets: PresetStore.loadPresets(),
    exportModalOpen: false,
    exportConfig: {
      formatDocx: true,
      formatPdf: true,
      langCn: true,
      langEn: true,
      includeGuanzhi: true,
      includeGuocai: true,
      customPresetIds: {},
      isExporting: false,
      exportProgress: '',
    },
    managerModalOpen: false,
    versionModalOpen: false,
    previewMode: 'template', // 默认展示当前模板排版，开箱即用无需依赖源文件
    zoomScale: 'fit',
    isWidePreview: false,
  },
  pendingScrollSection: { inspect: null, matching: null, editor: null },
  previewScrollPositions: { inspect: 0, matching: 0, editor: 0 },
  review: {
    session: null,
    drawerOpen: false,
    filterSection: 'all',
    filterSeverity: 'all',
    filterStatus: 'all',
    modal: null,
  },
};

const shortNumber = (value) => new Intl.NumberFormat('zh-CN').format(value || 0);
const sectionLabel = (number) => number ? `Section ${number}` : '未分类';

// 原版式阅览器 DOM 渲染缓存池与 Section 锚定关键词字典
const previewRenderCache = new Map();

const SECTION_KEYWORDS = {
  1: ['化学品及企业标识', 'Identification', 'CHEMICAL PRODUCT', 'SECTION 1', '第1部分', '1. 化学品', '1. IDENTIFICATION', '1、化学品'],
  2: ['危险性概述', 'Hazards Identification', 'HAZARDS IDENTIFICATION', 'SECTION 2', '第2部分', '2. 危险性', '2. HAZARDS', '2、危险性'],
  3: ['成分/组成信息', 'Composition', 'COMPOSITION/INFORMATION', 'SECTION 3', '第3部分', '3. 成分', '3. COMPOSITION', '3、成分'],
  4: ['急救措施', 'First-Aid', 'FIRST AID', 'SECTION 4', '第4部分', '4. 急救', '4. FIRST AID', '4、急救'],
  5: ['消防措施', 'Fire-Fighting', 'FIRE FIGHTING', 'SECTION 5', '第5部分', '5. 消防', '5. FIRE FIGHTING', '5、消防'],
  6: ['泄漏应急处理', 'Accidental Release', 'ACCIDENTAL RELEASE', 'SECTION 6', '第6部分', '6. 泄漏', '6. ACCIDENTAL', '6、泄漏'],
  7: ['操作处置与储存', 'Handling and Storage', 'HANDLING AND STORAGE', 'SECTION 7', '第7部分', '7. 操作', '7. HANDLING', '7、操作'],
  8: ['接触控制/个体防护', 'Exposure Controls', 'EXPOSURE CONTROLS', 'SECTION 8', '第8部分', '8. 接触', '8. EXPOSURE', '8、接触'],
  9: ['理化特性', 'Physical and Chemical', 'PHYSICAL AND CHEMICAL', 'SECTION 9', '第9部分', '9. 理化', '9. PHYSICAL', '9、理化'],
  10: ['稳定性和反应性', 'Stability and Reactivity', 'STABILITY AND REACTIVITY', 'SECTION 10', '第10部分', '10. 稳定', '10. STABILITY', '10、稳定'],
  11: ['毒理学信息', 'Toxicological Information', 'TOXICOLOGICAL INFORMATION', 'SECTION 11', '第11部分', '11. 毒理', '11. TOXICOLOGICAL', '11、毒理'],
  12: ['生态学信息', 'Ecological Information', 'ECOLOGICAL INFORMATION', 'SECTION 12', '第12部分', '12. 生态', '12. ECOLOGICAL', '12、生态'],
  13: ['废弃处置', 'Disposal Considerations', 'DISPOSAL CONSIDERATIONS', 'SECTION 13', '第13部分', '13. 废弃', '13. DISPOSAL', '13、废弃'],
  14: ['运输信息', 'Transport Information', 'TRANSPORT INFORMATION', 'SECTION 14', '第14部分', '14. 运输', '14. TRANSPORT', '14、运输'],
  15: ['法规信息', 'Regulatory Information', 'REGULATORY INFORMATION', 'SECTION 15', '第15部分', '15. 法规', '15. REGULATORY', '15、法规'],
  16: ['其他信息', 'Other Information', 'OTHER INFORMATION', 'SECTION 16', '第16部分', '16. 其他', '16. OTHER', '16、其他'],
};

function scrollToSectionInPreview(container, sectionNumber) {
  if (!container || !sectionNumber) return;
  const keywords = SECTION_KEYWORDS[sectionNumber] || [`Section ${sectionNumber}`, `第${sectionNumber}部分`];
  const candidates = container.querySelectorAll('p, h1, h2, h3, h4, th, td, div');
  let matchedEl = null;

  for (const el of candidates) {
    const text = (el.innerText || el.textContent || '').trim();
    if (!text || text.length > 90) continue;
    const hit = keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()));
    if (hit) {
      matchedEl = el;
      break;
    }
  }

  if (matchedEl) {
    const containerRect = container.getBoundingClientRect();
    const elRect = matchedEl.getBoundingClientRect();
    const targetScroll = container.scrollTop + (elRect.top - containerRect.top) - 15;
    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
    if (container.dataset.preview) {
      state.previewScrollPositions[container.dataset.preview] = Math.max(0, targetScroll);
    }
  } else {
    const ratio = Math.max(0, Math.min(1, (sectionNumber - 1) / 16));
    const targetScroll = container.scrollHeight * ratio;
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
    if (container.dataset.preview) {
      state.previewScrollPositions[container.dataset.preview] = targetScroll;
    }
  }
}

function showToast(message, type = 'info') {
  state.toast = { message, type, id: Date.now() };
  renderApp();
  const toastId = state.toast.id;
  window.setTimeout(() => {
    if (state.toast?.id === toastId) {
      state.toast = null;
      renderApp();
    }
  }, 4600);
}

function engineBuffer(engine) {
  return engine.originalBytes.buffer.slice(engine.originalBytes.byteOffset, engine.originalBytes.byteOffset + engine.originalBytes.byteLength);
}

function sourceFileName(engine) {
  return engine?.sourceName || '未载入文档';
}

function tableRecords(engine) {
  return engine?.records?.filter((record) => record.kind === 'table') || [];
}

function firstSectionRecord(engine) {
  const records = tableRecords(engine);
  return records.find((record) => record.sectionNumber === 1) || records[0] || null;
}

function selectedRecord(engine, recordId) {
  const records = tableRecords(engine);
  return recordById(engine, recordId) || firstSectionRecord(engine) || records[0] || null;
}

function getCell(record, rowIndex, col) {
  return record?.rows?.find((row) => row.index === Number(rowIndex))?.cells?.find((cell) => cell.col === Number(col)) || null;
}

function cellId(record, cell) {
  return `${record.id}:${cell.row}:${cell.col}`;
}

function navMarkup() {
  return `
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark"><span></span><span></span><span></span></div>
        <div>
          <div class="brand-name">MSDS <em>Studio</em></div>
          <div class="brand-caption">安全数据表 · 本地工作台</div>
        </div>
      </div>
      <nav class="main-nav" aria-label="主导航">
        <button class="nav-item ${state.view === 'inspect' ? 'active' : ''}" data-view="inspect">
          <span class="nav-icon">⌁</span><span>DOCX 识别</span><small>01</small>
        </button>
        <button class="nav-item ${state.view === 'matching' ? 'active' : ''}" data-view="matching">
          <span class="nav-icon">⇄</span><span>智能匹配</span><small>02</small>
        </button>
        <button class="nav-item ${state.view === 'editor' ? 'active' : ''}" data-view="editor">
          <span class="nav-icon">✦</span><span>模板编辑器</span><small>03</small>
        </button>
      </nav>
      <div class="topbar-meta"><button class="nav-version-badge" data-action="open-version-modal" type="button" title="点击查看系统版本与极速更新中心"><span class="version-dot"></span>v${APP_VERSION}</button><span class="topbar-divider"></span><span class="local-dot"></span>浏览器本地处理<span class="topbar-divider"></span><span>16 sections ready</span></div>
    </header>
  `;
}

function toastMarkup() {
  if (!state.toast) return '';
  return `<div class="toast toast-${state.toast.type}" role="status"><span class="toast-symbol">${state.toast.type === 'error' ? '!' : state.toast.type === 'success' ? '✓' : 'i'}</span><span>${escapeHtml(state.toast.message)}</span></div>`;
}

function emptyWorkspace(kind) {
  const isInspect = kind === 'inspect';
  return `
    <section class="empty-workspace ${isInspect ? 'empty-workspace-inspect' : ''}" ${isInspect ? 'data-empty-workspace="inspect" data-dropzone="inspect"' : ''}>
      <h1>${isInspect ? '导入 DOCX' : '选择模板'}</h1>
      <div class="empty-actions">
        ${isInspect ? '<button class="button button-primary" data-action="pick-inspect">选择 DOCX</button><button class="button button-quiet" data-action="load-sample">载入样例</button>' : '<button class="button button-primary" data-action="load-editor">CN 冠志</button><button class="button button-quiet" data-action="load-en-editor">EN 冠志</button>'}
      </div>
    </section>
  `;
}

function headerBand(title, kicker, description, actions = '') {
  return `
    <div class="page-band">
      <h1>${title}</h1>
      ${actions ? `<div class="band-actions">${actions}</div>` : ''}
    </div>
  `;
}

function renderAnnotationDrawer() {
  if (!state.review.drawerOpen) return '';
  const session = state.review.session;
  const annotations = session?.annotations || [];
  const gate = checkExportGate(session);

  let filtered = [...annotations];
  if (state.review.filterSection !== 'all') {
    filtered = filtered.filter((a) => a.anchor?.sectionNumber === Number(state.review.filterSection));
  }
  if (state.review.filterSeverity !== 'all') {
    filtered = filtered.filter((a) => a.severity === state.review.filterSeverity);
  }
  if (state.review.filterStatus !== 'all') {
    filtered = filtered.filter((a) => a.status === state.review.filterStatus);
  }

  return `
    <div class="ann-drawer-backdrop" data-action="close-review-drawer">
      <aside class="ann-drawer" onclick="event.stopPropagation()">
        <div class="ann-drawer-header">
          <h3><span>💬</span> 审阅批注清单 <small style="font-weight:normal;color:#64748b;">(${annotations.length})</small></h3>
          <button class="ann-drawer-close" data-action="close-review-drawer" title="关闭抽屉">×</button>
        </div>
        <div class="ann-drawer-toolbar">
          <label>Section:
            <select id="ann-filter-section">
              <option value="all">全章节</option>
              ${Array.from({ length: 16 }, (_, i) => `<option value="${i + 1}" ${state.review.filterSection === String(i + 1) ? 'selected' : ''}>Sec ${i + 1}</option>`).join('')}
            </select>
          </label>
          <label>等级:
            <select id="ann-filter-severity">
              <option value="all">全部</option>
              <option value="blocker" ${state.review.filterSeverity === 'blocker' ? 'selected' : ''}>Blocker</option>
              <option value="error" ${state.review.filterSeverity === 'error' ? 'selected' : ''}>Error</option>
              <option value="warning" ${state.review.filterSeverity === 'warning' ? 'selected' : ''}>Warning</option>
              <option value="info" ${state.review.filterSeverity === 'info' ? 'selected' : ''}>Info</option>
            </select>
          </label>
          <label>状态:
            <select id="ann-filter-status">
              <option value="all">全部</option>
              <option value="open" ${state.review.filterStatus === 'open' ? 'selected' : ''}>待处理</option>
              <option value="resolved" ${state.review.filterStatus === 'resolved' ? 'selected' : ''}>已解决</option>
              <option value="stale" ${state.review.filterStatus === 'stale' ? 'selected' : ''}>已陈旧</option>
              <option value="orphaned" ${state.review.filterStatus === 'orphaned' ? 'selected' : ''}>已孤儿</option>
            </select>
          </label>
        </div>
        <div class="ann-drawer-batch-actions" style="padding:8px 16px;background:rgba(15,23,42,.6);border-bottom:1px solid rgba(148,163,184,.15);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:#94a3b8;">未解决: <strong style="color:${annotations.some(a => a.status === 'open') ? '#f87171' : '#34d399'};">${annotations.filter(a => a.status === 'open').length}</strong> 项</span>
          <div style="display:flex;gap:8px;">
            <button class="button button-quiet button-xs" data-action="resolve-all-annotations" type="button" style="color:#34d399;border-color:rgba(52,211,153,.35);font-size:11px;" title="将当前所有批注一键标记为已修复解决">✓ 全部标为已解决</button>
            <button class="button button-quiet button-xs" data-action="clear-all-annotations" type="button" style="color:#ef4444;border-color:rgba(239,68,68,.35);font-size:11px;" title="彻底清空当前会话中的所有审阅批注">🧹 一键清空批注</button>
          </div>
        </div>
        <div class="ann-drawer-list">
          ${filtered.length === 0 ? '<div class="no-results" style="padding:20px;text-align:center;color:#94a3b8;">无符合条件的批注</div>' : filtered.map((a) => `
            <div class="ann-item-card is-${a.severity} ${a.status === 'resolved' ? 'is-resolved' : ''}">
              <div class="ann-item-title">
                <span>[${a.severity.toUpperCase()}] ${escapeHtml(a.title)}</span>
                <span class="pill pill-sm">${a.status}</span>
              </div>
              <div class="ann-item-loc">Sec ${a.anchor?.sectionNumber || '-'} · ${escapeHtml(a.anchor?.slotId || a.anchor?.labelKey || '未知槽位')}</div>
              ${(a.actual || a.expected) ? `
                <div class="ann-item-diff">
                  ${a.actual ? `<span class="ann-diff-actual">- 实际: ${escapeHtml(a.actual)}</span>` : ''}
                  ${a.expected ? `<span class="ann-diff-expected">+ 期望: ${escapeHtml(a.expected)}</span>` : ''}
                </div>
              ` : ''}
              <div class="ann-item-comment">${escapeHtml(a.comment || '无附言')}</div>
              <div class="ann-item-actions">
                ${a.status !== 'resolved' ? `<button class="ann-btn-resolve" data-resolve-ann="${a.annotationId}">标记已解决 ✓</button>` : `<span style="font-size:11px;color:#16a34a;">已修复解决</span>`}
                <button class="button button-quiet button-sm" data-delete-ann="${a.annotationId}" style="height:22px;padding:0 6px;font-size:10px;">删除</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="ann-modal-footer" style="padding:10px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:#64748b;">门禁: <strong>${gate.status}</strong></span>
          <button class="button button-dark button-sm" data-action="export-review-bundle">📦 导出审阅包</button>
        </div>
      </aside>
    </div>
  `;
}

function renderAnnotationModal() {
  if (!state.review.modal?.open) return '';
  const m = state.review.modal;
  return `
    <div class="ann-modal-backdrop" data-action="close-ann-modal">
      <div class="ann-modal" onclick="event.stopPropagation()">
        <div class="ann-modal-header">
          <h3><span>💬</span> 添加批注 · Section ${m.sectionNumber || ''} (Row ${m.rowIndex ?? ''})</h3>
          <button class="ann-drawer-close" data-action="close-ann-modal">×</button>
        </div>
        <div class="ann-modal-body">
          <div class="ann-form-row">
            <div class="ann-form-group">
              <label>严重程度</label>
              <select id="ann-modal-severity">
                <option value="warning" selected>Warning (存疑警告，不阻断导出)</option>
                <option value="info">Info (记录说明)</option>
                <option value="error">Error (需修复，导出时提示)</option>
                <option value="blocker">Blocker (严重阻断)</option>
              </select>
            </div>
            <div class="ann-form-group">
              <label>问题分类</label>
              <select id="ann-modal-category">
                <option value="wrong_value">值错误 (wrong_value)</option>
                <option value="wrong_label">标签错误 (wrong_label)</option>
                <option value="missing_value">值缺失 (missing_value)</option>
                <option value="template_residual">模板残留 (template_residual)</option>
                <option value="wrong_line_break">换行错误 (wrong_line_break)</option>
                <option value="needs_manual_review">需要人工核实 (needs_manual_review)</option>
              </select>
            </div>
          </div>
          <div class="ann-form-group">
            <label>当前实际文本 (Actual)</label>
            <input type="text" id="ann-modal-actual" value="${escapeHtml(m.actual || '')}" readonly style="background:#f8fafc;color:#64748b;" />
          </div>
          <div class="ann-form-group">
            <label>期望正确文本 (Expected)</label>
            <input type="text" id="ann-modal-expected" placeholder="请输入期望的正确内容…" value="${escapeHtml(m.expected || '')}" />
          </div>
          <div class="ann-form-group">
            <label>审阅意见与上下文说明 (Comment)</label>
            <textarea id="ann-modal-comment" placeholder="详细说明问题表现、判断依据或源文件位置…"></textarea>
          </div>
          <div class="ann-form-group">
            <label>建议修复动作 (Suggested Action)</label>
            <input type="text" id="ann-modal-action" placeholder="例如：重新路由到标准槽位 / 从源文件第X行提取" />
          </div>
        </div>
        <div class="ann-modal-footer">
          <button class="button button-quiet" data-action="close-ann-modal">取消</button>
          <button class="button button-primary" data-action="save-ann-modal">保存批注</button>
        </div>
      </div>
    </div>
  `;
}


function getPresetExportFileName(preset, model) {
  const m = model || 'MSDS';
  if (preset.headerFooterOverrides?.customFileNamePattern) {
    return preset.headerFooterOverrides.customFileNamePattern.replace('{model}', m);
  }
  const cleanPresetName = (preset.name || '预设').replace(/[\\/:*?"<>|]/g, '_');
  const lang = preset.targetTemplate?.includes('EN') ? 'EN' : 'CN';
  return `${m} msds_${lang}_${cleanPresetName}.docx`;
}


function getCurrentBaseline() {
  return TEMPLATE_BASELINES.find((b) => b.id === state.editor.currentBaselineId) || TEMPLATE_BASELINES[0];
}

function ensureCurrentDraft() {
  const currentBaseId = state.editor.currentBaselineId || 'baseline_cn_guanzhi';
  if (!state.editor.drafts) state.editor.drafts = {};
  if (!state.editor.drafts[currentBaseId] && state.editor.engine) {
    state.editor.drafts[currentBaseId] = {
      baselineId: currentBaseId,
      engine: state.editor.isPresetEditing ? (state.editor.normalEngine || state.editor.engine) : state.editor.engine,
      status: 'editing',
      dirty: Boolean(state.editor.dirty),
      selectedRecordId: state.editor.selectedRecordId,
      customFileName: state.editor.customFileName || '',
      updatedAt: Date.now(),
    };
  }
}

async function switchBaselineDraft(targetBaselineId) {
  if (!targetBaselineId) return;
  if (targetBaselineId === state.editor.currentBaselineId && state.editor.engine) return;

  // 1. 暂存当前基准草稿
  if (state.editor.engine) {
    const curId = state.editor.currentBaselineId || 'baseline_cn_guanzhi';
    const prevDraft = state.editor.drafts[curId] || {};
    state.editor.drafts[curId] = {
      ...prevDraft,
      baselineId: curId,
      engine: state.editor.isPresetEditing ? (state.editor.normalEngine || state.editor.engine) : state.editor.engine,
      status: prevDraft.status === 'completed' && !state.editor.dirty ? 'completed' : 'editing',
      dirty: Boolean(state.editor.dirty),
      selectedRecordId: state.editor.selectedRecordId,
      customFileName: state.editor.customFileName || '',
      updatedAt: Date.now(),
    };
  }

  // 退出预设编辑模式
  if (state.editor.isPresetEditing) {
    state.editor.isPresetEditing = false;
    state.editor.editingPresetId = null;
    state.editor.normalEngine = null;
  }

  // 2. 切换当前基准
  state.editor.currentBaselineId = targetBaselineId;
  const targetBaseline = TEMPLATE_BASELINES.find((b) => b.id === targetBaselineId) || TEMPLATE_BASELINES[0];

  // 3. 恢复目标草稿或载入新底模
  const targetDraft = state.editor.drafts[targetBaselineId];
  if (targetDraft && targetDraft.engine) {
    state.editor.engine = targetDraft.engine;
    state.editor.selectedRecordId = targetDraft.selectedRecordId || firstSectionRecord(targetDraft.engine)?.id;
    state.editor.dirty = Boolean(targetDraft.dirty);
    state.editor.customFileName = targetDraft.customFileName || '';
    state.editor.template = targetBaseline.displayName;
    showToast(`已恢复【${targetBaseline.displayName}】已保存草稿。已编辑内容完好无损。`, 'info');
  } else {
    try {
      const engine = await fetchTemplate(targetBaseline.displayName);
      tableRecords(engine).forEach((record) => renumberRecord(record));
      state.editor.engine = engine;
      state.editor.selectedRecordId = firstSectionRecord(engine)?.id || null;
      state.editor.dirty = false;
      state.editor.customFileName = '';
      state.editor.template = targetBaseline.displayName;
      state.editor.drafts[targetBaselineId] = {
        baselineId: targetBaselineId,
        engine: engine,
        status: 'editing',
        dirty: false,
        updatedAt: Date.now(),
      };
      showToast(`已载入【${targetBaseline.displayName}】底模。可独立编辑该基准内容。`, 'info');
    } catch (err) {
      showToast(`载入模板基准底模失败：${err.message}`, 'error');
    }
  }

  renderApp();
}

function toggleBaselineComplete() {
  ensureCurrentDraft();
  const draft = state.editor.drafts[state.editor.currentBaselineId];
  if (!draft) return;
  if (draft.status === 'completed') {
    draft.status = 'editing';
    DraftStore.saveDraftMeta(state.editor.currentBaselineId, draft);
    showToast('当前模板基准已恢复标记为【编辑中】。', 'info');
  } else {
    draft.status = 'completed';
    draft.dirty = false;
    DraftStore.saveDraftMeta(state.editor.currentBaselineId, draft);
    showToast('🎉 当前模板基准已确认标为【已完成】，具备导出资格！', 'success');
  }
  renderApp();
}

function renderBaselineSelectorMarkup() {
  ensureCurrentDraft();
  const currentDraft = state.editor.drafts[state.editor.currentBaselineId];
  const isCompleted = currentDraft?.status === 'completed';
  return `
    <div class="baseline-switch-group" title="切换模板基准；各基准拥有独立编辑草稿，切换时自动保存与恢复">
      <label for="baseline-select" class="baseline-label">模板基准：</label>
      <select id="baseline-select" class="baseline-dropdown">
        ${TEMPLATE_BASELINES.map((b) => {
          const d = state.editor.drafts[b.id];
          const sText = !d || d.status === 'unstarted' ? '未开始' : (d.status === 'completed' ? '✓ 已完成' : '编辑中');
          return `<option value="${escapeHtml(b.id)}" ${b.id === state.editor.currentBaselineId ? 'selected' : ''}>
            ${escapeHtml(b.displayName)} [${sText}]
          </option>`;
        }).join('')}
      </select>
      <button type="button" class="button button-xs btn-toggle-baseline-complete ${isCompleted ? 'is-completed' : ''}" data-action="toggle-baseline-complete" title="切换当前模板基准是否完成编辑（仅已编辑基准可导出）">
        ${isCompleted ? '✓ 已完成' : '○ 标为已完成'}
      </button>
    </div>
  `;
}

function renderEditorBanner() {
  const curBaseId = state.editor.currentBaselineId || 'baseline_cn_guanzhi';
  const basePresets = (state.editor.presets || []).filter((p) => {
    const bId = p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
    return bId === curBaseId;
  });

  if (state.editor.isPresetEditing) {
    const activePreset = basePresets.find((x) => x.id === state.editor.editingPresetId) || basePresets[0] || (state.editor.presets || []).find((x) => x.id === state.editor.editingPresetId) || { id: 'preset_custom_1', name: '自定义预设 1', baselineId: curBaseId, fieldOverrides: {} };
    return `
      <div class="preset-mode-banner" data-toolbar-scope="editor-banner">
        <div class="preset-banner-title">
          <span class="preset-banner-badge">预设模式</span>
          <div class="preset-name-edit-group">
            <label for="editing-preset-name-input" class="preset-name-label">预设名称：</label>
            <input
              id="editing-preset-name-input"
              class="preset-name-input"
              value="${escapeHtml(activePreset.name)}"
              placeholder="输入预设名称"
              title="直接修改当前预设名称，保存后生效"
            />
          </div>
          <div class="preset-switch-group">
            <label for="switch-editing-preset-select" class="preset-switch-label">切换：</label>
            <select id="switch-editing-preset-select" class="preset-selector-dropdown">
              ${basePresets.map((p) => `
                <option value="${escapeHtml(p.id)}" ${p.id === activePreset.id ? 'selected' : ''}>
                  ${escapeHtml(p.name)} (${Object.keys(p.fieldOverrides || {}).length}项覆写)
                </option>
              `).join('')}
            </select>
          </div>
          <div class="preset-status-wrap">
            ${state.editor.dirty
              ? '<span class="preset-status-indicator status-dirty" title="检测到未保存的字段覆写修改"><span class="status-dot dot-warn"></span>未保存修改</span>'
              : '<span class="preset-status-indicator status-clean" title="所有修改已保存至预设"><span class="status-dot dot-clean"></span>已保存</span>'
            }
          </div>
        </div>
        <div class="preset-banner-actions">
          <button type="button" class="button button-primary button-sm btn-preset-save" data-action="save-current-preset" title="保存对当前预设的覆写修改与名称">保存预设</button>
          <button type="button" class="button button-secondary button-sm" data-action="save-as-new-preset" title="将当前编辑的覆写另存为新预设">另存为</button>
          <button type="button" class="button button-danger-subtle button-sm" data-action="clear-all-preset-overrides" title="清空本预设所有覆写字段，恢复全部留空继承">清空覆写</button>
          <button type="button" class="button button-quiet button-sm btn-preset-exit" data-action="exit-preset-editing" title="退出预设编辑，返回主物料文档编辑">返回主稿</button>
        </div>
      </div>
    `;
  }

  const curDraft = state.editor.drafts[curBaseId];
  const isDone = curDraft && curDraft.status === 'completed' && !curDraft.dirty;

  return `
    <div class="normal-mode-banner" data-toolbar-scope="editor-banner">
      <div class="normal-banner-info">
        <span class="normal-mode-indicator">基准模式：<strong>${escapeHtml(getCurrentBaseline()?.displayName || '当前基准')}</strong></span>
        <span class="pill ${isDone ? 'pill-green' : 'pill-blue'}">${isDone ? '✓ 已就绪' : '编辑中'}</span>
        <span class="normal-preset-count">${basePresets.length} 个专属预设</span>
      </div>
      <div class="normal-banner-actions">
        <button type="button" class="button button-secondary button-sm" data-action="enter-preset-mode" title="进入当前基准专属预设编辑模式">进入预设编辑</button>
        <button type="button" class="button button-quiet button-sm" data-action="open-preset-manager-modal" title="查看与管理所有模板基准预设">预设管理</button>
      </div>
    </div>
  `;
}

function computeExportTargets() {
  ensureCurrentDraft();
  const cfg = state.editor.exportConfig;
  const targets = [];

  for (const b of TEMPLATE_BASELINES) {
    const draft = state.editor.drafts[b.id];
    // 严格规范：只有 status === 'completed' 且无未确认脏数据(!draft.dirty)，才具备就绪导出资格
    const isReady = draft && draft.status === 'completed' && !draft.dirty && draft.engine;
    if (!isReady) continue;

    const baseEngine = draft.engine;
    const baseModel = baseEngine?.headerFooterData?.model || state.review.session?.productModel || 'MSDS';

    // 1. 基础草稿勾选
    const baseKey = `${b.id}:base`;
    if (cfg.selectedTargets?.[baseKey]) {
      const baseClean = `${baseModel} msds_${b.language} ${b.entity}`;
      if (cfg.formatDocx) {
        targets.push({
          baselineId: b.id,
          baselineName: b.displayName,
          type: 'base',
          title: '基础底稿 (主版本)',
          format: 'docx',
          fileName: `${baseClean}.docx`,
          docxFileName: `${baseClean}.docx`,
          engine: baseEngine,
        });
      }
      if (cfg.formatPdf) {
        targets.push({
          baselineId: b.id,
          baselineName: b.displayName,
          type: 'base',
          title: '基础底稿 (主版本)',
          format: 'pdf',
          fileName: `${baseClean}.pdf`,
          docxFileName: `${baseClean}.docx`,
          engine: baseEngine,
        });
      }
    }

    // 2. 属于该基准的预设勾选
    const bPresets = state.editor.presets.filter((p) => {
      const pBaseId = p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
      return pBaseId === b.id;
    });

    for (const p of bPresets) {
      const pKey = `${b.id}:${p.id}`;
      if (cfg.selectedTargets?.[pKey]) {
        let presetDocxName = '';
        if (p.headerFooterOverrides?.customFileNamePattern) {
          presetDocxName = p.headerFooterOverrides.customFileNamePattern.replace('{model}', baseModel);
        } else {
          const cleanPresetName = (p.name || '预设').replace(/[\\/:*?"<>|]/g, '_');
          presetDocxName = `${baseModel} msds_${b.language}_${cleanPresetName}.docx`;
        }
        const baseClean = presetDocxName.replace(/\.docx$/i, '');

        if (cfg.formatDocx) {
          targets.push({
            baselineId: b.id,
            baselineName: b.displayName,
            type: 'preset',
            preset: p,
            title: p.name,
            format: 'docx',
            fileName: `${baseClean}.docx`,
            docxFileName: `${baseClean}.docx`,
            engine: baseEngine,
          });
        }
        if (cfg.formatPdf) {
          targets.push({
            baselineId: b.id,
            baselineName: b.displayName,
            type: 'preset',
            preset: p,
            title: p.name,
            format: 'pdf',
            fileName: `${baseClean}.pdf`,
            docxFileName: `${baseClean}.docx`,
            engine: baseEngine,
          });
        }
      }
    }
  }

  return targets;
}

function renderUnifiedExportModal() {
  if (!state.editor.exportModalOpen) return '';
  ensureCurrentDraft();
  const cfg = state.editor.exportConfig;
  const targets = computeExportTargets();
  const docxCount = targets.filter((t) => t.format === 'docx').length;
  const pdfCount = targets.filter((t) => t.format === 'pdf').length;

  return `
    <div class="modal-backdrop" data-backdrop="true">
      <div class="modal-card unified-export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-modal-title" tabindex="-1">
        <div class="modal-header">
          <div id="export-modal-title" class="modal-title">
            导出
          </div>
          <button class="modal-close" data-action="close-unified-export-modal" type="button" aria-label="关闭">×</button>
        </div>
        <div class="export-modal-body">
          <!-- 1. 交付格式选择 -->
          <div class="export-section">
            <div class="export-section-header">
              <span class="export-section-title">1. 选择交付格式</span>
              <div class="export-quick-links">
                <button type="button" class="export-quick-link" data-action="quick-export-both-formats">全部 (Word+PDF)</button>
                <button type="button" class="export-quick-link" data-action="quick-export-docx-only">仅 Word</button>
                <button type="button" class="export-quick-link" data-action="quick-export-pdf-only">仅 PDF</button>
              </div>
            </div>
            <div class="export-chip-group">
              <label class="export-chip ${cfg.formatDocx ? 'active' : ''}">
                <input type="checkbox" data-action="toggle-export-format" data-format="docx" ${cfg.formatDocx ? 'checked' : ''} />
                <span>Word (.docx)</span>
              </label>
              <label class="export-chip ${cfg.formatPdf ? 'active' : ''}">
                <input type="checkbox" data-action="toggle-export-format" data-format="pdf" ${cfg.formatPdf ? 'checked' : ''} />
                <span>PDF (.pdf)</span>
              </label>
            </div>
          </div>

          <!-- 2. 已就绪基准与版本 -->
          <div class="export-section">
            <div class="export-section-header">
              <span class="export-section-title">2. 勾选交付基准与版本</span>
            </div>
            <div class="export-baseline-list">
              ${TEMPLATE_BASELINES.map((b) => {
                const draft = state.editor.drafts[b.id];
                const isReady = draft && draft.status === 'completed' && !draft.dirty && draft.engine;
                const bPresets = state.editor.presets.filter((p) => {
                  const pBaseId = p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
                  return pBaseId === b.id;
                });
                const baseKey = `${b.id}:base`;

                if (!isReady) {
                  return `
                    <div class="export-baseline-card is-unstarted">
                      <div class="export-baseline-header">
                        <span class="export-baseline-name">
                          <strong>${escapeHtml(b.displayName)}</strong>
                          <span class="pill pill-warn">未就绪 (草稿编辑中)</span>
                        </span>
                      </div>
                      <p class="export-baseline-empty-tip">
                        该基准草稿尚未标记为完成或包含未保存修改，已自动阻断导出。
                      </p>
                    </div>
                  `;
                }

                return `
                  <div class="export-baseline-card">
                    <div class="export-baseline-header">
                      <span class="export-baseline-name">
                        <strong>${escapeHtml(b.displayName)}</strong>
                        <span class="pill pill-green">✓ 已就绪</span>
                      </span>
                      <span class="export-subtext">含基础底稿与 ${bPresets.length} 个专属预设</span>
                    </div>
                    <div class="export-baseline-items">
                      <label class="export-chip ${cfg.selectedTargets?.[baseKey] ? 'active' : ''}">
                        <input type="checkbox" data-action="toggle-export-target" data-target-key="${baseKey}" ${cfg.selectedTargets?.[baseKey] ? 'checked' : ''} />
                        <span>基础底稿 (主版本)</span>
                      </label>
                      ${bPresets.map((p) => {
                        const pKey = `${b.id}:${p.id}`;
                        return `
                          <label class="export-chip ${cfg.selectedTargets?.[pKey] ? 'active' : ''}">
                            <input type="checkbox" data-action="toggle-export-target" data-target-key="${pKey}" ${cfg.selectedTargets?.[pKey] ? 'checked' : ''} />
                            <span>${escapeHtml(p.name)}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 3. 实时交付清单预览 -->
          <div class="export-section">
            <div class="export-section-header">
              <span class="export-section-title">3. 交付清单预览 (${targets.length} 份)</span>
              <span class="export-subtext">${docxCount} 份 Word · ${pdfCount} 份 PDF</span>
            </div>
            <div class="export-preview-box">
              ${targets.length === 0 ? '<div style="padding:16px;text-align:center;color:var(--text-secondary);font-size:12px;">未勾选任何导出项，请在上方已就绪基准中勾选版本。</div>' : targets.map((t) => `
                <div class="export-preview-row">
                  <div class="export-preview-tags">
                    <span class="export-pill-tag tag-entity">${escapeHtml(t.baselineName.split('·')[1]?.trim() || t.baselineName)}</span>
                    <span class="export-pill-tag tag-cn">${escapeHtml(t.title)}</span>
                    <span class="export-pill-tag ${t.format === 'docx' ? 'tag-docx' : 'tag-pdf'}">${t.format.toUpperCase()}</span>
                  </div>
                  <span class="export-preview-filename">${escapeHtml(t.fileName)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          ${cfg.isExporting ? `
            <div class="export-progress-bar">
              <div class="export-spinner"></div>
              <span>${escapeHtml(cfg.exportProgress || '正在构建交付物…')}</span>
            </div>
          ` : `
            <div class="export-summary-bar">
              <span>共 <strong>${targets.length}</strong> 份交付物，将打包为单一 ZIP 压缩包下载。</span>
            </div>
          `}
        </div>
        <div class="modal-actions">
          <button type="button" class="button button-quiet" data-action="close-unified-export-modal" ${cfg.isExporting ? 'disabled' : ''}>取消</button>
          <button type="button" class="button button-primary" data-action="confirm-unified-export" ${targets.length === 0 || cfg.isExporting ? 'disabled' : ''}>
            ${cfg.isExporting ? '正在导出…' : '导出 ZIP'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderPresetManagerModal() {
  if (!state.editor.managerModalOpen) return '';

  return `
    <div class="modal-backdrop" data-backdrop="true">
      <div class="modal-card preset-manager-dialog" role="dialog" aria-modal="true" aria-labelledby="preset-modal-title" tabindex="-1">
        <div class="modal-header">
          <div id="preset-modal-title" class="modal-title">
            预设管理
          </div>
          <button class="modal-close" data-action="close-preset-modal" type="button" aria-label="关闭">×</button>
        </div>
        <div class="modal-body">
          ${TEMPLATE_BASELINES.map((b) => {
            const bPresets = state.editor.presets.filter((p) => {
              const pBaseId = p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
              return pBaseId === b.id;
            });
            const isCur = b.id === state.editor.currentBaselineId;
            return `
              <div class="preset-baseline-group">
                <div class="preset-baseline-header">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <strong style="color:var(--text-main);font-size:13px;">${escapeHtml(b.displayName)}</strong>
                    ${isCur ? '<span class="pill pill-green">当前基准</span>' : ''}
                    <span class="pill pill-blue">${bPresets.length} 个专属预设</span>
                  </div>
                  <button class="button button-secondary button-xs" data-action="create-new-preset" data-baseline-id="${b.id}" type="button">+ 新建预设</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
                  ${bPresets.length === 0 ? '<div style="font-size:12px;color:var(--text-secondary);padding:6px 0;">该基准下暂无自定义预设。</div>' : bPresets.map((p) => `
                    <div class="preset-item-card">
                      <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <strong style="color:var(--text-main);font-size:13px;">${escapeHtml(p.name)}</strong>
                          ${p.isBuiltin ? '<span style="font-size:11px;color:var(--text-secondary);">(系统标准)</span>' : ''}
                        </div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">
                          发布主体: <span>${escapeHtml(p.headerFooterOverrides?.company || '继承基准')}</span> · 
                          专属覆写: <span style="color:var(--btn-primary-bg);font-weight:600;">${Object.keys(p.fieldOverrides || {}).length} 项</span>
                        </div>
                      </div>
                      <div style="display:flex;gap:8px;align-items:center;">
                        <button class="button button-quiet button-sm" data-action="edit-preset-from-manager" data-preset-id="${escapeHtml(p.id)}" type="button" title="切换并进入该预设编辑">编辑</button>
                        ${!p.isBuiltin ? `<button class="button button-danger-subtle button-sm" data-action="delete-preset" data-preset-id="${escapeHtml(p.id)}" type="button" title="删除此预设">删除</button>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="modal-actions" style="display:flex;justify-content:space-between;align-items:center;">
          <button class="button button-danger-subtle button-sm" data-action="reset-presets-to-default" type="button">恢复默认预设</button>
          <button class="button button-secondary" data-action="close-preset-modal" type="button">关闭</button>
        </div>
      </div>
    </div>
  `;
}

function renderVersionModal() {
  if (!state.editor.versionModalOpen) return '';
  return `
    <div class="modal-backdrop" data-backdrop="true" style="position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;">
      <div class="modal-card version-modal-card" role="dialog" aria-modal="true" aria-labelledby="version-modal-title" tabindex="-1" style="background:var(--bg-panel);border:1px solid var(--border-base);border-radius:14px;width:680px;max-width:94vw;box-shadow:var(--shadow-modal);overflow:hidden;color:var(--text-main);">
        <div class="modal-header" style="padding:16px 24px;border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;background:var(--bg-subtle);">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#0284c7,#38bdf8);display:flex;align-items:center;justify-content:center;font-size:20px;">🚀</div>
            <div>
              <div id="version-modal-title" style="font-weight:700;font-size:16px;color:var(--text-main);display:flex;align-items:center;gap:8px;">
                <span>MSDS Engine</span>
                <span style="font-size:12px;background:#0284c7;color:#ffffff;padding:2px 8px;border-radius:999px;font-weight:600;">v${APP_VERSION}</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">构建日期: ${APP_BUILD_DATE} · 生产/开发混合自适应环境</div>
            </div>
          </div>
          <button class="modal-close" data-action="close-version-modal" type="button" style="background:transparent;border:none;color:var(--text-secondary);font-size:22px;cursor:pointer;">×</button>
        </div>
        <div class="modal-body" style="padding:22px 24px;max-height:70vh;overflow-y:auto;display:flex;flex-direction:column;gap:18px;">
          <!-- 核心特性 -->
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;">
            <div style="font-size:13px;font-weight:700;color:#0369a1;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>✨</span> 本次版本核心特性 (v${APP_VERSION})
            </div>
            <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:var(--text-secondary);">
              ${RELEASE_NOTES.map((item) => `<li><strong>${escapeHtml(item.title)}</strong>：${escapeHtml(item.desc)}</li>`).join('')}
            </ul>
          </div>

          <!-- Docker 快速更新方案 -->
          <div style="background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:10px;padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:13px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:6px;">
                <span>🐳</span> <strong>Docker 容器部署与一键更新</strong>
              </div>
              <button class="button button-quiet button-xs" data-action="copy-docker-cmd" type="button" style="font-size:12px;color:var(--cyan);border-color:var(--border-base);">📋 复制命令</button>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0 0 8px 0;line-height:1.5;">如果在 Docker 环境运行，在宿主机项目根目录执行以下一行命令即可秒级拉取更新并重构启动：</p>
            <pre id="docker-update-cmd" style="background:#ffffff;padding:10px 14px;border-radius:6px;border:1px solid var(--border-base);font-family:Consolas, Monaco, monospace;font-size:12px;color:#0369a1;margin:0;overflow-x:auto;">${escapeHtml(UPDATE_COMMANDS.docker)}</pre>
          </div>

          <!-- 本地开发/运行快速更新方案 -->
          <div style="background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:10px;padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:13px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:6px;">
                <span>⚡</span> <strong>本地一键更新脚本 (Windows / Linux)</strong>
              </div>
              <button class="button button-quiet button-xs" data-action="copy-local-cmd" type="button" style="font-size:12px;color:var(--cyan);border-color:var(--border-base);">📋 复制命令</button>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0 0 8px 0;line-height:1.5;">支持调用仓库内置的高可用更新脚本，自动检测依赖并重新构建：</p>
            <pre id="local-update-cmd" style="background:#ffffff;padding:10px 14px;border-radius:6px;border:1px solid var(--border-base);font-family:Consolas, Monaco, monospace;font-size:12px;color:#0369a1;margin:0;overflow-x:auto;"># Windows (PowerShell):
${escapeHtml(UPDATE_COMMANDS.windows)}

# Linux / macOS:
${escapeHtml(UPDATE_COMMANDS.linux)}</pre>
          </div>
        </div>
        <div class="modal-actions" style="padding:14px 24px;background:var(--bg-subtle);border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#64748b;">✨ MSDS Engine 自动化与快速热更新支持</span>
          <button class="button button-quiet" type="button" data-action="close-version-modal">关闭窗口</button>
        </div>
      </div>
    </div>
  `;
}


// ==========================================
// 数据库型号目录与批量 API 支持 (MSDS Catalog & Repo API)
// ==========================================

async function fetchRepoData() {
  try {
    state.repo.loading = true;
    const batchParam = state.repo.selectedBatchId || 'all';
    const statusParam = state.repo.statusFilter || 'all';
    const qParam = encodeURIComponent(state.repo.query || '');
    
    const [statsRes, batchesRes, recordsRes] = await Promise.all([
      fetch('/api/msds/repo/stats').then((r) => r.json()).catch(() => ({ success: false })),
      fetch('/api/msds/repo/batches').then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`/api/msds/repo/records?batchId=${encodeURIComponent(batchParam)}&status=${encodeURIComponent(statusParam)}&q=${qParam}`).then((r) => r.json()).catch(() => ({ success: false })),
    ]);

    if (statsRes.success) state.repo.stats = statsRes.data;
    if (batchesRes.success) state.repo.batches = Array.isArray(batchesRes.data) ? batchesRes.data : (batchesRes.data?.batches || []);
    if (recordsRes.success) state.repo.records = Array.isArray(recordsRes.data) ? recordsRes.data : (recordsRes.data?.records || []);
  } catch (err) {
    console.error('Failed to fetch repo data:', err);
  } finally {
    state.repo.loading = false;
    renderApp();
  }
}

async function loadRecordToThreePane(recordId) {
  try {
    // 0. 优先从内存池命中瞬时缓存 (0ms 极速秒切)
    state.matching.modelDropdownOpen = false;
    const targetModelName = (state.repo.records || []).find((r) => r.id === recordId)?.model || '所选型号';

    if (repoEngineMemoryCache.has(recordId)) {
      const cached = repoEngineMemoryCache.get(recordId);
      state.inspector.engine = cached.inspectEngine;
      state.inspector.selectedRecordId = firstSectionRecord(cached.inspectEngine)?.id || null;
      state.sourcePreview = cached.preview;
      state.matching.template = cached.targetTpl;
      state.matching.templateEngine = cached.tplEngine;
      state.matching.result = cached.matchResult;
      state.matching.selectedSectionNumber = 1;

      if (!state.review.session || state.review.session.sourceEngine !== cached.inspectEngine) {
        state.review.session = initReviewSession({
          sourceEngine: cached.inspectEngine,
          matchResult: cached.matchResult,
          templateEngine: cached.tplEngine,
          productModel: cached.matchResult?.summary?.productName || cached.inspectEngine.sourceName || '',
          templateName: cached.targetTpl,
        });
      }
      if (cached.annotations && state.review.session) {
        state.review.session.annotations = cached.annotations;
      }

      state.repo.activeRecordId = recordId;
      state.view = 'matching';
      renderApp();
      showToast(`⚡ 瞬间呈现【${targetModelName}】三屏通览！`, 'success');
      return;
    }

    // 1. 读取记录详情 (优先消费本地缓存)
    let record = repoRecordMemoryCache.get(recordId);
    if (!record) {
      const recRes = await fetch(`/api/msds/repo/records/${recordId}`).then((r) => r.json());
      if (!recRes.success || !recRes.data) {
        throw new Error(recRes.error?.message || recRes.error || '获取记录详情失败');
      }
      record = recRes.data;
      repoRecordMemoryCache.set(recordId, record);
    }

    const targetTpl = record.target_template || 'CN 冠志';
    state.matching.template = targetTpl;
    state.matching.selectedSectionNumber = 1;

    // 2. 并行拉取源 DOCX 与预热模板 (消除串行等待瀑布流)
    const [docxBlob] = await Promise.all([
      fetch(`/api/msds/repo/records/${recordId}/docx`).then((r) => {
        if (!r.ok) throw new Error('拉取源 DOCX 二进制失败');
        return r.blob();
      }),
      fetchTemplate(targetTpl),
    ]);
    const docxArrayBuffer = await docxBlob.arrayBuffer();

    // 3. 装配源引擎
    const inspectEngine = await loadDocx(docxArrayBuffer, record.file_name);
    state.inspector.engine = inspectEngine;
    state.inspector.selectedRecordId = firstSectionRecord(inspectEngine)?.id || null;

    if (state.sourcePreview?.blobUrl) {
      try { URL.revokeObjectURL(state.sourcePreview.blobUrl); } catch {}
    }
    const blobUrl = URL.createObjectURL(docxBlob);
    state.sourcePreview = {
      name: record.file_name,
      type: 'docx',
      blobUrl,
      file: null,
    };

    // 4. 版本感知自愈：若记录算法版本落后于当前版本 (如 < 1.4.0)，自动使用最新引擎重跑，杜绝旧快照污染！
    const isOutdated = !record.engine_version || record.engine_version !== APP_VERSION;
    let effectiveMatchResult = record.matchResult;
    if (isOutdated && inspectEngine) {
      effectiveMatchResult = runSmartMatching(inspectEngine.records);
      record.matchResult = effectiveMatchResult;
      record.engine_version = APP_VERSION;
      // 异步通知后端刷新库中记录
      fetch(`/api/msds/repo/records/${recordId}/rematch`, { method: 'POST' }).catch(() => {});
    }

    await syncMatchingEngine(targetTpl, effectiveMatchResult);

    // 5. 恢复历史批注
    if (state.review.session) {
      state.review.session.annotations = (record.annotations && record.annotations.length > 0) ? record.annotations : [];
    }

    // 写入内存池，后续切换 0ms 瞬间呈现
    repoEngineMemoryCache.set(recordId, {
      inspectEngine,
      tplEngine: state.matching.templateEngine,
      preview: { ...state.sourcePreview },
      targetTpl,
      matchResult: state.matching.result,
      annotations: record.annotations || [],
    });

    state.repo.activeRecordId = recordId;
    state.view = 'matching';
    renderApp();
    showToast(`已就绪【${record.model || record.file_name}】三屏通览！`, 'success');
  } catch (err) {
    showToast(`载入三屏通览失败: ${err.message}`, 'error');
  }
}

async function rematchRepoRecord(recordId) {
  try {
    showToast('正在使用最新匹配算法重新对标该样本...', 'info');
    const res = await fetch(`/api/msds/repo/records/${recordId}/rematch`, { method: 'POST' }).then((r) => r.json());
    if (!res.success) throw new Error(res.error || '重新匹配失败');
    showToast(`重新匹配完成！覆盖率: ${res.data.summary.matchScore}%`, 'success');
    repoRecordMemoryCache.delete(recordId);
    repoEngineMemoryCache.delete(recordId);
    await fetchRepoData();
  } catch (err) {
    showToast(`重新匹配失败: ${err.message}`, 'error');
  }
}

async function deleteRepoRecord(recordId) {
  if (!window.confirm('确定要从数据库中删除该 MSDS 样本及其原件吗？此操作不可逆。')) return;
  try {
    const res = await fetch(`/api/msds/repo/records/${recordId}`, { method: 'DELETE' }).then((r) => r.json());
    if (!res.success) throw new Error(res.error || '删除失败');
    showToast('记录已成功删除。', 'success');
    if (state.repo.activeRecordId === recordId) state.repo.activeRecordId = null;
    await fetchRepoData();
  } catch (err) {
    showToast(`删除失败: ${err.message}`, 'error');
  }
}

async function batchRematchRepo(batchId = state.repo.selectedBatchId) {
  const targetDesc = batchId === 'all' ? '全库所有样本' : '当前所选批次样本';
  if (!window.confirm(`确定要使用最新算法引擎对【${targetDesc}】执行全量回归重匹配吗？`)) return;
  try {
    showToast('正在批量重跑智能匹配，请稍候...', 'info');
    const res = await fetch(`/api/msds/repo/batch/${batchId}/rematch`, { method: 'POST' }).then((r) => r.json());
    if (!res.success) throw new Error(res.error || '批量重匹配失败');
    showToast(`全量回归重匹配完成！已重新计算 ${res.updatedCount} 份 MSDS。`, 'success');
    await fetchRepoData();
  } catch (err) {
    showToast(`批量重匹配失败: ${err.message}`, 'error');
  }
}

function downloadRepoDocx(recordId, fileName = 'msds_source.docx') {
  const link = document.createElement('a');
  link.href = `/api/msds/repo/records/${recordId}/docx`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderBatchImportModal() {
  if (!state.repo.batchModalOpen) return '';

  const progress = state.repo.batchImportProgress;

  return `
    <div class="modal-backdrop">
      <div class="modal-card batch-import-modal">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-icon">▤</span>
            <h2>批量导入 MSDS 与自动化识别匹配</h2>
          </div>
          <button class="modal-close" data-action="close-batch-import-modal">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-desc">
            选择本地文件夹路径或直接上传多个 MSDS DOCX 文件。系统将在后台调用识别与智能匹配引擎，将结构化事实与匹配结果完整入库，生成长久可复用的金标测试集。
          </p>

          <div class="batch-field-group">
            <label class="field-label" for="batch-input-name">批次名称 (可选)：</label>
            <input type="text" id="batch-input-name" class="field-input" placeholder="例如：2026-10 聚氨酯系列批次回归测试" value="${escapeHtml(state.repo.batchNameInput || '')}" />
          </div>

          <div class="batch-field-group">
            <label class="field-label" for="batch-input-template">目标对标模板：</label>
            <select id="batch-input-template" class="field-select">
              <option value="CN 冠志" ${state.repo.batchTargetTemplate === 'CN 冠志' ? 'selected' : ''}>CN 冠志</option>
              <option value="EN 冠志" ${state.repo.batchTargetTemplate === 'EN 冠志' ? 'selected' : ''}>EN 冠志</option>
            </select>
          </div>

          <div class="batch-import-tabs">
            <div class="batch-tab-item active">摄入方式 1：服务端/本地目录极速扫描 (推荐)</div>
          </div>

          <div class="batch-section-box">
            <label class="field-label" for="batch-input-dir">扫描文件夹绝对路径：</label>
            <input type="text" id="batch-input-dir" class="field-input" placeholder="例如：F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\问题研究报告" value="${escapeHtml(state.repo.batchScanDir || '')}" />
            <div class="checkbox-row" style="margin-top:8px;">
              <label><input type="checkbox" id="batch-input-recursive" ${state.repo.batchRecursive ? 'checked' : ''} /> 递归扫描子文件夹中的所有 .docx 文件</label>
            </div>
            <p class="field-hint">直接在服务端高速并发读取并解析磁盘中的 DOCX 文档，无需经过浏览器上传，适合百级大规模批量导入与回归测试。</p>
          </div>

          <div class="batch-divider"><span>或通过浏览器上传文件</span></div>

          <div class="batch-section-box">
            <label class="field-label">本地文件多选上传：</label>
            <input type="file" id="batch-file-selector" multiple accept=".docx" class="field-file-input" />
            <p class="field-hint">支持按住 Ctrl/Shift 选取多个本地 .docx 文件一次性批量上传并解析。</p>
          </div>

          ${progress ? `
            <div class="batch-progress-box">
              <div class="progress-status">正在批量处理中 (${progress.processed || 0}/${progress.total || 0})...</div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${progress.total ? Math.round((progress.processed / progress.total) * 100) : 0}%"></div>
              </div>
              <div class="progress-current">${escapeHtml(progress.current || '')}</div>
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <button class="button button-quiet" data-action="close-batch-import-modal">取消</button>
          <button class="button button-primary" data-action="submit-batch-import" style="background:#0891b2;border-color:#0891b2;color:#fff;font-weight:700;">
            开始批量导入并匹配
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  // 保存当前原版式视口的实际滚动像素位置，防止 DOM 替换后滚动条弹回顶部
  root.querySelectorAll('.docx-preview-shell[data-preview]').forEach((el) => {
    if (el.dataset.preview && el.scrollTop > 0) {
      state.previewScrollPositions[el.dataset.preview] = el.scrollTop;
    }
  });

  let content = '';
  try {
    if (state.view === 'inspect') content = renderInspector();
    else if (state.view === 'matching') content = renderMatching();
    else content = renderEditor();
  } catch (renderError) {
    console.error('renderApp failed:', renderError);
    content = `
      <div class="empty-workspace" style="padding:40px;text-align:center;">
        <h1 style="color:#ef4444;">⚠️ 视图渲染异常</h1>
        <p style="color:#64748b;margin:12px 0;">${escapeHtml(renderError.message || String(renderError))}</p>
        <pre style="background:#0f172a;color:#f87171;padding:16px;border-radius:8px;max-width:800px;margin:16px auto;text-align:left;overflow:auto;font-size:12px;">${escapeHtml(renderError.stack || '')}</pre>
        <button class="button button-primary" onclick="window.location.reload()">重新载入工作台</button>
      </div>
    `;
  }

  root.innerHTML = `${navMarkup()}<main class="page-shell ${state.view === 'matching' ? 'matching-shell' : ''}">${content}</main>${toastMarkup()}${renderAnnotationDrawer()}${renderAnnotationModal()}${renderUnifiedExportModal()}${renderPresetManagerModal()}${renderVersionModal()}${renderBatchImportModal()}`;
  bindEvents();
  if (lastFocusedModalControlSelector) {
    const selToRestore = lastFocusedModalControlSelector;
    window.requestAnimationFrame(() => {
      const el = root.querySelector(selToRestore);
      if (el) {
        try { el.focus(); } catch (_) {}
      }
    });
  }
  window.requestAnimationFrame(renderPreviews);
}

function renderInspector() {
  const engine = state.inspector.engine;
  if (!engine) return `${headerBand('DOCX 识别工作区', '01 / DOCUMENT INSPECTOR', '导入源文件，逐 Section 核对结构、版式与识别覆盖率。')}${emptyWorkspace('inspect')}`;
  const records = tableRecords(engine);
  const selected = selectedRecord(engine, state.inspector.selectedRecordId);
  if (selected) state.inspector.selectedRecordId = selected.id;
  const query = state.inspector.query.trim().toLowerCase();
  const visibleRecords = records.filter((record) => !query || record.searchText.toLowerCase().includes(query));
  const selectedVisible = visibleRecords.find((record) => record.id === selected?.id) || visibleRecords[0] || selected;
  if (selectedVisible) state.inspector.selectedRecordId = selectedVisible.id;
  const selectedCell = findCellById(selectedVisible, state.inspector.selectedCellId);
  return `
    ${headerBand('DOCX 识别', '', '', `
      <button class="button ${state.inspector.showPreview ? 'button-dark' : 'button-quiet'}" data-action="toggle-inspect-preview" title="折叠/展开右侧 DOCX 原版式预览">
        <span>▤</span> ${state.inspector.showPreview ? '收起原版式' : '展开原版式'}
      </button>
      <button class="button button-quiet" data-action="pick-inspect">重新导入</button>
      <button class="button button-dark" data-action="export-json">导出 JSON</button>
      <button class="button button-primary" data-action="start-matching" style="background:#0891b2;border-color:#0891b2;color:#fff;font-weight:700;">投入智能匹配 ➔</button>
    `)}
    <div class="file-ribbon" data-dropzone="inspect" title="也可以把 .docx 拖到这里">
      <div class="file-ribbon-icon">DOCX</div><div class="file-ribbon-copy"><strong>${escapeHtml(sourceFileName(engine))}</strong><span>已解析 16 个 Section，可直接投入智能匹配进行标准化归类</span></div>
      <div class="file-ribbon-coverage"><span class="pulse-dot"></span>${records.filter((record) => record.sectionNumber).length}/16</div>
      <button class="button button-quiet button-sm" data-action="start-matching" style="margin-left:12px;height:26px;padding:0 10px;font-size:11px;color:var(--cyan);border-color:rgba(91,214,210,.3);">投入智能匹配 ➔</button>
    </div>
    <div class="inspector-layout ${state.inspector.showPreview ? '' : 'inspector-hide-preview'}">
      <aside class="side-panel inspector-side">
        <div class="side-heading" data-toolbar-scope="editor-section-heading"><h2>Section</h2><span class="side-count">${records.length}</span></div>
        <label class="search-box"><span>⌕</span><input id="inspect-search" type="search" placeholder="搜索标签、GHS、产品名…" value="${escapeHtml(state.inspector.query)}" /><kbd>⌘ K</kbd></label>
        <div class="section-list">${sectionNav(records, state.inspector.selectedRecordId, query, 'inspect')}${visibleRecords.filter((record) => !record.sectionNumber).map((record) => recordNavItem(record, state.inspector.selectedRecordId, 'extra')).join('')}</div>
      </aside>
      <section class="content-panel structured-panel">
        <div class="panel-heading"><h2>${escapeHtml(selectedVisible?.title || '未找到匹配记录')}</h2><div class="heading-pills"><span class="pill pill-blue">${selectedVisible ? sectionLabel(selectedVisible.sectionNumber) : '—'}</span><span class="pill">${selectedVisible?.rows?.length || 0} 行</span></div></div>
        ${selectedVisible ? renderStructuredTable(selectedVisible, selectedCell) : `<div class="no-results"><span>⌕</span><strong>没有匹配的识别记录</strong><p>尝试清空搜索词，或换一个 Section / GHS 关键词。</p></div>`}
      </section>
      ${state.inspector.showPreview ? `
      <aside class="right-stack">
        <section class="preview-panel"><div class="panel-heading compact"><h2>原版式</h2>${renderZoomBar('inspect', state.inspector.zoomScale || 'fit')}<span class="preview-lock">只读</span></div><div class="docx-preview-shell" data-preview="inspect" data-zoom-mode="${state.inspector.zoomScale || 'fit'}"><div class="preview-loading"><span class="spinner"></span></div></div></section>
      </aside>` : ''}
    </div>
  `;
}

function sectionNav(records, selectedId, query, mode, engine = null) {
  let hfNavItem = '';
  if (mode === 'editor') {
    const isHfSelected = selectedId === '__header_footer__';
    const hf = engine?.headerFooterData || (engine ? extractHeaderFooterData(engine) : null);
    const modelBadge = hf?.model ? escapeHtml(hf.model) : '待配置';
    hfNavItem = `
      <button class="section-nav-row hf-nav-row ${isHfSelected ? 'active' : ''}" data-record-id="__header_footer__">
        <span class="section-index hf-index">00</span>
        <span class="hf-nav-label">页眉与页脚 (Header & Footer)</span>
        <i class="hf-model-badge">${modelBadge}</i>
      </button>
    `;
  }
  const bodyNavItems = Array.from({ length: 16 }, (_, index) => {
    const section = index + 1;
    const record = records.find((item) => item.sectionNumber === section);
    const visible = !query || record?.searchText?.toLowerCase().includes(query);
    if (!record) return `<div class="section-nav-row missing"><span class="section-index">${String(section).padStart(2, '0')}</span><span>Section ${section}</span><i>缺失</i></div>`;
    if (!visible) return `<div class="section-nav-row filtered"><span class="section-index">${String(section).padStart(2, '0')}</span><span>Section ${section}</span><i>过滤</i></div>`;
    return recordNavItem(record, selectedId, mode);
  }).join('');
  return hfNavItem + bodyNavItems;
}

function recordNavItem(record, selectedId, extra = '') {
  return `<button class="section-nav-row ${record.id === selectedId ? 'active' : ''} ${extra}" data-record-id="${escapeHtml(record.id)}"><span class="section-index">${String(record.sectionNumber || '•').padStart(2, '0')}</span><span>${escapeHtml(record.title.replace(/^\d+[\.、]?\s*/, '').slice(0, 28))}</span><i>${record.rows ? `${record.rows.length} 行` : '正文'}</i></button>`;
}

function findCellById(record, id) {
  if (!record || !id) return null;
  const [recordId, row, col] = id.split(':');
  return record.id === recordId ? getCell(record, row, col) : null;
}


function cloneParagraph(paragraph) {
  return {
    ...paragraph,
    runs: (paragraph.runs || []).map((run) => ({ ...run, images: [...(run.images || [])] })),
  };
}

function cellHasLabel(cell) {
  return Boolean(cell.labelText?.trim()) || /^[^：:\n]{1,100}[：:]$/.test(cell.text?.trim() || '');
}

function isContinuationRow(row) {
  if (row.index === 0 || !row.cells.some((cell) => cell.text?.trim())) return false;
  if (row.cells.some(cellHasLabel)) return false;
  const firstCellEmpty = !row.cells[0]?.text?.trim();
  const valueCells = row.cells.slice(1).filter((cell) => cell.text?.trim());
  return firstCellEmpty && valueCells.length === 1;
}

function hasLabelValueStructure(row) {
  const hasLabel = row.cells.some(cellHasLabel);
  const hasValue = row.cells.some((cell) => cell.valueText?.trim() && !cellHasLabel(cell));
  return hasLabel && hasValue;
}

function appendContinuation(targetCell, sourceCell) {
  const sourceParagraphs = (sourceCell.paragraphs || []).map(cloneParagraph);
  if (!sourceParagraphs.length) return;
  if (!targetCell.paragraphs?.length) targetCell.paragraphs = [];
  const targetParagraph = targetCell.paragraphs[targetCell.paragraphs.length - 1];
  const sourceFirst = sourceParagraphs.shift();
  if (targetParagraph?.runs?.length && sourceFirst?.runs?.length) {
    const firstRun = sourceFirst.runs[0];
    targetParagraph.runs[targetParagraph.runs.length - 1].text = `${targetParagraph.runs[targetParagraph.runs.length - 1].text || ''} ${firstRun.text || ''}`;
    targetParagraph.runs.push(...sourceFirst.runs.slice(1));
    targetParagraph.text = targetParagraph.runs.map((run) => run.text || '').join('');
  } else if (sourceFirst) {
    targetCell.paragraphs.push(sourceFirst);
  }
  targetCell.paragraphs.push(...sourceParagraphs);
}

function isEmptyRow(row) {
  if (row.index === 0) return false;
  return row.cells.every((cell) => {
    const text = (cell.text || cell.rawText || '').replace(/[\s\u00a0\u200b\ufeff]/g, '');
    const hasImages = (cell.images?.length || 0) > 0;
    return text.length === 0 && !hasImages;
  });
}

function paragraphHasLabelOrSeq(paragraph, cell) {
  if (!paragraph) return false;
  const raw = paragraph.rawText?.trim() || '';
  const num = paragraph.numberingText?.trim() || '';
  if (num) return true;
  if (/^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(raw)) return true;
  if (/^[^\n：:]{1,80}[：:]/.test(raw)) return true;
  return (paragraph.runs || []).some((run) => run.bold && run.text?.trim());
}

function isMultiLabelRow(row) {
  if (row.index === 0 || !row.cells || row.cells.length < 2) return false;
  const cell0 = row.cells[0];
  if (!cell0.paragraphs || cell0.paragraphs.length < 2) return false;
  const labelParaCount = cell0.paragraphs.filter((p) => paragraphHasLabelOrSeq(p, cell0)).length;
  return labelParaCount >= 2;
}

function splitMultiLabelRow(row, baseIndex) {
  const pCount = row.cells[0].paragraphs.length;
  const splitRows = [];
  for (let i = 0; i < pCount; i++) {
    const labelPara = row.cells[0].paragraphs[i];
    const newCell0 = {
      ...row.cells[0],
      row: baseIndex + i,
      paragraphs: [labelPara],
      text: labelPara.text || labelPara.rawText || '',
    };
    Object.assign(newCell0, cellRole(newCell0));

    const newCells = [newCell0];
    for (let c = 1; c < row.cells.length; c++) {
      const origCell = row.cells[c];
      const valPara = origCell.paragraphs && origCell.paragraphs[i] ? [origCell.paragraphs[i]] : [];
      const newCellVal = {
        ...origCell,
        row: baseIndex + i,
        paragraphs: valPara,
        text: valPara.map((p) => p.text || p.rawText || '').join('\n').trim(),
      };
      Object.assign(newCellVal, cellRole(newCellVal));
      newCells.push(newCellVal);
    }

    splitRows.push({
      ...row,
      index: baseIndex + i,
      cells: newCells,
    });
  }
  return splitRows;
}

function logicalTableRows(record) {
  const result = [];
  let currentRowIndex = 0;
  const activeMerges = new Map(); // col -> remainingSpan

  for (const sourceRow of record.rows) {
    const row = { ...sourceRow, cells: sourceRow.cells.map((cell) => ({ ...cell, paragraphs: (cell.paragraphs || []).map(cloneParagraph) })) };
    const hasActiveCover = Array.from(activeMerges.values()).some((rem) => rem > 0);
    if (isEmptyRow(row) && !hasActiveCover) {
      continue;
    }

    // 更新 activeMerges 计数
    for (const [col, rem] of Array.from(activeMerges.entries())) {
      if (rem <= 1) activeMerges.delete(col);
      else activeMerges.set(col, rem - 1);
    }
    for (const cell of row.cells) {
      if (cell.rowspan > 1) {
        activeMerges.set(cell.col, cell.rowspan - 1);
      }
    }

    if (isContinuationRow(row) && result.length && hasLabelValueStructure(result[result.length - 1])) {
      const targetRow = result[result.length - 1];
      const sourceCell = [...row.cells].reverse().find((cell) => cell.text?.trim());
      const targetCell = [...targetRow.cells].reverse().find((cell) => cell.valueNodes?.length || !cell.labelText);
      if (sourceCell && targetCell) {
        appendContinuation(targetCell, sourceCell);
        continue;
      }
    }
    if (isMultiLabelRow(row)) {
      const subRows = splitMultiLabelRow(row, currentRowIndex);
      for (const subRow of subRows) {
        result.push(subRow);
        currentRowIndex++;
      }
      continue;
    }
    row.index = currentRowIndex;
    result.push(row);
    currentRowIndex++;
  }
  return result;
}


function getAnnotationsForCell(sectionNumber, rowIndex, colIndex) {
  if (!state.review?.session?.annotations?.length) return [];
  return state.review.session.annotations.filter((a) => {
    if (a.anchor?.sectionNumber !== Number(sectionNumber)) return false;
    if (a.anchor?.rowIndex !== Number(rowIndex)) return false;
    if (colIndex != null && a.anchor?.cellIndex != null && Number(a.anchor.cellIndex) !== Number(colIndex) && a.anchor.kind === 'cell') return false;
    return true;
  });
}

function renderAnnotationBadgesMarkup(annotations = []) {
  if (!annotations || !annotations.length) return '';
  return annotations.map((a) => {
    const isResolved = a.status === 'resolved';
    const cls = isResolved ? 'ann-badge-resolved' : `ann-badge-${a.severity}`;
    const icon = isResolved ? '✓' : (a.severity === 'blocker' ? '⛔' : a.severity === 'error' ? '❌' : a.severity === 'warning' ? '⚠️' : 'ℹ️');
    return `<span class="ann-badge ${cls}" data-ann-id="${a.annotationId}" title="${escapeHtml(a.title)}: ${escapeHtml(a.comment)}">${icon} ${escapeHtml(a.category)}</span>`;
  }).join('');
}

function renderStructuredTable(record, selectedCell, customRoleStyles = null) {
  const selectedId = selectedCell ? cellId(record, selectedCell) : '';
  const width = (record.structure?.gridWidthsTwips || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const tableStyle = sourceTableStyle(record);
  const fallbackGrid = needsFallbackGrid(record);
  const isHeaderFooter = Boolean(record?.part && /^word\/(?:header|footer)/i.test(record.part) || record?.section?.includes('页眉') || record?.section?.includes('页脚'));
  const roleStyles = isHeaderFooter ? null : (customRoleStyles !== null ? customRoleStyles : (state.inspector.engine?.roleStyles || null));
  const renderedRows = logicalTableRows(record);
  const totalRenderedRows = renderedRows.length;

  return `<div class="table-scroll"><table class="structured-table ${isHeaderFooter ? 'header-footer-table' : ''}" style="${tableStyle}">${sourceColumnMarkup(record)}<tbody>${renderedRows.map((row, rIdx) => {
    const maxAllowedSpan = Math.max(1, totalRenderedRows - rIdx);
    return `<tr class="${row.index === 0 ? 'title-row' : ''}" style="${sourceRowStyle(row)}" data-anchor-section="${record.sectionNumber || ''}" data-anchor-row="${row.index}">${row.cells.map((cell) => {
      const effSpan = Math.min(Number(cell.rowspan) || 1, maxAllowedSpan);
      const cellAnns = getAnnotationsForCell(record.sectionNumber, row.index, cell.col);
      const badges = renderAnnotationBadgesMarkup(cellAnns);
      const annTrigger = !isHeaderFooter && row.index > 0
        ? `<button type="button" class="ann-trigger-btn" data-action="open-add-ann" data-sec="${record.sectionNumber || ''}" data-row="${row.index}" data-col="${cell.col}" title="添加批注">💬</button>`
        : '';
      return `<td colspan="${cell.colspan}" rowspan="${effSpan}" class="${selectedId === cellId(record, cell) ? 'selected-cell' : ''}" style="${sourceCellStyle(cell, width, fallbackGrid, record)}" data-anchor-section="${record.sectionNumber || ''}" data-anchor-row="${row.index}" data-anchor-col="${cell.col}" data-anchor-role="${cell.role || (cell.labelText ? 'label' : 'value')}">${renderCellContent(cell, selectedId, record, roleStyles, row)}${badges}${annTrigger}</td>`;
    }).join('')}</tr>`;
  }).join('')}</tbody></table></div>`;
}

const SECTION_TITLES = [
  '物料及供应商标识', '危险性概述', '成分/组成资料', '急救措施',
  '消防措施', '泄漏应急处理', '操作处置与储存', '接触控制/个体防护',
  '理化特性', '稳定性和反应性', '毒理学信息', '生态学信息',
  '废弃处置', '运输信息', '法规信息', '其他信息',
];

async function syncMatchingEngine(templateName = state.matching.template || 'CN 冠志', presetMatchResult = null) {
  if (!state.inspector.engine && !presetMatchResult) return null;
  state.matching.template = templateName;
  // 核心优化：直接复用数据库持久化的 matchResult，严禁浪费 CPU 重算！
  const result = presetMatchResult || (state.inspector.engine ? runSmartMatching(state.inspector.engine.records) : null);
  if (!result) return null;
  state.matching.result = result;
  const tplEngine = await fetchTemplate(templateName);
  applyMatchResultToEditor(result, tplEngine);
  state.matching.templateEngine = tplEngine;

  // 初始化或同步审阅会话
  if (!state.review.session || state.review.session.sourceEngine !== state.inspector.engine) {
    state.review.session = initReviewSession({
      sourceEngine: state.inspector.engine,
      matchResult: result,
      templateEngine: tplEngine,
      productModel: result.summary?.productName || state.inspector.engine.sourceName || '',
      templateName,
    });
  }
  return tplEngine;
}


function renderMatchingEmbeddedWorkspace() {
  const stats = state.repo.stats || { totalRecords: 0, perfectCount: 0, conflictCount: 0, unmatchedCount: 0, annotatedCount: 0, batchCount: 0 };
  const records = state.repo.records || [];
  const batches = state.repo.batches || [];
  const selectedBatch = state.repo.selectedBatchId || 'all';
  const statusFilter = state.repo.statusFilter || 'all';

  return `
    <div class="matching-embedded-repo-shell">
      <div class="embedded-repo-intro">
        <div class="embedded-repo-intro-copy">
          <h2><span>⇄</span> 智能匹配 · 数据库工作台</h2>
          <p>当前记录库共有 <strong>${stats.totalRecords || 0}</strong> 份 MSDS 识别与匹配记录。点击任意样本即可直接激活<strong>三屏通览</strong>，或批量摄入新样本形成评测基准。</p>
        </div>
        <div class="embedded-repo-actions">
          <button class="button button-quiet" data-action="go-inspect">
            <span>⌁</span> 导入单个 DOCX
          </button>
          <button class="button button-quiet" data-action="repo-batch-rematch" title="使用最新匹配引擎重跑全库">
            <span>⚡</span> 算法回归 Rematch
          </button>
          <button class="button button-primary" data-action="open-batch-import-modal" style="background:#0891b2;border-color:#0891b2;color:#fff;font-weight:700;">
            <span>+</span> 批量导入 MSDS
          </button>
        </div>
      </div>

      <div class="repo-stats-row">
        <div class="repo-stat-card">
          <div class="repo-stat-label">总样本数</div>
          <div class="repo-stat-value">${stats.totalRecords || 0}</div>
          <div class="repo-stat-desc">已入库实例</div>
        </div>
        <div class="repo-stat-card stat-good">
          <div class="repo-stat-label">完美对齐</div>
          <div class="repo-stat-value">${stats.perfectCount || 0}</div>
          <div class="repo-stat-desc">完全对标无冲突</div>
        </div>
        <div class="repo-stat-card stat-danger">
          <div class="repo-stat-label">存在冲突</div>
          <div class="repo-stat-value">${stats.conflictCount || 0}</div>
          <div class="repo-stat-desc">多源冲突待复核</div>
        </div>
        <div class="repo-stat-card stat-warning">
          <div class="repo-stat-label">未对标项</div>
          <div class="repo-stat-value">${stats.unmatchedCount || 0}</div>
          <div class="repo-stat-desc">源行未匹配</div>
        </div>
        <div class="repo-stat-card">
          <div class="repo-stat-label">审阅批注</div>
          <div class="repo-stat-value">${stats.annotatedCount || 0}</div>
          <div class="repo-stat-desc">人工/Agent批注</div>
        </div>
        <div class="repo-stat-card">
          <div class="repo-stat-label">测试批次</div>
          <div class="repo-stat-value">${stats.batchCount || 0}</div>
          <div class="repo-stat-desc">独立评测批次</div>
        </div>
      </div>

      <div class="repo-toolbar">
        <div class="repo-filter-group">
          <div class="repo-batch-select-wrap">
            <label for="repo-batch-select">批次：</label>
            <select id="repo-batch-select">
              <option value="all" ${selectedBatch === 'all' ? 'selected' : ''}>全部批次 (${stats.totalRecords || 0})</option>
              ${batches.map((b) => `
                <option value="${b.id}" ${selectedBatch === b.id ? 'selected' : ''}>${escapeHtml(b.name)} (${b.record_count} 份)</option>
              `).join('')}
            </select>
          </div>
          <div class="repo-status-tabs">
            <button type="button" class="repo-status-tab ${statusFilter === 'all' ? 'active' : ''}" data-status="all">全部</button>
            <button type="button" class="repo-status-tab ${statusFilter === 'perfect' ? 'active' : ''}" data-status="perfect">✓ 完美对齐</button>
            <button type="button" class="repo-status-tab ${statusFilter === 'conflict' ? 'active' : ''}" data-status="conflict">⚠ 存在冲突</button>
            <button type="button" class="repo-status-tab ${statusFilter === 'unmatched' ? 'active' : ''}" data-status="unmatched">? 未对标</button>
            <button type="button" class="repo-status-tab ${statusFilter === 'annotated' ? 'active' : ''}" data-status="annotated">💬 含批注</button>
          </div>
        </div>
        <label class="search-box" style="margin:0;width:280px;">
          <span>⌕</span>
          <input id="repo-search-input" type="search" placeholder="按型号、文件名搜索..." value="${escapeHtml(state.repo.query)}" />
        </label>
      </div>

      <div class="repo-grid">
        ${records.map((r) => {
          let badgeHtml = '<span class="repo-badge badge-good">✓ 完美对齐</span>';
          if (r.status_badge === 'conflict') {
            badgeHtml = `<span class="repo-badge badge-danger">⚠ 冲突 ${r.review_ambiguous_fields} 项</span>`;
          } else if (r.status_badge === 'unmatched') {
            badgeHtml = `<span class="repo-badge badge-warning">? 未对标 ${r.unmatched_fields} 项</span>`;
          }

          return `
            <div class="repo-card" data-record-id="${r.id}">
              <div class="repo-card-header">
                <div class="repo-card-title-group">
                  <span class="repo-card-batch-tag">${escapeHtml(r.batch_name || '默认批次')}</span>
                  <h3 class="repo-card-filename" title="${escapeHtml(r.file_name)}">${escapeHtml(r.file_name)}</h3>
                </div>
                ${badgeHtml}
              </div>

              <div class="repo-card-meta-list">
                <div class="repo-card-meta-item">
                  <span class="meta-label">产品型号</span>
                  <span class="meta-value"><strong>${escapeHtml(r.model || '未提取')}</strong></span>
                </div>
                <div class="repo-card-meta-item">
                  <span class="meta-label">企业主体</span>
                  <span class="meta-value">${escapeHtml(r.entity || '冠志')}</span>
                </div>
                <div class="repo-card-meta-item">
                  <span class="meta-label">目标模板</span>
                  <span class="meta-value">${escapeHtml(r.target_template || 'CN 冠志')}</span>
                </div>
                <div class="repo-card-meta-item">
                  <span class="meta-label">修订日期</span>
                  <span class="meta-value">${escapeHtml(r.revision_date || '—')}</span>
                </div>
              </div>

              <div class="repo-card-metrics">
                <div class="repo-metric-pill" title="对标率"><span class="metric-num">${r.match_score || 0}%</span><span class="metric-title">对标率</span></div>
                <div class="repo-metric-pill" title="对齐字段"><span class="metric-num">${r.matched_fields || 0}</span><span class="metric-title">对齐项</span></div>
                <div class="repo-metric-pill" title="冲突项"><span class="metric-num" style="color:${r.review_ambiguous_fields > 0 ? '#ef4444' : 'inherit'}">${r.review_ambiguous_fields || 0}</span><span class="metric-title">冲突项</span></div>
                <div class="repo-metric-pill" title="未对标"><span class="metric-num" style="color:${r.unmatched_fields > 0 ? '#f59e0b' : 'inherit'}">${r.unmatched_fields || 0}</span><span class="metric-title">未对标</span></div>
                <div class="repo-metric-pill" title="批注"><span class="metric-num" style="color:${r.annotation_count > 0 ? '#06b6d4' : 'inherit'}">${r.annotation_count || 0}</span><span class="metric-title">批注</span></div>
              </div>

              <div class="repo-card-actions">
                <button class="repo-btn repo-btn-primary" data-repo-action="view-three-pane" data-id="${r.id}" title="进入三屏通览查看 DOCX 原版式 + 识别表格 + 标准插槽">
                  <span>⇄</span> 三屏通览
                </button>
                <button class="repo-btn repo-btn-quiet" data-repo-action="rematch" data-id="${r.id}" title="使用最新算法重新计算匹配">
                  <span>↺</span> 重算
                </button>
                <button class="repo-btn repo-btn-accent" data-repo-action="commit-editor" data-id="${r.id}" title="将匹配数据灌入模板编辑器直接定稿导出">
                  <span>✦</span> 编辑
                </button>
                <button class="repo-btn repo-btn-quiet" data-repo-action="download-docx" data-id="${r.id}" data-filename="${escapeHtml(r.file_name)}" title="下载数据库中的原始 DOCX">
                  <span>⇣</span> 原件
                </button>
                <button class="repo-btn repo-btn-danger" data-repo-action="delete" data-id="${r.id}" title="从记录库中删除此记录">
                  <span>✕</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMatching() {
  const inspectEngine = state.inspector.engine;
  const records = state.repo.records || [];
  const selectedSecNum = state.matching.selectedSectionNumber || 1;
  const query = (state.matching.query || '').trim().toLowerCase();
  const modelQuery = (state.matching.modelQuery || '').trim().toLowerCase();

  const filteredModels = records.filter((r) => {
    if (!modelQuery) return true;
    const name = (r.model || r.file_name || '').toLowerCase();
    return name.includes(modelQuery);
  });

  const currentActiveRecord = records.find((r) => r.id === state.repo.activeRecordId);
  const activeModelTitle = currentActiveRecord?.model || (currentActiveRecord?.file_name ? currentActiveRecord.file_name.replace(/\.docx$/i, '') : '切换型号');

  const modelPickerPopoverMarkup = (isCentered = false) => `
    <div class="model-picker-wrap" style="${isCentered ? 'display:inline-block;' : ''}">
      <button class="${isCentered ? 'button button-primary' : 'model-picker-btn'}" data-action="toggle-model-dropdown" title="唤起数据库型号目录，切换查看其他样本">
        <span>▤</span> <strong>${isCentered ? `唤起数据库型号目录 (${records.length}) ▾` : `${escapeHtml(activeModelTitle)} ▾`}</strong>
      </button>

      ${state.matching.modelDropdownOpen ? `
        <div class="dropdown-backdrop-transparent" data-action="close-model-dropdown"></div>
        <div class="model-dropdown-popover" style="${isCentered ? 'left:50%;transform:translateX(-50%);text-align:left;' : ''}" onclick="event.stopPropagation()">
          <div class="model-dropdown-search">
            <input id="popover-model-search" type="search" placeholder="搜索型号…" value="${escapeHtml(state.matching.modelQuery || '')}" />
          </div>
          <div class="model-dropdown-list">
            ${filteredModels.length === 0 ? `
              <div style="padding:12px;text-align:center;color:#94a3b8;font-size:12px;">未找到匹配型号</div>
            ` : filteredModels.map((m) => `
              <button class="model-dropdown-item ${state.repo.activeRecordId === m.id ? 'active' : ''}" data-model-id="${m.id}">
                ${escapeHtml(m.model || m.file_name)}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  if (!inspectEngine) {
    return `
      ${headerBand('智能匹配', '02 / SMART MATCHING', '将非标识别结果匹配进模板标准插槽，呈现三模块同屏对照。')}
      <section class="empty-workspace">
        <h1>请选择或导入 MSDS 进行智能匹配</h1>
        <p>支持从第一步【DOCX 识别】载入源文件，或点击下方按钮唤起数据库型号目录一键切换样本。</p>
        <div class="empty-actions">
          ${modelPickerPopoverMarkup(true)}
          <button class="button button-quiet" data-action="go-inspect">前往 DOCX 识别导入</button>
          <button class="button button-quiet" data-action="open-batch-import-modal"><span>+</span> 批量导入新样本</button>
        </div>
      </section>
    `;
  }

  // 模块一：原始识别记录
  const rawRecord = (inspectEngine.records || []).find((r) => r.kind === 'table' && r.sectionNumber === selectedSecNum);

  // 模块二：标准匹配记录（已填入匹配值的标准模板表格）
  const matchedTemplateRecord = (state.matching.templateEngine?.records || []).find((r) => r.kind === 'table' && r.sectionNumber === selectedSecNum);

  return `
    <div class="matching-shell page-shell">
      <div class="matching-topbar">
        <div class="matching-brand-group">
          <h2 class="matching-title"><span>⇄</span>智能匹配</h2>

          <!-- 顶部按钮唤起型号目录下拉浮层 (零独立窗口，零遮挡) -->
          ${modelPickerPopoverMarkup(false)}

          <div class="matching-template-select-wrap">
            <label for="matching-template-select">选择模板：</label>
            <select id="matching-template-select">
              <option value="CN 冠志" ${state.matching.template === 'CN 冠志' ? 'selected' : ''}>CN 冠志</option>
              <option value="EN 冠志" ${state.matching.template === 'EN 冠志' ? 'selected' : ''}>EN 冠志</option>
            </select>
          </div>
          <!-- 对照模式切换 Tabs -->
          <div class="matching-mode-tabs">
            <button type="button" class="mode-tab ${state.matching.compareMode === 'doc-match' ? 'active' : ''}" data-compare-mode="doc-match" title="DOCX 原版式 (50%) 与标准匹配 (50%) 超宽并排对标">
              <span>▤</span> 原件对标 (DOCX vs 模板)
            </button>
            <button type="button" class="mode-tab ${state.matching.compareMode === 'raw-match' ? 'active' : ''}" data-compare-mode="raw-match" title="原始识别表格 (50%) 与标准匹配 (50%) 对标">
              <span>⌁</span> 数据对标 (表格 vs 模板)
            </button>
            <button type="button" class="mode-tab ${state.matching.compareMode === 'all-three' ? 'active' : ''}" data-compare-mode="all-three" title="原始识别、标准匹配、DOCX原版式三栏同览">
              <span>▤⌁✓</span> 三屏同览
            </button>
          </div>
        </div>
        <div class="matching-actions">
          <button class="button button-quiet button-sm" data-action="toggle-review-drawer" title="查看或管理批注与问题清单"><span>💬</span> 批注 (${(state.review.session?.annotations || []).filter((a) => a.status === 'open').length})</button>
          <button class="button button-dark button-sm" data-action="export-review-bundle" title="导出正式 DOCX 与 Agent 审阅包"><span>📦</span> 导出审阅包</button>
          <button class="button button-quiet button-sm" data-action="re-run-matching">重新匹配</button>
          <button class="button button-primary button-sm" data-action="commit-to-editor" style="background:${((state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 || (state.matching.result?.summary?.unmatchedFields || 0) > 0) ? '#d97706' : '#059669'};border-color:${((state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 || (state.matching.result?.summary?.unmatchedFields || 0) > 0) ? '#d97706' : '#059669'};color:#fff;font-weight:600;">
            ${((state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 || (state.matching.result?.summary?.unmatchedFields || 0) > 0) ? '⚠ 审阅并导入编辑' : '✓ 导入编辑模块'}
          </button>
        </div>
      </div>

      <div class="matching-layout">
        <!-- 侧边栏：100% 原始纯粹 16 章节紧凑导航 -->
        <aside class="side-panel matching-side">
          <div class="side-heading">
            <h2>Section</h2>
            <span class="side-count">16/16</span>
          </div>
          <label class="search-box">
            <span>⌕</span>
            <input id="matching-search" type="search" placeholder="过滤章节…" value="${escapeHtml(state.matching.query)}" />
          </label>
          <div class="section-list">
            ${SECTION_TITLES.map((title, idx) => {
              const secNum = idx + 1;
              const visible = !query || title.toLowerCase().includes(query) || `section ${secNum}`.includes(query);
              if (!visible) return '';
              const active = secNum === selectedSecNum ? 'active' : '';
              return `
                <button class="section-nav-row matching-nav-item ${active}" data-section-num="${secNum}">
                  <span class="section-index">${String(secNum).padStart(2, '0')}</span>
                  <span>${escapeHtml(title)}</span>
                </button>
              `;
            }).join('')}
          </div>
          <div class="side-footer">
            <span class="file-signal"></span>
            <span>标准插槽已装配</span>
          </div>
        </aside>

        <!-- 核心区域：100% 原始横向多态对照网格 -->
        <div class="matching-content-grid matching-grid-${state.matching.compareMode || 'doc-match'} ${state.matching.isWidePreview ? 'preview-expanded' : ''}">
          <!-- 模块：源文件原版式 (在 'doc-match' 和 'all-three' 下展示) -->
          ${state.matching.compareMode !== 'raw-match' ? `
          <div class="matching-col matching-preview-col">
            <div class="matching-col-header">
              <h3><span style="color:var(--blue);">▤</span>源文件原版式</h3>
              ${renderZoomBar('matching', state.matching.zoomScale || 'fit')}
              <span class="preview-lock">只读</span>
            </div>
            <div class="matching-col-scroll no-padding">
              <div class="docx-preview-shell matching-preview" data-preview="matching" data-zoom-mode="${state.matching.zoomScale || 'fit'}">
                <div class="preview-loading"><span class="spinner"></span></div>
              </div>
            </div>
          </div>` : ''}

          <!-- 模块：原始识别结果表格 (在 'raw-match' 和 'all-three' 下展示) -->
          ${state.matching.compareMode !== 'doc-match' ? `
          <div class="matching-col matching-raw-col">
            <div class="matching-col-header">
              <h3><span>⌁</span>原始识别表格</h3>
              <span class="pill">${rawRecord ? `${rawRecord.rows?.length || 0} 行` : '无源表格'}</span>
            </div>
            <div class="matching-col-scroll">
              ${rawRecord
                ? renderStructuredTable(rawRecord, null, state.inspector.engine?.roleStyles)
                : '<div class="no-results" style="min-height:220px;"><span>ℹ</span><strong>源文件中未提取到该章节独立表格</strong></div>'
              }
            </div>
          </div>` : ''}

          <!-- 模块：标准模板匹配结果表格（核心结果，所有模式均展示） -->
          <div class="matching-col matching-standard-col">
            <div class="matching-col-header">
              <h3><span style="color:var(--green);">✓</span>标准匹配 · ${escapeHtml(state.matching.template)}</h3>
              <span class="pill pill-green">${matchedTemplateRecord ? `${matchedTemplateRecord.rows?.length || 0} 行` : '未装配'}</span>
            </div>
            <div class="matching-col-scroll">
              ${matchedTemplateRecord
                ? renderStructuredTable(matchedTemplateRecord, null, state.matching.templateEngine?.roleStyles)
                : '<div class="no-results" style="min-height:220px;"><span>ℹ</span><strong>标准模板中未找到该章节表格</strong></div>'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderEditorToolbarButtons() {
  const openAnnotations = (state.review.session?.annotations || []).filter((a) => a.status === 'open').length;
  if (state.editor.isPresetEditing) {
    return `
      <button class="button button-secondary button-sm" data-action="run-audit" title="运行模板规则合规审计">审计</button>
      <button class="button button-secondary button-sm" data-action="toggle-review-drawer" title="查看或管理批注清单">批注 (${openAnnotations})</button>
      <button class="button button-primary button-sm" data-action="open-unified-export-modal" title="导出已就绪基准与预设交付物">导出</button>
    `;
  }
  return `
    <button class="button button-secondary button-sm" data-action="run-audit" title="运行模板规则合规审计">审计</button>
    <button class="button button-secondary button-sm" data-action="toggle-review-drawer" title="查看或管理批注清单">批注 (${openAnnotations})</button>
    <button class="button button-primary button-sm" data-action="open-unified-export-modal" title="导出已就绪基准与预设交付物">导出</button>
    <button class="button button-quiet button-sm" data-action="open-preset-manager-modal" title="打开预设配置管理中心">预设管理</button>
    <button class="button button-quiet button-sm" data-action="reset-all-template" title="清空修改恢复至初始模板">恢复模板</button>
  `;
}

function renderHeaderFooterEditor(engine, records, query) {
  const hf = engine?.headerFooterData || extractHeaderFooterData(engine) || {};
  const currentExportName = buildExportDocxName(engine, {
    customFileName: state.editor.customFileName,
    templateName: state.editor.template,
    sourcePreviewName: state.sourcePreview?.name,
    productModel: hf.model,
  });

  return `
    ${headerBand('模板编辑器', '', '', renderEditorToolbarButtons())}
    ${renderEditorBanner()}
    <div class="file-ribbon" data-toolbar-scope="editor-file-ribbon" title="内嵌模板工作副本，源模板只读">
      <div class="file-ribbon-icon">模板</div>
      <div class="file-ribbon-copy">
        <strong>${escapeHtml(state.editor.template)}</strong>
        <span class="file-ribbon-name-wrap">
          <span>导出文件名：</span>
          <input id="quick-export-name-input" class="quick-export-name-input" value="${escapeHtml(currentExportName)}" title="直接修改导出文件名，回车或失焦生效" />
          <button class="button button-quiet button-xs" data-action="reset-filename-to-standard" title="恢复标准命名规则" style="padding:1px 6px;height:20px;font-size:11px;">↺</button>
        </span>
      </div>
      ${renderBaselineSelectorMarkup()}
      <label class="toggle-control"><input id="allow-label-edit" type="checkbox" ${state.editor.allowLabelEdit ? 'checked' : ''}><span class="toggle-track"></span><span>特殊情况：允许修改标签文本</span></label>
      <label class="toggle-control"><input id="manage-cell-editability" type="checkbox" ${state.editor.manageCellEditability ? 'checked' : ''}><span class="toggle-track"></span><span>特殊情况：配置值格编辑权限</span></label>
      <div class="file-ribbon-coverage"><span class="pulse-dot"></span>${records.filter((record) => record.sectionNumber).length}/16</div>
    </div>
    <div class="inspector-layout editor-layout">
      <aside class="side-panel editor-side">
        <div class="side-heading" data-toolbar-scope="editor-section-heading"><h2>Section</h2><span class="side-count">${records.filter((record) => record.sectionNumber).length}/16</span></div>
        <label class="search-box"><span>⌕</span><input id="editor-search" type="search" placeholder="搜索标签、序号…" value="${escapeHtml(state.editor.query)}" /><kbd>⌘ K</kbd></label>
        <div class="section-list">${sectionNav(records, state.editor.selectedRecordId, query, 'editor', engine)}</div>
        <div class="side-footer"><span class="file-signal"></span><span>${state.editor.dirty ? '有未导出修改' : '工作副本干净'}</span></div>
      </aside>
      <section class="content-panel editor-content structured-panel">
        <div class="panel-heading hf-heading">
          <div>
            <h2>📑 全局文档标识与页眉页脚管理</h2>
            <p class="hf-sub-desc">统一配置产品型号、版本号、公司主体与修订日期，系统自动同步注入 DOCX 物理页眉页脚并规范导出文件名。</p>
          </div>
          <div class="heading-pills">
            <span class="pill pill-blue">word/header1.xml & footer1.xml</span>
            <button class="button button-quiet button-sm" data-action="reset-hf-to-template" title="恢复模板原始页眉页脚">↺ 恢复模板默认</button>
          </div>
        </div>

        <div class="hf-form-grid">
          <!-- 卡片 1: 页眉 (Header) -->
          <div class="hf-card">
            <div class="hf-card-head">
              <div class="hf-card-icon">⤒</div>
              <div>
                <h3>页眉配置 (Header)</h3>
                <small>对应 DOCX 顶端页眉主标题与右上角产品型号格</small>
              </div>
            </div>
            <div class="hf-card-body">
              <div class="hf-field">
                <label for="hf-title-input">文档主标题 (Title)</label>
                <input type="text" id="hf-title-input" class="form-input" value="${escapeHtml(hf.title || '物料安全数据表')}" placeholder="物料安全数据表 / MATERIAL SAFETY DATA SHEET" />
              </div>
              <div class="hf-field-row">
                <div class="hf-field" style="flex: 2;">
                  <label for="hf-model-input">产品型号 (Product Model) <span class="required-star" style="color:#f28b91;">*</span></label>
                  <input type="text" id="hf-model-input" class="form-input hf-highlight-input" value="${escapeHtml(hf.model || '')}" placeholder="如：OS-1030" />
                  <small class="field-hint" style="color:#8497ad;display:block;margin-top:4px;">与 Header 表格第一行第一格强绑定，同步关联 Footer MSDS 编号与导出文件名</small>
                </div>
                <div class="hf-field" style="flex: 1;">
                  <label for="hf-version-input">版本号 (Version)</label>
                  <input type="text" id="hf-version-input" class="form-input" value="${escapeHtml(hf.version || 'V1.0')}" placeholder="V1.0" />
                </div>
              </div>
              <div class="hf-preview-box">
                <div class="preview-tag">页眉视觉预览 (Header Preview)</div>
                <div class="hf-preview-content header-preview">
                  <div class="hp-left">
                    <div class="hp-title">${escapeHtml(hf.title || '物料安全数据表')}</div>
                    <div class="hp-ver">Version：${escapeHtml((hf.version || 'V1.0').replace(/^Version[：:\s]*/i, ''))}</div>
                  </div>
                  <div class="hp-right">
                    <div class="hp-model-box">${escapeHtml(hf.model || '未设定型号')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 卡片 2: 页脚 (Footer) -->
          <div class="hf-card">
            <div class="hf-card-head">
              <div class="hf-card-icon">⤓</div>
              <div>
                <h3>页脚配置 (Footer)</h3>
                <small>对应 DOCX 底部公司主体、MSDS 编号与修订日期</small>
              </div>
            </div>
            <div class="hf-card-body">
              <div class="hf-field">
                <label for="hf-company-select">发布公司主体 (Company Entity)</label>
                <div class="hf-company-box">
                  <select id="hf-company-select" class="form-select" style="width:100%;padding:6px 10px;background:#0d1d2f;color:#d9e6f5;border:1px solid rgba(142,177,214,.2);border-radius:6px;">
                    <option value="广州冠志新材料科技有限公司" ${hf.company?.includes('冠志') ? 'selected' : ''}>广州冠志新材料科技有限公司 (Guanzhi)</option>
                    <option value="英德市国彩新材料有限公司" ${hf.company?.includes('国彩') ? 'selected' : ''}>英德市国彩新材料有限公司 (Guocai)</option>
                    <option value="custom" ${(!hf.company?.includes('冠志') && !hf.company?.includes('国彩')) ? 'selected' : ''}>其他 / 手动输入公司名称...</option>
                  </select>
                  <input type="text" id="hf-company-input" class="form-input" style="${(hf.company?.includes('冠志') || hf.company?.includes('国彩')) ? 'display:none;' : ''}margin-top:6px;" value="${escapeHtml(hf.company || '')}" placeholder="输入自定义公司全称" />
                </div>
              </div>
              <div class="hf-field-row">
                <div class="hf-field" style="flex: 1;">
                  <label for="hf-doc-code-input">MSDS 识别编码</label>
                  <input type="text" id="hf-doc-code-input" class="form-input" value="${escapeHtml(hf.docCode || (hf.model ? `${hf.model}-MSDS` : ''))}" readonly style="background:#091422;color:#8497ad;" />
                  <small class="field-hint" style="color:#8497ad;display:block;margin-top:4px;">自动根据产品型号生成</small>
                </div>
                <div class="hf-field" style="flex: 1;">
                  <label for="hf-date-input">修订日期 (Revision Date)</label>
                  <div style="display:flex;gap:6px;">
                    <input type="text" id="hf-date-input" class="form-input" value="${escapeHtml(hf.revisionDate || '')}" placeholder="如：2026年10月08日" />
                    <button type="button" class="button button-quiet button-sm" data-action="hf-set-today" title="设为当前系统日期">今日</button>
                  </div>
                </div>
              </div>
              <div class="hf-preview-box">
                <div class="preview-tag">页脚视觉预览 (Footer Preview)</div>
                <div class="hf-preview-content footer-preview">
                  <div class="fp-left">${escapeHtml(hf.company || '广州冠志新材料科技有限公司')} ${escapeHtml(hf.model ? `${hf.model}-MSDS` : 'MSDS')}</div>
                  <div class="fp-right">修订日期：${escapeHtml(hf.revisionDate || 'YYYY年MM月DD日')}</div>
                </div>
                <div class="fp-page-note" style="margin-top:8px;font-size:12px;color:#8497ad;"><span>Word 原生页码域：</span><code style="background:#0a1727;padding:2px 6px;border-radius:4px;color:#5bd6d2;">3 / 5 (PAGE / NUMPAGES 保护保留)</code></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片 3: 导出文件名称管理 (Export Filename Control) -->
        <div class="hf-card hf-filename-fullcard" style="margin-top:16px;">
          <div class="hf-card-head">
            <div class="hf-card-icon">🖹</div>
            <div>
              <h3>导出文件名称管理 (Export Filename Management)</h3>
              <small>行业交付规范: <code>{产品型号} msds_{CN|EN} {冠志|国彩}.docx</code></small>
            </div>
          </div>
          <div class="hf-card-body">
            <div class="hf-field-row">
              <div class="hf-field" style="flex: 3;">
                <label for="hf-export-filename">当前设定导出文件名 (支持直接编辑修改)</label>
                <div style="display:flex;gap:8px;">
                  <input type="text" id="hf-export-filename" class="form-input hf-export-name-field" style="font-weight:600;color:#5bd6d2;" value="${escapeHtml(currentExportName)}" />
                  <button type="button" class="button button-quiet" data-action="reset-filename-to-standard" title="按当前型号与主体重新生成标准规范文件名">↺ 按规则重置</button>
                </div>
              </div>
              <div class="hf-field" style="flex: 1;">
                <label for="hf-lang-select">语言版本</label>
                <select id="hf-lang-select" class="form-select" style="width:100%;padding:6px 10px;background:#0d1d2f;color:#d9e6f5;border:1px solid rgba(142,177,214,.2);border-radius:6px;">
                  <option value="CN" ${hf.language === 'CN' ? 'selected' : ''}>CN (中文版)</option>
                  <option value="EN" ${hf.language === 'EN' ? 'selected' : ''}>EN (英文版)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderEditor() {
  const engine = state.editor.engine;
  if (!engine) return `${headerBand('模板编辑器')}${emptyWorkspace('editor')}`;
  const records = tableRecords(engine);
    const query = state.editor.query.trim().toLowerCase();
  if (state.editor.selectedRecordId === '__header_footer__') {
    return renderHeaderFooterEditor(engine, records, query);
  }
  const selected = selectedRecord(engine, state.editor.selectedRecordId);
  if (selected) state.editor.selectedRecordId = selected.id;
  const errors = auditEngine(engine);
    const visibleRecords = records.filter((record) => !query || record.searchText.toLowerCase().includes(query));
  const selectedVisible = visibleRecords.find((record) => record.id === selected?.id) || visibleRecords[0] || selected;
  if (selectedVisible) state.editor.selectedRecordId = selectedVisible.id;
  return `
    ${headerBand('模板编辑器', '', '', renderEditorToolbarButtons())}
    ${renderEditorBanner()}
    <div class="file-ribbon" data-toolbar-scope="editor-file-ribbon" title="内嵌模板工作副本，源模板只读">
      <div class="file-ribbon-icon">模板</div>
      <div class="file-ribbon-copy">
        <strong>${escapeHtml(state.editor.template)}</strong>
        <span class="file-ribbon-name-wrap">
          <span>导出文件名：</span>
          <input id="quick-export-name-input" class="quick-export-name-input" value="${escapeHtml(buildExportDocxName(engine, { customFileName: state.editor.customFileName, templateName: state.editor.template, sourcePreviewName: state.sourcePreview?.name, productModel: engine.headerFooterData?.model }))}" title="直接修改导出文件名，回车或失焦生效" />
          <button class="button button-quiet button-xs" data-action="reset-filename-to-standard" title="恢复标准命名规则" style="padding:1px 6px;height:20px;font-size:11px;">↺</button>
        </span>
      </div>
      ${renderBaselineSelectorMarkup()}
      <label class="toggle-control"><input id="allow-label-edit" type="checkbox" ${state.editor.allowLabelEdit ? 'checked' : ''}><span class="toggle-track"></span><span>特殊情况：允许修改标签文本</span></label>
      <label class="toggle-control"><input id="manage-cell-editability" type="checkbox" ${state.editor.manageCellEditability ? 'checked' : ''}><span class="toggle-track"></span><span>特殊情况：配置值格编辑权限</span></label>
      <div class="file-ribbon-coverage"><span class="pulse-dot"></span>${records.filter((record) => record.sectionNumber).length}/16</div>
    </div>
    <div class="inspector-layout editor-layout ${state.editor.isWidePreview ? 'preview-expanded' : ''}">
      <aside class="side-panel editor-side">
        <div class="side-heading"><h2>Section</h2><span class="side-count">${records.filter((record) => record.sectionNumber).length}/16</span></div>
        <label class="search-box"><span>⌕</span><input id="editor-search" type="search" placeholder="搜索标签、序号…" value="${escapeHtml(state.editor.query)}" /><kbd>⌘ K</kbd></label>
        <div class="section-list">${sectionNav(records, state.editor.selectedRecordId, query, 'editor', engine)}</div>
        <div class="side-footer"><span class="file-signal"></span><span>${state.editor.dirty ? '有未导出修改' : '工作副本干净'}</span></div>
      </aside>
      <section class="content-panel editor-content structured-panel">
        <div class="panel-heading" data-toolbar-scope="editor-table-heading">
          <h2>${escapeHtml(selectedVisible?.title || '未找到章节')}</h2>
          <div class="heading-pills">
            <span class="pill pill-blue">${selectedVisible ? sectionLabel(selectedVisible.sectionNumber) : '—'}</span>
            <span class="pill">${selectedVisible?.rows?.length || 0} 行</span>
            <button class="button button-quiet button-xs" data-action="reset-current-section" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="仅将当前 Section 恢复至初始模板状态（保留其他 Section 修改）">↺ 恢复本节</button>
            <button class="button button-quiet button-xs" data-table-action="add-note-row" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="在当前节顶部插入单列说明行">＋ 说明行</button>
            <button class="button button-quiet button-xs" data-table-action="add-row" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="在表格末尾追加一行">＋ 追加行</button>
            <button class="button button-danger button-xs btn-clear-section" data-action="clear-current-section-values" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="一键清空当前章节所有单元格内容（支持普通与预设模式）">🗑️ 清空本节填写值</button>
            <span class="pill pill-green">${errors.length ? `${errors.length} 个问题` : '通过'}</span>
          </div>
        </div>
        ${selectedVisible ? renderEditorTable(selectedVisible) : '<div class="no-results">没有可编辑章节</div>'}
      </section>
      <aside class="right-stack ${state.editor.isWidePreview ? 'wide-preview-mode' : ''}">
        <section class="preview-panel">
          <div class="panel-heading compact preview-heading-flex" data-toolbar-scope="editor-preview-heading" style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">
            <div class="preview-tab-group" style="display:inline-flex;background:rgba(255,255,255,0.06);border-radius:6px;padding:2px;gap:2px;">
              <button type="button" class="mode-pill ${state.editor.previewMode !== 'template' ? 'active' : ''}" data-editor-preview-mode="source" title="查看真实源文档原件 (如 PU-2341E)" style="border:none;background:${state.editor.previewMode !== 'template' ? '#0284c7' : 'transparent'};color:${state.editor.previewMode !== 'template' ? '#fff' : '#94a3b8'};padding:2px 8px;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">▤ 源文件原版式</button>
              <button type="button" class="mode-pill ${state.editor.previewMode === 'template' ? 'active' : ''}" data-editor-preview-mode="template" title="查看当前编辑后的模板排版效果" style="border:none;background:${state.editor.previewMode === 'template' ? '#059669' : 'transparent'};color:${state.editor.previewMode === 'template' ? '#fff' : '#94a3b8'};padding:2px 8px;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">📑 模板效果</button>
            </div>
            ${renderZoomBar('editor', state.editor.zoomScale || 'fit')}
            <span class="preview-lock">只读</span>
          </div>
          <div class="docx-preview-shell editor-preview" data-preview="editor" data-zoom-mode="${state.editor.zoomScale || 'fit'}"><div class="preview-loading"><span class="spinner"></span></div></div>
        </section>
        <section class="evidence-panel">
          <div class="panel-heading compact"><h2>审计</h2><span class="audit-badge ${errors.length ? 'bad' : 'good'}">${errors.length ? 'REVIEW' : 'PASS'}</span></div>
          <div class="evidence-grid"><div><span>表格</span><strong>${records.length}</strong></div><div><span>问题</span><strong>${errors.length}</strong></div></div>
          <div class="evidence-divider"></div>
          ${errors.length ? `<div class="warning-heading"><span>待处理</span><span class="text-warn">${errors.length}</span></div><ul class="warning-list">${errors.slice(0, 8).map((error) => `<li><span>!</span>${escapeHtml(error.section)} ${escapeHtml(error.message)}</li>`).join('')}</ul>` : '<div class="clean-message big">✓ 结构通过</div>'}
        </section>
      </aside>
    </div>
  `;
}

function renderEditorTable(record) {
  return renderEditorTableMarkup(record, {
    allowLabelEdit: state.editor.allowLabelEdit,
    manageCellEditability: state.editor.manageCellEditability,
    cellEditableOverrides: state.editor.cellEditableOverrides || {},
    roleStyles: state.editor.engine?.roleStyles || null,
    isPresetMode: state.editor.isPresetEditing,
  });
}

function bindEvents() {
  root.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', async () => {
    const prevView = state.view;
    try {
      state.view = button.dataset.view;
      if (state.view === 'matching') {
        if (!state.inspector.engine) {
          if (state.repo.records && state.repo.records.length > 0 && !state.repo.activeRecordId) {
            const firstRec = state.repo.records[0];
            await loadRepoRecordToInspectAndMatching(firstRec.id);
          }
        } else if (!state.matching.templateEngine) {
          await syncMatchingEngine(state.matching.template || 'CN 冠志');
        }
      } else if (state.view === 'editor') {
        ensureCurrentDraft();
        if (!state.editor.engine) {
          await switchBaselineDraft(state.editor.currentBaselineId || 'baseline_cn_guanzhi');
          return; // switchBaselineDraft 内部已调用 renderApp
        }
      }
      renderApp();
    } catch (err) {
      console.error('View switch failed:', err);
      showToast(`切换视图失败: ${err.message}`, 'error');
      state.view = prevView;
      renderApp();
    }
  }));
  root.querySelectorAll('.section-nav-row[data-record-id]').forEach((button) => button.addEventListener('click', () => {
    if (state.view === 'inspect') {
      state.inspector.selectedRecordId = button.dataset.recordId;
      const rec = recordById(state.inspector.engine, button.dataset.recordId);
      if (rec?.sectionNumber) {
        state.pendingScrollSection.inspect = rec.sectionNumber;
      }
    } else {
      state.editor.selectedRecordId = button.dataset.recordId;
      const rec = recordById(state.editor.engine, button.dataset.recordId);
      if (rec?.sectionNumber) {
        state.pendingScrollSection.editor = rec.sectionNumber;
      }
    }
    renderApp();
  }));
  root.querySelectorAll('[data-cell-id]').forEach((button) => button.addEventListener('click', () => {
    state.inspector.selectedCellId = button.dataset.cellId;
    renderApp();
  }));
  root.querySelector('#inspect-search')?.addEventListener('input', (event) => {
    state.inspector.query = event.target.value;
    const caret = event.target.selectionStart;
    renderApp();
    const input = root.querySelector('#inspect-search');
    input?.focus();
    input?.setSelectionRange(caret, caret);
  });
  // 页眉页尾及导出文件名事件绑定
  root.querySelectorAll('#hf-model-input').forEach((input) => input.addEventListener('input', (e) => {
    if (!state.editor.engine) return;
    updateHeaderFooterData(state.editor.engine, { model: e.target.value.trim() });
    state.editor.dirty = true;
    const docCodeInp = root.querySelector('#hf-doc-code-input');
    if (docCodeInp) docCodeInp.value = e.target.value.trim() ? `${e.target.value.trim()}-MSDS` : '';
    const hBoxes = root.querySelectorAll('.hp-model-box');
    hBoxes.forEach((b) => b.textContent = e.target.value.trim() || '未设定型号');
    const fLeft = root.querySelector('.fp-left');
    if (fLeft) {
      const comp = state.editor.engine.headerFooterData?.company || '广州冠志新材料科技有限公司';
      fLeft.textContent = e.target.value.trim() ? `${comp} ${e.target.value.trim()}-MSDS` : comp;
    }
    const hfNavBadge = root.querySelector('.hf-model-badge');
    if (hfNavBadge) hfNavBadge.textContent = e.target.value.trim() || '待配置';
    if (!state.editor.customFileName) {
      const expInp = root.querySelector('#hf-export-filename') || root.querySelector('#quick-export-name-input');
      if (expInp) expInp.value = buildExportDocxName(state.editor.engine);
    }
  }));

  root.querySelectorAll('#hf-title-input').forEach((input) => input.addEventListener('input', (e) => {
    if (!state.editor.engine) return;
    updateHeaderFooterData(state.editor.engine, { title: e.target.value.trim() });
    state.editor.dirty = true;
    const hTitle = root.querySelector('.hp-title');
    if (hTitle) hTitle.textContent = e.target.value.trim() || '物料安全数据表';
  }));

  root.querySelectorAll('#hf-version-input').forEach((input) => input.addEventListener('input', (e) => {
    if (!state.editor.engine) return;
    updateHeaderFooterData(state.editor.engine, { version: e.target.value.trim() });
    state.editor.dirty = true;
    const hVer = root.querySelector('.hp-ver');
    if (hVer) hVer.textContent = `Version：${e.target.value.trim() || 'V1.0'}`;
  }));

  root.querySelectorAll('#hf-company-select').forEach((sel) => sel.addEventListener('change', (e) => {
    if (!state.editor.engine) return;
    const customInp = root.querySelector('#hf-company-input');
    if (e.target.value === 'custom') {
      if (customInp) customInp.style.display = 'block';
    } else {
      if (customInp) customInp.style.display = 'none';
      updateHeaderFooterData(state.editor.engine, { company: e.target.value });
      state.editor.dirty = true;
      const fLeft = root.querySelector('.fp-left');
      if (fLeft) {
        const mod = state.editor.engine.headerFooterData?.model || '';
        fLeft.textContent = mod ? `${e.target.value} ${mod}-MSDS` : e.target.value;
      }
      if (!state.editor.customFileName) {
        const expInp = root.querySelector('#hf-export-filename') || root.querySelector('#quick-export-name-input');
        if (expInp) expInp.value = buildExportDocxName(state.editor.engine);
      }
    }
  }));

  root.querySelectorAll('#hf-company-input').forEach((input) => input.addEventListener('input', (e) => {
    if (!state.editor.engine) return;
    updateHeaderFooterData(state.editor.engine, { company: e.target.value.trim() });
    state.editor.dirty = true;
    const fLeft = root.querySelector('.fp-left');
    if (fLeft) {
      const mod = state.editor.engine.headerFooterData?.model || '';
      fLeft.textContent = mod ? `${e.target.value.trim()} ${mod}-MSDS` : e.target.value.trim();
    }
    if (!state.editor.customFileName) {
      const expInp = root.querySelector('#hf-export-filename') || root.querySelector('#quick-export-name-input');
      if (expInp) expInp.value = buildExportDocxName(state.editor.engine);
    }
  }));

  root.querySelectorAll('#hf-date-input').forEach((input) => input.addEventListener('input', (e) => {
    if (!state.editor.engine) return;
    updateHeaderFooterData(state.editor.engine, { revisionDate: e.target.value.trim() });
    state.editor.dirty = true;
    const fRight = root.querySelector('.fp-right');
    if (fRight) fRight.textContent = `修订日期：${e.target.value.trim() || 'YYYY年MM月DD日'}`;
  }));

  root.querySelectorAll('[data-action="hf-set-today"]').forEach((btn) => btn.addEventListener('click', () => {
    if (!state.editor.engine) return;
    const d = new Date();
    const todayStr = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
    updateHeaderFooterData(state.editor.engine, { revisionDate: todayStr });
    state.editor.dirty = true;
    const dateInp = root.querySelector('#hf-date-input');
    if (dateInp) dateInp.value = todayStr;
    const fRight = root.querySelector('.fp-right');
    if (fRight) fRight.textContent = `修订日期：${todayStr}`;
    showToast('已将修订日期更新为今日。', 'info');
  }));

  root.querySelectorAll('#hf-lang-select').forEach((sel) => sel.addEventListener('change', (e) => {
    if (!state.editor.engine) return;
    const nextLang = e.target.value;
    updateHeaderFooterData(state.editor.engine, { language: nextLang });
    state.editor.dirty = true;
    if (!state.editor.customFileName) {
      const expInp = root.querySelector('#hf-export-filename') || root.querySelector('#quick-export-name-input');
      if (expInp) expInp.value = buildExportDocxName(state.editor.engine, { lang: nextLang });
    }
  }));

  root.querySelectorAll('#hf-export-filename, #quick-export-name-input').forEach((input) => input.addEventListener('input', (e) => {
    state.editor.customFileName = e.target.value.trim();
  }));

  root.querySelectorAll('[data-action="reset-filename-to-standard"]').forEach((btn) => btn.addEventListener('click', () => {
    state.editor.customFileName = '';
    renderApp();
    showToast('已按当前产品型号与规则恢复标准导出文件名。', 'info');
  }));

  root.querySelectorAll('[data-action="reset-hf-to-template"]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('确定要恢复模板原始的页眉与页脚吗？')) return;
    if (state.editor.engine) {
      updateHeaderFooterData(state.editor.engine, {
        model: 'PEA-4139',
        company: '广州冠志新材料科技有限公司',
        version: 'V1.0',
        title: '物料安全数据表',
        revisionDate: '2026年08月05日',
      });
      state.editor.customFileName = '';
      state.editor.dirty = true;
      renderApp();
      showToast('已恢复模板初始页眉与页脚。', 'info');
    }
  }));

  root.querySelector('#editor-search')?.addEventListener('input', (event) => {
    state.editor.query = event.target.value;
    const caret = event.target.selectionStart;
    renderApp();
    const input = root.querySelector('#editor-search');
    input?.focus();
    input?.setSelectionRange(caret, caret);
  });
  root.querySelectorAll('[data-dropzone]').forEach((dropzone) => {
    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('drag-over');
      const file = event.dataTransfer?.files?.[0];
      if (file) importFile(file, dropzone.dataset.dropzone);
    });
  });
  root.querySelector('[data-action="toggle-inspect-preview"]')?.addEventListener('click', () => {
    state.inspector.showPreview = !state.inspector.showPreview;
    renderApp();
  });

  // 智能匹配多态对照模式切换
  root.querySelectorAll('.matching-mode-tabs [data-compare-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.matching.compareMode = btn.dataset.compareMode;
      renderApp();
    });
  });

  // 原版式缩放与展宽工具栏交互
  root.querySelectorAll('.preview-zoom-bar [data-zoom-action]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const zoomBar = btn.closest('.preview-zoom-bar');
      const targetId = zoomBar?.dataset.targetId;
      const target = root.querySelector(`[data-preview="${targetId}"]`);
      if (!target) return;

      const action = btn.dataset.zoomAction;
      if (action === 'toggle-expand') {
        if (targetId === 'editor') {
          state.editor.isWidePreview = !state.editor.isWidePreview;
        } else {
          state.matching.isWidePreview = !state.matching.isWidePreview;
        }
        renderApp();
        return;
      }

      let currentScale = parseFloat(target.dataset.currentScale || '1.0');
      if (!Number.isFinite(currentScale)) currentScale = 1.0;

      if (action === 'fit') {
        target.dataset.zoomMode = 'fit';
        if (targetId === 'inspect') state.inspector.zoomScale = 'fit';
        if (targetId === 'matching') state.matching.zoomScale = 'fit';
        if (targetId === 'editor') state.editor.zoomScale = 'fit';
        applyDocxFitToWidth(target, 'fit');
      } else if (action === '100') {
        target.dataset.zoomMode = '1.0';
        if (targetId === 'inspect') state.inspector.zoomScale = '1.0';
        if (targetId === 'matching') state.matching.zoomScale = '1.0';
        if (targetId === 'editor') state.editor.zoomScale = '1.0';
        applyDocxFitToWidth(target, 1.0);
      } else if (action === 'in') {
        const next = Math.min(2.0, Math.round((currentScale + 0.15) * 100) / 100);
        target.dataset.zoomMode = String(next);
        if (targetId === 'inspect') state.inspector.zoomScale = String(next);
        if (targetId === 'matching') state.matching.zoomScale = String(next);
        if (targetId === 'editor') state.editor.zoomScale = String(next);
        applyDocxFitToWidth(target, next);
      } else if (action === 'out') {
        const next = Math.max(0.3, Math.round((currentScale - 0.15) * 100) / 100);
        target.dataset.zoomMode = String(next);
        if (targetId === 'inspect') state.inspector.zoomScale = String(next);
        if (targetId === 'matching') state.matching.zoomScale = String(next);
        if (targetId === 'editor') state.editor.zoomScale = String(next);
        applyDocxFitToWidth(target, next);
      }
    });
  });

  // 编辑器右侧原版式模式切换 (源文件原版式 vs 模板效果)
  root.querySelectorAll('[data-editor-preview-mode]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const mode = btn.dataset.editorPreviewMode;
      if (mode && state.editor.previewMode !== mode) {
        state.editor.previewMode = mode;
        renderApp();
      }
    });
  });

  root.querySelectorAll('[data-action="pick-preview-doc"]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      pickSourcePreviewDoc();
    });
  });
  root.querySelector('[data-action="pick-inspect"]')?.addEventListener('click', () => pickFile('inspect'));
  root.querySelector('[data-action="load-sample"]')?.addEventListener('click', () => loadInspectorTemplate('CN 冠志'));
  root.querySelector('[data-action="load-editor"]')?.addEventListener('click', () => switchBaselineDraft('baseline_cn_guanzhi'));
  root.querySelector('[data-action="load-en-editor"]')?.addEventListener('click', () => switchBaselineDraft('baseline_en_guanzhi'));
  root.querySelector('[data-action="export-json"]')?.addEventListener('click', exportJson);
  root.querySelector('[data-action="run-audit"]')?.addEventListener('click', () => {
    const errors = auditEngine(state.editor.engine);
    showToast(errors.length ? `审计完成：发现 ${errors.length} 个问题。` : '审计完成：16 节结构通过。', errors.length ? 'error' : 'success');
  });
  root.querySelector('[data-action="export-docx"]')?.addEventListener('click', exportDocx);
  root.querySelector('[data-action="reset-all-template"]')?.addEventListener('click', async () => {
    if (!state.editor.engine) return;
    if (!window.confirm(`确认将整份文档恢复至【${state.editor.template}】初始模板状态吗？\n\n当前所有章节未导出的修改都将被清空还原。`)) {
      return;
    }
    try {
      const engine = await fetchTemplate(state.editor.template);
      tableRecords(engine).forEach((record) => renumberRecord(record));
      state.editor.engine = engine;
      state.editor.dirty = false;
      renderApp();
      showToast(`✓ 已将整份模板恢复至初始状态（${state.editor.template}）。`, 'success');
    } catch (error) {
      showToast(`恢复模板失败：${error.message}`, 'error');
    }
  });

  root.querySelectorAll('[data-action="reset-current-section"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!state.editor.engine) return;
      const record = recordById(state.editor.engine, button.dataset.recordId);
      if (!record) return;
      const secName = record.title || sectionLabel(record.sectionNumber);
      if (!window.confirm(`确认仅将【${secName}】恢复至初始模板状态吗？\n\n本章节的所有编辑修改将被撤销还原，其他章节的修改仍将完整保留。`)) {
        return;
      }
      try {
        const baselineEngine = await fetchTemplate(state.editor.template);
        tableRecords(baselineEngine).forEach((r) => renumberRecord(r));
        const updated = restoreSectionToTemplate(state.editor.engine, baselineEngine, record);
        state.editor.selectedRecordId = updated?.id || record.id;
        state.editor.dirty = true;
        renderApp();
        showToast(`✓ 已将 ${secName} 恢复至初始模板状态，其他章节修改已保留。`, 'success');
      } catch (error) {
        showToast(`恢复本节失败：${error.message}`, 'error');
      }
    });
  });
  root.querySelectorAll('[data-action="export-review-bundle"]').forEach((btn) => btn.addEventListener('click', handleExportReviewBundle));
  root.querySelectorAll('[data-action="toggle-review-drawer"]').forEach((btn) => btn.addEventListener('click', () => {
    state.review.drawerOpen = !state.review.drawerOpen;
    renderApp();
  }));
  root.querySelectorAll('[data-action="close-review-drawer"]').forEach((btn) => btn.addEventListener('click', () => {
    state.review.drawerOpen = false;
    renderApp();
  }));
  root.querySelectorAll('[data-action="clear-all-annotations"]').forEach((btn) => btn.addEventListener('click', () => {
    if (state.review.session?.annotations?.length > 0) {
      if (window.confirm('确定要清空当前所有审阅批注吗？清空后导出门禁拦截将自动解除。')) {
        state.review.session.annotations = [];
        showToast('已清空全部审阅批注，导出门禁已彻底解除。', 'info');
        renderApp();
      }
    } else {
      showToast('当前没有批注。', 'info');
    }
  }));
  root.querySelectorAll('[data-action="resolve-all-annotations"]').forEach((btn) => btn.addEventListener('click', () => {
    if (state.review.session?.annotations) {
      state.review.session.annotations.forEach((a) => { a.status = 'resolved'; });
      showToast('已将全部批注标记为已解决，准予直接导出。', 'success');
      renderApp();
    }
  }));
  root.querySelector('#ann-filter-section')?.addEventListener('change', (e) => {
    state.review.filterSection = e.target.value;
    renderApp();
  });
  root.querySelector('#ann-filter-severity')?.addEventListener('change', (e) => {
    state.review.filterSeverity = e.target.value;
    renderApp();
  });
  root.querySelector('#ann-filter-status')?.addEventListener('change', (e) => {
    state.review.filterStatus = e.target.value;
    renderApp();
  });
  root.querySelectorAll('[data-resolve-ann]').forEach((btn) => btn.addEventListener('click', () => {
    const annId = btn.dataset.resolveAnn;
    const ann = state.review.session?.findAnnotation(annId);
    if (ann) {
      ann.resolve('用户已确认解决');
      renderApp();
      showToast(`批注 ${annId} 已标记为已解决。`, 'success');
    }
  }));
  root.querySelectorAll('[data-delete-ann]').forEach((btn) => btn.addEventListener('click', () => {
    const annId = btn.dataset.deleteAnn;
    state.review.session?.removeAnnotation(annId);
    renderApp();
    showToast(`批注 ${annId} 已删除。`, 'info');
  }));
  root.querySelectorAll('[data-action="open-add-ann"]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const sec = Number(btn.dataset.sec) || 1;
    const row = Number(btn.dataset.row) || 0;
    const col = Number(btn.dataset.col) || 0;
    let actualText = '';
    const rec = (state.matching.templateEngine || state.inspector.engine || state.editor.engine)?.records?.find((r) => r.sectionNumber === sec);
    const cell = rec?.rows?.find((r) => r.index === row)?.cells?.find((c) => c.col === col);
    if (cell) actualText = cell.valueText || cell.text || '';
    state.review.modal = {
      open: true,
      sectionNumber: sec,
      rowIndex: row,
      colIndex: col,
      actual: actualText,
      expected: '',
      anchor: createAnchor('cell', {
        panel: state.view === 'matching' ? 'matched_table' : (state.view === 'editor' ? 'editor' : 'source_table'),
        sectionNumber: sec,
        recordId: rec?.id,
        rowIndex: row,
        cellIndex: col,
        valueText: actualText,
      }),
    };
    renderApp();
  }));
  root.querySelectorAll('[data-action="close-ann-modal"]').forEach((btn) => btn.addEventListener('click', () => {
    state.review.modal = null;
    renderApp();
  }));
  root.querySelector('[data-action="save-ann-modal"]')?.addEventListener('click', () => {
    const m = state.review.modal;
    if (!m) return;
    const severity = root.querySelector('#ann-modal-severity')?.value || 'error';
    const category = root.querySelector('#ann-modal-category')?.value || 'wrong_value';
    const expected = root.querySelector('#ann-modal-expected')?.value?.trim() || '';
    const comment = root.querySelector('#ann-modal-comment')?.value?.trim() || '';
    const suggestedAction = root.querySelector('#ann-modal-action')?.value?.trim() || '';

    if (!state.review.session) {
      state.review.session = new ReviewSession({ productModel: 'MSDS' });
    }

    const ann = new Annotation({
      reviewSessionId: state.review.session.reviewSessionId,
      status: 'open',
      severity,
      category,
      title: `Sec ${m.sectionNumber} (行${m.rowIndex}): ${category}`,
      comment,
      expected,
      actual: m.actual,
      suggestedAction,
      anchor: m.anchor,
      snapshot: {
        valueHash: computeContentHash(m.actual),
        sourceHash: state.review.session.sourceHash,
        templateHash: state.review.session.templateHash,
      },
    });

    state.review.session.addAnnotation(ann);
    if (state.repo.activeRecordId) {
      fetch(`/api/msds/repo/records/${state.repo.activeRecordId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations: state.review.session.annotations }),
      }).catch((err) => console.error('Failed to sync annotations to repo:', err));
    }
    state.review.modal = null;
    renderApp();
    showToast(`批注已保存 (${ann.annotationId})。`, 'success');
  });
  root.querySelectorAll('.ann-badge[data-ann-id]').forEach((badge) => badge.addEventListener('click', (e) => {
    e.stopPropagation();
    state.review.drawerOpen = true;
    renderApp();
  }));
  root.querySelectorAll('#allow-label-edit').forEach((el) => el.addEventListener('change', (event) => {
    state.editor.allowLabelEdit = event.target.checked;
    renderApp();
  }));
  root.querySelectorAll('#manage-cell-editability').forEach((el) => el.addEventListener('change', (event) => {
    state.editor.manageCellEditability = event.target.checked;
    renderApp();
  }));
  root.querySelectorAll('#baseline-select, .baseline-dropdown').forEach((el) => el.addEventListener('change', async (event) => {
    const targetBaselineId = event.target.value;
    await switchBaselineDraft(targetBaselineId);
  }));
  root.querySelectorAll('#template-select').forEach((el) => el.addEventListener('change', (event) => {
    loadEditorTemplate(event.target.value);
  }));

  // 智能匹配核心流转事件
  root.querySelectorAll('[data-action="start-matching"]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!state.inspector.engine) {
      if (state.repo.records && state.repo.records.length > 0) {
        const recId = state.repo.activeRecordId || state.repo.records[0].id;
        await loadRepoRecordToInspectAndMatching(recId);
      } else {
        showToast('请先选择样本或导入 DOCX 文件。', 'info');
        return;
      }
    }
    try {
      state.matching.selectedSectionNumber = 1;
      await syncMatchingEngine(state.matching.template || 'CN 冠志');
      state.view = 'matching';
      renderApp();
      showToast(`智能匹配就绪：已对齐至 ${state.matching.template} 标准模板。`, 'success');
    } catch (error) {
      showToast(`智能匹配失败：${error.message}`, 'error');
    }
  }));

  root.querySelector('#matching-template-select')?.addEventListener('change', async (event) => {
    const newTpl = event.target.value;
    try {
      await syncMatchingEngine(newTpl);
      renderApp();
      showToast(`已切换至 ${newTpl} 标准模板。`, 'success');
    } catch (error) {
      showToast(`切换模板失败：${error.message}`, 'error');
    }
  });

  root.querySelector('[data-action="re-run-matching"]')?.addEventListener('click', async () => {
    if (!state.inspector.engine) return;
    try {
      await syncMatchingEngine(state.matching.template || 'CN 冠志');
      renderApp();
      showToast('已重新计算智能匹配与模板插槽装配。', 'success');
    } catch (error) {
      showToast(`重新匹配失败：${error.message}`, 'error');
    }
  });

  root.querySelector('[data-action="go-inspect"]')?.addEventListener('click', () => {
    state.view = 'inspect';
    renderApp();
  });

  root.querySelector('[data-action="commit-to-editor"]')?.addEventListener('click', () => {
    if (!state.matching.templateEngine) {
      showToast('没有可导入的匹配模板实例，请先执行智能匹配。', 'error');
      return;
    }

    const summary = state.matching.result?.summary;
    const hasAmbiguous = (summary?.reviewAmbiguousFields || 0) > 0;
    const hasUnmatched = (summary?.unmatchedFields || 0) > 0;

    if (hasAmbiguous || hasUnmatched) {
      const issueDetails = [];
      if (hasAmbiguous) issueDetails.push(`${summary.reviewAmbiguousFields} 项候选冲突需复核`);
      if (hasUnmatched) issueDetails.push(`${summary.unmatchedFields} 项源文档未匹配行`);

      const proceed = window.confirm(
        `【智能匹配安全审计门禁提醒】\n\n当前匹配结果中存在：\n${issueDetails.map((s) => '• ' + s).join('\n')}\n\n直接导入可能会导致上述非标/冲突信息未对齐入模板。\n\n点击【确定】：已知悉上述风险，继续导入模板编辑器并在编辑器中人工核验；\n点击【取消】：留在当前界面继续比对审阅。`
      );
      if (!proceed) return;
    }

    state.editor.engine = state.matching.templateEngine;
    state.editor.template = state.matching.template;
    state.editor.previewMode = 'source';
    state.editor.selectedRecordId = firstSectionRecord(state.editor.engine)?.id || null;
    state.editor.selectedCellId = null;
    state.editor.dirty = true;
    state.view = 'editor';
    renderApp();
    showToast(`✓ 智能匹配结果已安全导入模板编辑器（${state.editor.template}）。`, 'success');
  });

  root.querySelectorAll('.matching-nav-item[data-section-num]').forEach((btn) => btn.addEventListener('click', () => {
    state.matching.selectedSectionNumber = Number(btn.dataset.sectionNum);
    state.pendingScrollSection.matching = state.matching.selectedSectionNumber;
    renderApp();
  }));

  root.querySelector('#matching-search')?.addEventListener('input', (event) => {
    state.matching.query = event.target.value;
    const caret = event.target.selectionStart;
    renderApp();
    const input = root.querySelector('#matching-search');
    input?.focus();
    input?.setSelectionRange(caret, caret);
  });

  root.querySelectorAll('.excel-cell-editor').forEach((editor) => {
    editor.addEventListener('input', handleEditorInput);
    editor.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const allEditors = Array.from(root.querySelectorAll('.excel-cell-editor'));
        const currentIndex = allEditors.indexOf(editor);
        if (currentIndex !== -1) {
          const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
          if (nextIndex >= 0 && nextIndex < allEditors.length) {
            allEditors[nextIndex].focus();
          }
        }
      } else if (event.key === 'Escape') {
        editor.blur();
      }
    });
  });
  root.querySelectorAll('[data-row-action]').forEach((button) => button.addEventListener('click', () => handleRowAction(button)));
  root.querySelectorAll('[data-table-action="add-note-row"]').forEach((button) => button.addEventListener('click', () => {
    const record = recordById(state.editor.engine, button.dataset.recordId);
    if (!record) return;
    try {
      const updated = addNoteRowAfter(state.editor.engine, record, 0, '说明：');
      state.editor.selectedRecordId = updated?.id || record.id;
      state.editor.dirty = true;
      renderApp();
      showToast('已在章节顶部插入单列说明行。', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }));
  root.querySelectorAll('[data-table-action="add-row"]').forEach((button) => button.addEventListener('click', () => {
    const record = recordById(state.editor.engine, button.dataset.recordId);
    if (!record) return;
    try {
      const updated = addRowAfter(state.editor.engine, record, record.rows.length - 1);
      state.editor.selectedRecordId = updated?.id || record.id;
      state.editor.dirty = true;
      renderApp();
      showToast('已在表格末尾追加一行并完成序号自动重排序。', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }));
  root.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && state.view === 'inspect') {
      event.preventDefault();
      root.querySelector('#inspect-search')?.focus();
      return;
    }
    // 无障碍：Escape 关闭活动弹窗并恢复触发焦点
    if (event.key === 'Escape') {
      if (state.editor.exportModalOpen) {
        event.preventDefault();
        state.editor.exportModalOpen = false;
        renderApp();
        restoreModalTrigger();
        return;
      }
      if (state.editor.managerModalOpen) {
        event.preventDefault();
        state.editor.managerModalOpen = false;
        renderApp();
        restoreModalTrigger();
        return;
      }
    }
    // 无障碍：Tab 在活动弹窗内环闭循环 (Focus Trap)
    const activeModal = root.querySelector('.modal-card[role="dialog"]');
    if (activeModal && event.key === 'Tab') {
      const focusables = Array.from(activeModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !activeModal.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  });

  // ============================================================
  // 全局事件委托：预设模式/清空/导出动作 (确保任何重绘与子元素点击100%响应)
  // ============================================================
  if (!root._presetDelegationBound) {
    root._presetDelegationBound = true;

    // 全局委托基准下拉切换 (change 事件)
    root.addEventListener('change', async (e) => {
      const select = e.target.closest('#baseline-select, .baseline-dropdown');
      if (select) {
        await switchBaselineDraft(select.value);
      }
    });

    root.addEventListener('click', (e) => {
      // 1. 进入预设编辑模式
      const enterBtn = e.target.closest('[data-action="enter-preset-mode"]');
      if (enterBtn) {
        e.preventDefault();
        e.stopPropagation();
        const curBaseId = state.editor.currentBaselineId || 'baseline_cn_guanzhi';
        const basePresets = (state.editor.presets || []).filter((p) => {
          const bId = p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
          return bId === curBaseId;
        });
        const targetPreset = basePresets.find((x) => x.id === state.editor.editingPresetId) || basePresets[0] || state.editor.presets[0];
        enterPresetEditing(targetPreset?.id);
        return;
      }

      // 2. 退出预设编辑模式
      const exitBtn = e.target.closest('[data-action="exit-preset-editing"]');
      if (exitBtn) {
        e.preventDefault();
        e.stopPropagation();
        exitPresetEditing();
        return;
      }

      // 3. 保存预设
      const saveBtn = e.target.closest('[data-action="save-current-preset"]');
      if (saveBtn) {
        e.preventDefault();
        e.stopPropagation();
        saveCurrentPreset(false);
        return;
      }

      // 4. 另存为新预设
      const saveAsBtn = e.target.closest('[data-action="save-as-new-preset"]');
      if (saveAsBtn) {
        e.preventDefault();
        e.stopPropagation();
        saveCurrentPreset(true);
        return;
      }

      // 5. 新建空白预设
      const newPresetBtn = e.target.closest('[data-action="create-new-preset"]');
      if (newPresetBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleCreateNewPreset();
        return;
      }

      // 6. 删除当前预设
      const deleteCurPresetBtn = e.target.closest('[data-action="delete-current-preset"]');
      if (deleteCurPresetBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteCurrentPreset();
        return;
      }

      // 7. 清空当前预设所有覆写
      const clearAllOverridesBtn = e.target.closest('[data-action="clear-all-preset-overrides"]');
      if (clearAllOverridesBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleClearAllPresetOverrides();
        return;
      }

      // 7.8 打开预设管理中心弹窗
      const openMgrModalBtn = e.target.closest('[data-action="open-preset-manager-modal"]');
      if (openMgrModalBtn) {
        e.preventDefault();
        e.stopPropagation();
        openPresetManagerModal(openMgrModalBtn);
        return;
      }

      // 7.9 从预设管理中心直接进入编辑指定预设
      const editFromMgrBtn = e.target.closest('[data-action="edit-preset-from-manager"]');
      if (editFromMgrBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pId = editFromMgrBtn.dataset.presetId;
        state.editor.managerModalOpen = false;
        enterPresetEditing(pId);
        return;
      }

      // 7.95 从预设管理中心删除预设
      const deletePresetItemBtn = e.target.closest('[data-action="delete-preset"]');
      if (deletePresetItemBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pId = deletePresetItemBtn.dataset.presetId;
        if (state.editor.presets.length <= 1) {
          showToast('至少需保留一个预设，无法删除最后一份预设。', 'warning');
          return;
        }
        const p = state.editor.presets.find((x) => x.id === pId);
        if (window.confirm(`确定要删除预设【${p?.name || pId}】吗？删除后不可恢复。`)) {
          state.editor.presets = state.editor.presets.filter((x) => x.id !== pId);
          PresetStore.savePresets(state.editor.presets);
          if (state.editor.editingPresetId === pId) {
            state.editor.editingPresetId = state.editor.presets[0]?.id || null;
            if (state.editor.isPresetEditing) {
              enterPresetEditing(state.editor.editingPresetId);
              return;
            }
          }
          showToast(`已成功删除预设【${p?.name || pId}】。`, 'info');
          renderApp();
        }
        return;
      }

      // 8. 预设批量导出弹窗打开
      const openExportModalBtn = e.target.closest('[data-action="open-preset-export-modal"]');
      if (openExportModalBtn) {
        e.preventDefault();
        e.stopPropagation();
        openUnifiedExportModal(openExportModalBtn);
        return;
      }

      // 8.2 打开系统版本与极速更新中心
      const openVersionBtn = e.target.closest('[data-action="open-version-modal"]');
      if (openVersionBtn) {
        e.preventDefault();
        e.stopPropagation();
        state.editor.versionModalOpen = true;
        renderApp();
        return;
      }

      // 8.3 复制 Docker 更新命令
      const copyDockerBtn = e.target.closest('[data-action="copy-docker-cmd"]');
      if (copyDockerBtn) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText(UPDATE_COMMANDS.docker).then(() => {
          showToast('Docker 更新命令已成功复制到剪贴板！', 'success');
        }).catch(() => {
          showToast('复制失败，请手动选取命令文本复制。', 'warning');
        });
        return;
      }

      // 8.4 复制本地更新命令
      const copyLocalBtn = e.target.closest('[data-action="copy-local-cmd"]');
      if (copyLocalBtn) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText(UPDATE_COMMANDS.windows).then(() => {
          showToast('本地更新命令已成功复制到剪贴板！', 'success');
        }).catch(() => {
          showToast('复制失败，请手动选取命令文本复制。', 'warning');
        });
        return;
      }

      // 8.5 点击遮罩背景空白区域关闭弹窗 (点击弹窗卡片内容区域不会触发)
      if (e.target.dataset.backdrop === 'true' || e.target.classList.contains('modal-backdrop')) {
        e.preventDefault();
        state.editor.exportModalOpen = false;
        state.editor.managerModalOpen = false;
        state.editor.versionModalOpen = false;
        renderApp();
        return;
      }

      // 9. 关闭预设弹窗与版本弹窗
      const closeModalBtn = e.target.closest('[data-action="close-preset-modal"]');
      if (closeModalBtn) {
        e.preventDefault();
        e.stopPropagation();
        state.editor.exportModalOpen = false;
        state.editor.managerModalOpen = false;
        renderApp();
        return;
      }

      const closeVersionBtn = e.target.closest('[data-action="close-version-modal"]');
      if (closeVersionBtn) {
        e.preventDefault();
        e.stopPropagation();
        state.editor.versionModalOpen = false;
        renderApp();
        return;
      }

      // 9.5 统一导出中心与基准切换
      const openUnifiedExportBtn = e.target.closest('[data-action="open-unified-export-modal"]');
      if (openUnifiedExportBtn) {
        e.preventDefault();
        e.stopPropagation();
        openUnifiedExportModal(openExportModalBtn);
        return;
      }

      const closeUnifiedExportBtn = e.target.closest('[data-action="close-unified-export-modal"]');
      if (closeUnifiedExportBtn) {
        e.preventDefault();
        e.stopPropagation();
        closeUnifiedExportModal();
        return;
      }

      // 切换基准完成状态
      const toggleCompleteBtn = e.target.closest('[data-action="toggle-baseline-complete"]');
      if (toggleCompleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        toggleBaselineComplete();
        return;
      }

      // 前往指定基准编辑
      const jumpBaseBtn = e.target.closest('[data-action="jump-to-baseline"]');
      if (jumpBaseBtn) {
        e.preventDefault();
        e.stopPropagation();
        const bId = jumpBaseBtn.dataset.baselineId;
        state.editor.exportModalOpen = false;
        state.editor.managerModalOpen = false;
        state.view = 'editor';
        switchBaselineDraft(bId);
        return;
      }

      // 导出中心目标勾选切换
      const toggleTargetEl = e.target.closest('[data-action="toggle-export-target"]');
      if (toggleTargetEl) {
        const k = toggleTargetEl.dataset.targetKey;
        if (!state.editor.exportConfig.selectedTargets) state.editor.exportConfig.selectedTargets = {};
        state.editor.exportConfig.selectedTargets[k] = !state.editor.exportConfig.selectedTargets[k];
        renderApp();
        return;
      }

      // 导出中心格式切换
      const toggleExportFmt = e.target.closest('[data-action="toggle-export-format"]');
      if (toggleExportFmt) {
        const fmt = toggleExportFmt.dataset.format;
        lastFocusedModalControlSelector = `[data-action="toggle-export-format"][data-format="${fmt}"]`;
        if (fmt === 'docx') state.editor.exportConfig.formatDocx = !state.editor.exportConfig.formatDocx;
        if (fmt === 'pdf') state.editor.exportConfig.formatPdf = !state.editor.exportConfig.formatPdf;
        renderApp();
        return;
      }

      // 快速切换
      if (e.target.closest('[data-action="quick-export-both-formats"]')) {
        lastFocusedModalControlSelector = '[data-action="quick-export-both-formats"]';
        state.editor.exportConfig.formatDocx = true;
        state.editor.exportConfig.formatPdf = true;
        renderApp();
        return;
      }
      if (e.target.closest('[data-action="quick-export-docx-only"]')) {
        lastFocusedModalControlSelector = '[data-action="quick-export-docx-only"]';
        state.editor.exportConfig.formatDocx = true;
        state.editor.exportConfig.formatPdf = false;
        renderApp();
        return;
      }
      if (e.target.closest('[data-action="quick-export-pdf-only"]')) {
        lastFocusedModalControlSelector = '[data-action="quick-export-pdf-only"]';
        state.editor.exportConfig.formatDocx = false;
        state.editor.exportConfig.formatPdf = true;
        renderApp();
        return;
      }
      if (e.target.closest('[data-action="quick-export-select-all-ready"]')) {
        state.editor.exportConfig.selectedTargets = {};
        for (const b of TEMPLATE_BASELINES) {
          const d = state.editor.drafts[b.id];
          if (d && (d.status === 'completed' || d.status === 'editing') && d.engine) {
            state.editor.exportConfig.selectedTargets[`${b.id}:base`] = true;
            for (const p of state.editor.presets || []) {
              const pBaseId = p.baselineId || (p.language === 'EN' ? 'baseline_en_guanzhi' : 'baseline_cn_guanzhi');
              if (pBaseId === b.id) {
                state.editor.exportConfig.selectedTargets[`${b.id}:${p.id}`] = true;
              }
            }
          }
        }
        renderApp();
        return;
      }
      if (e.target.closest('[data-action="quick-export-select-base-only"]')) {
        state.editor.exportConfig.selectedTargets = {};
        for (const b of TEMPLATE_BASELINES) {
          const d = state.editor.drafts[b.id];
          if (d && (d.status === 'completed' || d.status === 'editing') && d.engine) {
            state.editor.exportConfig.selectedTargets[`${b.id}:base`] = true;
          }
        }
        renderApp();
        return;
      }

      if (e.target.closest('[data-action="confirm-unified-export"]')) {
        e.preventDefault();
        e.stopPropagation();
        executeUnifiedExport();
        return;
      }

      // 10. 确认批量预设导出
      const confirmBatchBtn = e.target.closest('[data-action="confirm-batch-preset-export"]');
      if (confirmBatchBtn) {
        e.preventDefault();
        e.stopPropagation();
        executeBatchPresetExport();
        return;
      }

      // 11. 单元格一键清空值 (普通模式与预设模式通用)
      const clearCellBtn = e.target.closest('[data-cell-action="clear-value"]');
      if (clearCellBtn) {
        e.preventDefault();
        e.stopPropagation();
        const record = recordById(state.editor.engine, clearCellBtn.dataset.recordId);
        const cell = getCell(record, clearCellBtn.dataset.row, clearCellBtn.dataset.col);
        if (cell && cell.editable) {
          clearCellValue(cell, state.editor.engine?.roleStyles?.value);
          state.editor.dirty = true;
          refreshEditorDirty();
          renderApp();
        }
        return;
      }

      // 11.5 单元格编辑权限切换 (特殊情况配置模式)
      const toggleEditBtn = e.target.closest('[data-cell-action="toggle-editability"]');
      if (toggleEditBtn) {
        e.preventDefault();
        e.stopPropagation();
        const record = recordById(state.editor.engine, toggleEditBtn.dataset.recordId);
        const cell = getCell(record, toggleEditBtn.dataset.row, toggleEditBtn.dataset.col);
        if (cell) {
          const nextEditable = !cell.editable;
          cell.editable = nextEditable;
          cell.protectedReason = nextEditable ? null : '用户手动锁定';
          if (nextEditable && cell.kind === 'label-only') {
            cell.kind = 'note';
          }
          if (!state.editor.cellEditableOverrides) {
            state.editor.cellEditableOverrides = {};
          }
          const cellKey = `${record.id}:${toggleEditBtn.dataset.row}:${toggleEditBtn.dataset.col}`;
          state.editor.cellEditableOverrides[cellKey] = nextEditable;
          state.editor.dirty = true;
          refreshEditorDirty();
          showToast(nextEditable ? '已解锁该单元格（允许输入）' : '已锁定该单元格（禁止输入）', 'info');
          renderApp();
        }
        return;
      }

      // 12. 整节填写值一键清空
      const clearSecBtn = e.target.closest('[data-action="clear-current-section-values"]');
      if (clearSecBtn) {
        e.preventDefault();
        e.stopPropagation();
        const record = recordById(state.editor.engine, clearSecBtn.dataset.recordId);
        if (!record) return;
        if (window.confirm(`确定要清空【${record.title || '当前章节'}】的所有填写内容吗？`)) {
          clearSectionValues(record, state.editor.engine?.roleStyles?.value);
          state.editor.dirty = true;
          refreshEditorDirty();
          showToast(`已清空【${record.title || '当前章节'}】的全部填写值。`, 'info');
          renderApp();
        }
        return;
      }
    });
  }

  // 预设选择器与复选框事件 (每次 renderApp 刷新)
  root.querySelector('#editing-preset-name-input')?.addEventListener('input', (e) => {
    const curP = state.editor.presets.find((p) => p.id === state.editor.editingPresetId);
    if (curP && e.target.value.trim()) {
      curP.name = e.target.value.trim();
      PresetStore.savePresets(state.editor.presets);
    }
  });

  root.querySelector('#switch-editing-preset-select')?.addEventListener('change', (e) => {
    enterPresetEditing(e.target.value);
  });

  root.querySelector('#preset-mode-toggle')?.addEventListener('change', (e) => {
    state.editor.presetModeEnabled = e.target.checked;
    if (!state.editor.presetModeEnabled) {
      state.editor.activePresetId = null;
    }
    renderApp();
  });

  root.querySelector('#preset-layer-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    state.editor.activePresetId = val === '__base__' ? null : val;
    const p = state.editor.presets.find((x) => x.id === state.editor.activePresetId);
    showToast(p ? `切换图层：${p.name}` : '切换至标准底图', 'info');
    renderApp();
  });

  root.querySelectorAll('[data-action="create-new-preset"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = window.prompt('请输入预设名称（例如：客户定制国彩版、英文出口版等）：', '新建预设');
      if (!name || !name.trim()) return;
      const newId = `preset_custom_${Date.now()}`;
      const newPreset = {
        id: newId,
        name: name.trim(),
        targetTemplate: state.editor.template.includes('EN') ? 'EN 国彩' : 'CN 国彩',
        isBuiltin: false,
        enabledForExport: true,
        headerFooterOverrides: {
          company: '英德市国彩新材料有限公司',
          entity: '国彩',
          customFileNamePattern: `{model} msds_${state.editor.template.includes('EN') ? 'EN' : 'CN'} 国彩.docx`,
        },
        fieldOverrides: {},
      };
      state.editor.presets.push(newPreset);
      PresetStore.savePresets(state.editor.presets);
      state.editor.presetModeEnabled = true;
      state.editor.activePresetId = newId;
      showToast(`已创建预设：${newPreset.name}`, 'success');
      renderApp();
    });
  });

  root.querySelectorAll('[data-preset-action="revert-cell"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const semKey = btn.dataset.semanticKey;
      const activePreset = state.editor.presets.find((p) => p.id === state.editor.activePresetId);
      if (activePreset && semKey && activePreset.fieldOverrides) {
        delete activePreset.fieldOverrides[semKey];
        PresetStore.savePresets(state.editor.presets);
        showToast(`已撤销 [${semKey}] 的覆写，恢复继承基准值。`, 'info');
        renderApp();
      }
    });
  });

  root.querySelectorAll('[data-action="open-preset-manager-modal"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.editor.managerModalOpen = true;
      renderApp();
    });
  });

  root.querySelectorAll('.export-preset-check').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const pId = e.target.dataset.presetId;
      const p = state.editor.presets.find((x) => x.id === pId);
      if (p) {
        p.enabledForExport = e.target.checked;
        PresetStore.savePresets(state.editor.presets);
      }
      const item = chk.closest('.preset-export-item');
      if (item) {
        item.classList.toggle('active', e.target.checked);
      }
    });
  });

  root.querySelector('[data-action="reset-presets-to-default"]')?.addEventListener('click', () => {
    if (window.confirm('确定要重置为系统默认预设吗？自定义预设将被清空。')) {
      state.editor.presets = JSON.parse(JSON.stringify(SYSTEM_BUILTIN_PRESETS));
      PresetStore.savePresets(state.editor.presets);
      state.editor.activePresetId = null;
      showToast('已重置为系统默认预设。', 'success');
      renderApp();
    }
  });

  root.querySelectorAll('[data-action="delete-preset"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const pId = btn.dataset.presetId;
      if (window.confirm('确定要删除该预设吗？')) {
        state.editor.presets = state.editor.presets.filter((p) => p.id !== pId);
        PresetStore.savePresets(state.editor.presets);
        if (state.editor.activePresetId === pId) state.editor.activePresetId = null;
        showToast('已删除预设。', 'info');
        renderApp();
      }
    });
  });
  // ==========================================
  // 按钮唤起型号下拉浮层事件 (零独立窗口，零遮挡)
  // ==========================================
  root.querySelectorAll('[data-action="toggle-model-dropdown"]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.matching.modelDropdownOpen = !state.matching.modelDropdownOpen;
    renderApp();
    if (state.matching.modelDropdownOpen) {
      setTimeout(() => {
        const inp = root.querySelector('#popover-model-search');
        if (inp) inp.focus();
      }, 50);
    }
  }));

  root.querySelectorAll('[data-action="close-model-dropdown"]').forEach((el) => el.addEventListener('click', () => {
    state.matching.modelDropdownOpen = false;
    renderApp();
  }));

  root.querySelectorAll('[data-model-id]').forEach((btn) => btn.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.modelId;
    if (id) {
      state.matching.modelDropdownOpen = false;
      loadRecordToThreePane(id);
    }
  }));

  const popoverSearchInput = root.querySelector('#popover-model-search');
  if (popoverSearchInput) {
    let timer;
    popoverSearchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.matching.modelQuery = e.target.value;
        renderApp();
        const reInput = root.querySelector('#popover-model-search');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      }, 100);
    });
  }

  root.querySelectorAll('[data-action="open-batch-import-modal"]').forEach((btn) => btn.addEventListener('click', () => {
    state.repo.batchModalOpen = true;
    renderApp();
  }));

  root.querySelectorAll('[data-action="close-batch-import-modal"]').forEach((btn) => btn.addEventListener('click', () => {
    state.repo.batchModalOpen = false;
    renderApp();
  }));

  // 提交批量导入
  root.querySelector('[data-action="submit-batch-import"]')?.addEventListener('click', async () => {
    const dirInput = root.querySelector('#batch-input-dir')?.value?.trim();
    const nameInput = root.querySelector('#batch-input-name')?.value?.trim();
    const tplSelect = root.querySelector('#batch-input-template')?.value;
    const recursiveCheck = root.querySelector('#batch-input-recursive')?.checked ?? true;
    const fileSelector = root.querySelector('#batch-file-selector');

    state.repo.batchScanDir = dirInput || '';
    state.repo.batchNameInput = nameInput || '';
    state.repo.batchTargetTemplate = tplSelect || 'CN 冠志';
    state.repo.batchRecursive = recursiveCheck;

    const files = fileSelector?.files;

    try {
      if (files && files.length > 0) {
        showToast(`正在读取并上传 ${files.length} 个文件...`, 'info');
        state.repo.batchImportProgress = { total: files.length, processed: 0, current: '正在读取文件...' };
        renderApp();

        const filePayloads = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result;
              resolve(res.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          filePayloads.push({ fileName: file.name, base64 });
        }

        const res = await fetch('/api/msds/repo/batch/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: filePayloads,
            batchName: nameInput,
            targetTemplate: tplSelect,
          }),
        }).then((r) => r.json());

        if (!res.success) throw new Error(res.error || '批量导入失败');
        state.repo.batchModalOpen = false;
        state.repo.batchImportProgress = null;
        showToast(`🎉 批量导入成功！新增 ${res.importedCount} 份 MSDS 记录。`, 'success');
        await fetchRepoData();
      } else if (dirInput) {
        showToast('正在服务端扫描目录并并发导入...', 'info');
        state.repo.batchImportProgress = { total: 0, processed: 0, current: '正在扫描目录并解析...' };
        renderApp();

        const res = await fetch('/api/msds/repo/batch/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dirPath: dirInput,
            recursive: recursiveCheck,
            batchName: nameInput,
            targetTemplate: tplSelect,
          }),
        }).then((r) => r.json());

        if (!res.success) throw new Error(res.error || '服务端扫描导入失败');
        state.repo.batchModalOpen = false;
        state.repo.batchImportProgress = null;
        showToast(`🎉 批量导入成功！扫描导入 ${res.importedCount} 份 MSDS 记录。`, 'success');
        await fetchRepoData();
      } else {
        showToast('请指定要扫描的本地目录路径，或者选择上传文件。', 'warning');
      }
    } catch (err) {
      state.repo.batchImportProgress = null;
      renderApp();
      showToast(`批量导入失败: ${err.message}`, 'error');
    }
  });

}

function renderZoomBar(targetId, currentZoom = 'fit') {
  const isEditor = targetId === 'editor';
  const showTemplateInEditor = isEditor && state.editor.previewMode === 'template';
  const isPdf = !showTemplateInEditor && state.sourcePreview?.type === 'pdf';
  const isDoc = !showTemplateInEditor && state.sourcePreview?.type === 'doc';
  const badgeText = showTemplateInEditor ? '模板效果' : (isPdf ? 'PDF 原件' : isDoc ? 'DOC 待转' : 'DOCX 原版');
  const badgeClass = showTemplateInEditor ? 'badge-template' : (isPdf ? 'badge-pdf' : isDoc ? 'badge-doc' : 'badge-docx');
  const isExpanded = isEditor ? state.editor.isWidePreview : state.matching.isWidePreview;

  return `
    <div class="preview-zoom-bar" data-target-id="${targetId}">
      <span class="preview-type-badge ${badgeClass}">${badgeText}</span>
      ${!isPdf && !isDoc ? `
        <button type="button" class="zoom-btn ${currentZoom === 'fit' ? 'active' : ''}" data-zoom-action="fit" title="页面宽度自适应">自适应宽</button>
        <button type="button" class="zoom-btn ${currentZoom === '1.0' || currentZoom === '100' ? 'active' : ''}" data-zoom-action="100" title="100% 原始大小">100%</button>
        <button type="button" class="zoom-btn" data-zoom-action="out" title="缩小">－</button>
        <button type="button" class="zoom-btn" data-zoom-action="in" title="放大">＋</button>
        <span class="zoom-text">${currentZoom === 'fit' ? '自适应' : `${Math.round(parseFloat(currentZoom) * 100)}%`}</span>
      ` : ''}
      <button type="button" class="zoom-btn zoom-btn-expand ${isExpanded ? 'active' : ''}" data-zoom-action="toggle-expand" title="${isExpanded ? '还原标准比例' : '⤢ 展宽原版式视口'}">
        ${isExpanded ? '⤡ 还原' : '⤢ 展宽'}
      </button>
      <button type="button" class="zoom-btn" data-action="pick-preview-doc" title="切换或载入真实原件 (支持 DOCX / PDF / DOC)">📂 原件</button>
    </div>
  `;
}

function applyDocxFitToWidth(target, scaleMode = 'fit') {
  if (!target) return;
  const wrapper = target.querySelector('.docx-wrapper');
  const section = target.querySelector('section.docx');
  if (!wrapper || !section) return;

  const containerWidth = target.clientWidth;
  if (containerWidth <= 0) return;

  const pageWidth = section.offsetWidth || parseFloat(section.style.width) || 794;
  let scale = 1.0;

  if (scaleMode === 'fit') {
    // 留出 12px 呼吸间距，精准撑满容器
    scale = Math.max(0.25, (containerWidth - 12) / pageWidth);
    scale = Math.min(1.5, scale);
  } else if (typeof scaleMode === 'number') {
    scale = scaleMode;
  } else {
    const parsed = parseFloat(scaleMode);
    scale = Number.isFinite(parsed) ? parsed : 1.0;
  }

  // 优先采用 Chromium CSS zoom，排版流最自然，高度与滚动条完全自适应
  if ('zoom' in wrapper.style) {
    wrapper.style.zoom = scale;
    wrapper.style.transform = '';
    wrapper.style.marginBottom = '';
  } else {
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top center';
    const unscaledHeight = wrapper.scrollHeight;
    wrapper.style.marginBottom = `-${unscaledHeight * (1 - scale)}px`;
  }

  target.dataset.currentScale = String(scale);

  // 更新对应视口的缩放指示器
  const zoomBar = target.closest('.preview-panel, .matching-col')?.querySelector('.preview-zoom-bar');
  if (zoomBar) {
    const zoomText = zoomBar.querySelector('.zoom-text');
    if (zoomText) {
      zoomText.textContent = scaleMode === 'fit' ? '自适应' : `${Math.round(scale * 100)}%`;
    }
    zoomBar.querySelectorAll('.zoom-btn').forEach((btn) => {
      const action = btn.dataset.zoomAction;
      if (scaleMode === 'fit') {
        btn.classList.toggle('active', action === 'fit');
      } else if (Math.round(scale * 100) === 100) {
        btn.classList.toggle('active', action === '100');
      } else {
        btn.classList.toggle('active', false);
      }
    });
  }

  // 自适应且小于等于容器宽时隐藏横向滚动条，否则自动放开横向平滑滚动
  if (scaleMode === 'fit' && (pageWidth * scale <= containerWidth + 6)) {
    target.style.overflowX = 'hidden';
  } else {
    target.style.overflowX = 'auto';
  }
}

const previewResizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const target = entry.target;
    const mode = target.dataset.zoomMode || 'fit';
    if (mode === 'fit') {
      applyDocxFitToWidth(target, 'fit');
    }
  }
});

function renderPreviews() {
  const targets = root.querySelectorAll('[data-preview]');
  targets.forEach(async (target) => {
    const pKey = target.dataset.preview;
    const isEditor = pKey === 'editor';
    const showSourceInEditor = isEditor && (state.editor.previewMode !== 'template') && Boolean(state.inspector.engine || state.sourcePreview);
    const previewType = showSourceInEditor
      ? (state.sourcePreview?.type || 'docx')
      : (isEditor ? 'docx' : (state.sourcePreview?.type || 'docx'));

    // 绑定滚动事件，实时记录用户的当前滚动位置，防止被重绘冲掉
    target.onscroll = () => {
      if (pKey) {
        state.previewScrollPositions[pKey] = target.scrollTop;
      }
    };

    if (previewType === 'pdf' && state.sourcePreview?.blobUrl) {
      const pdfKey = `pdf:${state.sourcePreview.blobUrl}`;
      if (previewRenderCache.has(pdfKey)) {
        target.innerHTML = '';
        target.appendChild(previewRenderCache.get(pdfKey));
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'pdf-viewer-shell';
        wrap.innerHTML = `<iframe src="${state.sourcePreview.blobUrl}#toolbar=1&navpanes=0&view=FitH" class="native-pdf-frame" title="PDF 真实原版式阅览"></iframe>`;
        previewRenderCache.set(pdfKey, wrap);
        target.innerHTML = '';
        target.appendChild(wrap);
      }
      return;
    }

    if (previewType === 'doc') {
      target.innerHTML = `
        <div class="doc-preview-guidance">
          <div class="doc-guidance-card">
            <div class="doc-guidance-icon">📄</div>
            <h4>检测到 Word 97-2003 (.doc) 源文件</h4>
            <p>文件名称：<strong>${escapeHtml(state.sourcePreview?.name || '')}</strong></p>
            <p class="doc-guidance-tip">.doc 为二进制复合格式，浏览器原生不支持排版渲染。建议：</p>
            <div class="doc-guidance-btns">
              <button class="button button-sm button-primary" data-action="pick-preview-doc">📂 载入对应的 PDF 或 DOCX 版本</button>
            </div>
          </div>
        </div>
      `;
      target.querySelector('[data-action="pick-preview-doc"]')?.addEventListener('click', pickSourcePreviewDoc);
      return;
    }

    let engine = null;
    if (pKey === 'inspect' || pKey === 'matching' || showSourceInEditor) {
      engine = state.inspector.engine;
    } else if (isEditor) {
      engine = state.editor.engine;
    }
    if (!engine) return;

    const cacheKey = `${pKey}:${showSourceInEditor ? 'source' : 'tpl'}:${engine.sourceName || 'engine'}:${engine.originalBytes?.byteLength || 0}`;

    // 如果该引擎的 DOCX 已经渲染过，直接复用已渲染 DOM 树，实现 0ms 瞬间挂载并精确保持滚动位置！
    if (previewRenderCache.has(cacheKey)) {
      const cachedWrapper = previewRenderCache.get(cacheKey);
      target.innerHTML = '';
      target.appendChild(cachedWrapper);
      previewResizeObserver.observe(target);
      applyDocxFitToWidth(target, target.dataset.zoomMode || 'fit');

      if (state.pendingScrollSection && state.pendingScrollSection[pKey]) {
        const targetSec = state.pendingScrollSection[pKey];
        state.pendingScrollSection[pKey] = null;
        window.setTimeout(() => scrollToSectionInPreview(target, targetSec), 50);
      } else {
        target.scrollTop = state.previewScrollPositions[pKey] || 0;
      }
      return;
    }

    try {
      target.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'docx-preview-wrapper-holder';
      wrapper.style.width = '100%';
      target.appendChild(wrapper);

      await renderAsync(engineBuffer(engine), wrapper, null, {
        className: 'docx-preview',
        inWrapper: true,
        breakPages: true,
        useBase64URL: true,
      });

      previewRenderCache.set(cacheKey, wrapper);
      previewResizeObserver.observe(target);
      applyDocxFitToWidth(target, target.dataset.zoomMode || 'fit');

      if (state.pendingScrollSection && state.pendingScrollSection[pKey]) {
        const targetSec = state.pendingScrollSection[pKey];
        state.pendingScrollSection[pKey] = null;
        window.setTimeout(() => scrollToSectionInPreview(target, targetSec), 50);
      } else {
        target.scrollTop = state.previewScrollPositions[pKey] || 0;
      }
    } catch (error) {
      target.innerHTML = `<div class="preview-error"><strong>原版式预览不可用</strong><p>${escapeHtml(error.message)}</p><small>结构化识别结果仍可继续使用。</small></div>`;
    }
  });

  const imageEngine = state.view === 'inspect' || state.view === 'matching' ? state.inspector.engine : state.editor.engine;
  root.querySelectorAll('[data-image-target]').forEach(async (image) => {
    if (!imageEngine) return;
    const dataUrl = await imageEngine.getImageDataUrl(image.dataset.imageTarget);
    if (dataUrl) image.src = dataUrl;
    else image.remove();
  });
}

function pickSourcePreviewDoc() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx,.doc,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';
  input.onchange = () => input.files?.[0] && loadSourcePreviewFile(input.files[0]);
  input.click();
}

function loadSourcePreviewFile(file) {
  const lower = file.name.toLowerCase();
  if (state.sourcePreview?.blobUrl) {
    try {
      URL.revokeObjectURL(state.sourcePreview.blobUrl);
    } catch {
      // ignore
    }
  }
  if (lower.endsWith('.pdf')) {
    const blobUrl = URL.createObjectURL(file);
    state.sourcePreview = { name: file.name, type: 'pdf', blobUrl, file };
    showToast(`已挂载 PDF 原件：${file.name}，右侧视口已呈现高保真矢量原版式。`, 'success');
  } else if (lower.endsWith('.doc')) {
    state.sourcePreview = { name: file.name, type: 'doc', file };
    showToast(`已接收 .doc 文件：${file.name}。`, 'info');
  } else if (lower.endsWith('.docx')) {
    state.sourcePreview = { name: file.name, type: 'docx', file };
    loadDocx(file, file.name).then((engine) => {
      state.inspector.engine = engine;
      showToast(`已挂载 DOCX 原版式：${file.name}。`, 'success');
      renderApp();
    }).catch((err) => {
      showToast(`DOCX 读取失败：${err.message}`, 'error');
    });
  } else {
    showToast('仅支持 .docx、.doc 或 .pdf 格式文件。', 'error');
    return;
  }
  renderApp();
}

async function pickFile(target) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx,.doc,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';
  input.onchange = () => input.files?.[0] && importFile(input.files[0], target);
  input.click();
}

async function importFile(file, target) {
  const lower = file.name.toLowerCase();
  const isDocx = lower.endsWith('.docx');
  const isPdf = lower.endsWith('.pdf');
  const isDoc = lower.endsWith('.doc');

  if (!isDocx && !isPdf && !isDoc) {
    showToast('仅支持导入 .docx、.doc、.pdf 格式文件。', 'error');
    return;
  }

  if (isPdf || isDoc) {
    loadSourcePreviewFile(file);
    return;
  }

  // DOCX 文件
  if (state.sourcePreview?.blobUrl) {
    try {
      URL.revokeObjectURL(state.sourcePreview.blobUrl);
    } catch {
      // ignore
    }
  }
  state.sourcePreview = { name: file.name, type: 'docx', file };

  const previous = target === 'inspect' ? state.inspector.engine : state.editor.engine;
  try {
    const engine = await loadDocx(file, file.name);
    if (target === 'inspect') {
      state.inspector.engine = engine;
      state.inspector.selectedRecordId = firstSectionRecord(engine)?.id || null;
      state.inspector.selectedCellId = null;
      state.matching.result = null;
      state.matching.templateEngine = null;
      state.view = 'inspect';
    } else {
      state.editor.engine = engine;
      state.editor.selectedRecordId = firstSectionRecord(engine)?.id || null;
      state.editor.dirty = false;
      state.view = 'editor';
    }
    showToast(`已读取 ${file.name}，${tableRecords(engine).length} 个表格进入核对。`, 'success');
  } catch (error) {
    if (target === 'inspect') state.inspector.engine = previous;
    else state.editor.engine = previous;
    showToast(error.message || 'DOCX 读取失败，当前结果未改变。', 'error');
  }
}

async function loadInspectorTemplate(name) {
  try {
    const engine = await fetchTemplate(name);
    state.inspector.engine = engine;
    state.inspector.selectedRecordId = firstSectionRecord(engine)?.id || null;
    state.inspector.selectedCellId = null;
    state.matching.result = null;
    state.matching.templateEngine = null;
    state.view = 'inspect';
    showToast('已加载内嵌模板样例，可直接查看 16 节识别结果。', 'success');
    renderApp();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadEditorTemplate(name) {
  if (state.editor.dirty && !window.confirm('当前工作副本有未导出修改，切换模板会丢弃这些修改。继续吗？')) return;
  try {
    const engine = await fetchTemplate(name);
    // The working copy converges legacy template gaps (notably Section 9) before editing.
    // The embedded DOCX bytes are never mutated and dirty state remains clean until the user edits.
    tableRecords(engine).forEach((record) => renumberRecord(record));
    state.editor.template = name;
    state.editor.engine = engine;
    state.editor.selectedRecordId = firstSectionRecord(engine)?.id || null;
    state.editor.selectedCellId = null;
    state.editor.dirty = false;
    state.editor.cellEditableOverrides = {};
    state.view = 'editor';
    showToast(`已载入 ${name} 内嵌模板。`, 'success');
    renderApp();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function fetchTemplate(name) {
  let fileName = TEMPLATE_OPTIONS[name];
  if (!fileName) {
    const b = TEMPLATE_BASELINES.find((x) => x.id === name || x.displayName === name || x.label === name || x.templateFile === name);
    if (b) fileName = b.templateFile;
    else if (name && (name.includes('EN') || name.toLowerCase().includes('english') || name.includes('OSHA'))) fileName = TEMPLATE_OPTIONS['EN 冠志'];
    else if (name && (name.includes('CN') || name.includes('中文') || name.includes('国标'))) fileName = TEMPLATE_OPTIONS['CN 冠志'];
    else if (name && name.endsWith('.docx')) fileName = name;
  }
  if (!fileName) fileName = TEMPLATE_OPTIONS['CN 冠志']; // 兜底官方标准底模，绝不抛错阻断用户直接编辑

  const cacheKey = fileName;
  if (!templateBufferCache.has(cacheKey)) {
    const response = await fetch(`/templates/${encodeURIComponent(fileName)}`);
    if (!response.ok) throw new DocxEngineError(`无法读取内嵌模板：${response.status}`, 'TEMPLATE_FETCH');
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new DocxEngineError(`模板文件未能正确返回 (服务端返回了 HTML 页面，而非 docx 资源)`, 'TEMPLATE_FETCH');
    }
    const buf = await response.arrayBuffer();
    const header = new Uint8Array(buf.slice(0, 4));
    if (header[0] !== 0x50 || header[1] !== 0x4B) {
      throw new DocxEngineError(`模板文件格式损坏或非合法 DOCX/ZIP 文件`, 'TEMPLATE_FETCH');
    }
    templateBufferCache.set(cacheKey, buf);
  }
  const buf = templateBufferCache.get(cacheKey);
  return loadDocx(buf.slice(0), fileName);
}


function handleEditorInput(event) {
  const input = event.currentTarget;
  const record = recordById(state.editor.engine, input.dataset.recordId);
  const cell = getCell(record, input.dataset.row, input.dataset.col);
  if (!record || !cell) return;
  const text = (input.isContentEditable ? (input.innerText || '') : (input.value || '')).replace(/^\n$/, '');

  // 预设编辑模式分支：直接写入当前预设的 fieldOverrides 并同步引擎单元格
  if (state.editor.isPresetEditing && state.editor.editingPresetId && input.dataset.editKind === 'value') {
    const activePreset = state.editor.presets.find((p) => p.id === state.editor.editingPresetId);
    const semKey = input.dataset.semanticKey || getCellSemanticKey(cell);
    if (activePreset && semKey) {
      if (!activePreset.fieldOverrides) activePreset.fieldOverrides = {};
      activePreset.fieldOverrides[semKey] = text;
      writeCellValue(cell, text, state.editor.engine?.roleStyles?.value);
      state.editor.dirty = true;
      refreshEditorDirty();
      return;
    }
  }
  // 内容发生任何修改时，立即撤销之前的 completed 完成资格（失效保护）
  const activeDraft = state.editor.drafts[state.editor.currentBaselineId];
  if (activeDraft && activeDraft.status === 'completed') {
    activeDraft.status = 'editing';
    DraftStore.saveDraftMeta(state.editor.currentBaselineId, activeDraft);
  }

  try {
    if (input.dataset.editKind === 'label') {
      writeCellLabel(cell, text, state.editor.allowLabelEdit, state.editor.engine?.roleStyles?.label);
    } else {
      writeCellValue(cell, text, state.editor.engine?.roleStyles?.value);
    }
    state.editor.dirty = true;
    if (state.review.session) {
      state.review.session.bumpRevision();
      for (const ann of state.review.session.annotations) {
        detectAnchorDrift(ann, state.editor.engine?.records || []);
      }
    }
    refreshEditorDirty();
  } catch (error) {
    // Avoid showing intrusive toast on every keystroke if empty or transient
  }
}

function refreshEditorDirty() {
  const text = state.editor.dirty ? '有未导出修改' : '工作副本干净';
  const foot = root.querySelector('.editor-side .side-footer span:last-child');
  if (foot) foot.textContent = text;
  const ribbon = root.querySelector('.editor-layout')?.previousElementSibling?.querySelector('.file-ribbon-copy span');
  if (ribbon) ribbon.textContent = `工作副本${state.editor.dirty ? ' · 有未导出修改' : ' · 干净'} · 源模板只读`;
}

function handleRowAction(button) {
  const record = recordById(state.editor.engine, button.dataset.recordId);
  if (!record) return;
  const rowIndex = Number(button.dataset.row);
  const action = button.dataset.rowAction;
  try {
    let updated = record;
    let toastMsg = '';
    if (action === 'add') {
      updated = addRowAfter(state.editor.engine, record, rowIndex);
      toastMsg = '已复制行结构并完成序号自动重排序。';
    } else if (action === 'add-note') {
      updated = addNoteRowAfter(state.editor.engine, record, rowIndex, '说明：');
      toastMsg = '已插入单列说明行（可直接点击编辑内容）。';
    } else if (action === 'delete') {
      updated = deleteRow(state.editor.engine, record, rowIndex);
      toastMsg = '已删除行并完成序号自动重排序。';
    } else if (action === 'move-up') {
      updated = moveRowUp(state.editor.engine, record, rowIndex);
      toastMsg = '已上移行并自动更新序号。';
    } else if (action === 'move-down') {
      updated = moveRowDown(state.editor.engine, record, rowIndex);
      toastMsg = '已下移行并自动更新序号。';
    }
    state.editor.selectedRecordId = updated?.id || record.id;
    state.editor.dirty = true;
    if (state.review.session) {
      state.review.session.bumpRevision();
      for (const ann of state.review.session.annotations) {
        detectAnchorDrift(ann, state.editor.engine?.records || []);
      }
    }
    renderApp();
    if (toastMsg) showToast(toastMsg, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJson() {
  if (!state.inspector.engine) return;
  const data = JSON.stringify(portableModel(state.inspector.engine), null, 2);
  downloadBlob(new Blob([data], { type: 'application/json;charset=utf-8' }), `${state.inspector.engine.sourceName.replace(/\.docx$/i, '')}_识别.json`);
  showToast('识别 JSON 已下载。', 'success');
}


async function enterPresetEditing(presetId) {
  if (!state.editor.engine && !state.editor.normalEngine) {
    try {
      await loadEditorTemplate(state.editor.template || 'CN 冠志');
    } catch (e) {
      showToast('请等待底模加载完成。', 'warning');
      return;
    }
  }

  if (!state.editor.presets || state.editor.presets.length === 0) {
    state.editor.presets = PresetStore.loadPresets();
  }

  const p = state.editor.presets.find((x) => x.id === presetId) || state.editor.presets[0];
  if (!p) {
    showToast('未找到指定预设配置。', 'warning');
    return;
  }
  if (!state.editor.isPresetEditing) {
    state.editor.normalEngine = state.editor.engine;
  }
  state.editor.editingPresetId = p.id;

  try {
    const rawBuf = engineBuffer(state.editor.normalEngine || state.editor.engine);
    const docxName = `${p.targetTemplate || state.editor.template || 'template'}.docx`;
    const presetEngine = await loadDocx(rawBuf, docxName);
    
    // 清空所有表格值，展示纯预设画布
    for (const rec of tableRecords(presetEngine)) {
      clearSectionValues(rec);
    }
    // 注入当前预设已保存的字段覆盖值
    if (p.fieldOverrides && Object.keys(p.fieldOverrides).length > 0) {
      applySemanticOverrides(presetEngine, p.fieldOverrides);
    }
    // 注入当前预设页眉页脚
    if (p.headerFooterOverrides) {
      updateHeaderFooterData(presetEngine, p.headerFooterOverrides);
    }

    state.editor.engine = presetEngine;
    state.editor.isPresetEditing = true;
    state.editor.dirty = false;
    showToast(`已进入【${p.name}】预设覆写编辑模式。可在上方直接修改预设名称或在下方编辑字段覆写。`, 'info');
    renderApp();
  } catch (err) {
    console.error('进入预设编辑模式失败:', err);
    showToast(`进入预设编辑模式失败：${err.message}`, 'error');
  }
}

function exitPresetEditing() {
  if (state.editor.dirty && !window.confirm('当前预设编辑有未保存修改，退出将丢失这些修改。确定要退出并返回普通模式吗？')) {
    return;
  }
  if (state.editor.normalEngine) {
    state.editor.engine = state.editor.normalEngine;
    state.editor.normalEngine = null;
  }
  state.editor.isPresetEditing = false;
  state.editor.dirty = false;
  showToast('已退出预设编辑模式，已安全返回普通文档编辑。', 'success');
  renderApp();
}

function saveCurrentPreset(isNew = false) {
  if (!state.editor.engine) return;
  const nameInput = root.querySelector('#editing-preset-name-input');
  const inputName = nameInput?.value?.trim();

  let p = state.editor.presets.find((x) => x.id === state.editor.editingPresetId);
  if (isNew || !p) {
    const defaultName = isNew && p ? `${p.name} (副本)` : `自定义预设 ${state.editor.presets.length + 1}`;
    const name = window.prompt('请输入另存为的新预设名称：', defaultName);
    if (!name || !name.trim()) return;
    const newId = `preset_${Date.now()}`;
    p = {
      id: newId,
      name: name.trim(),
      targetTemplate: state.editor.template || 'CN 冠志',
      isBuiltin: false,
      enabledForExport: true,
      headerFooterOverrides: {},
      fieldOverrides: {},
    };
    state.editor.presets.push(p);
    state.editor.editingPresetId = newId;
  } else if (inputName && inputName !== p.name) {
    p.name = inputName;
  }

  // 提取当前所有非空值作为覆盖项
  const snapshot = extractSemanticSnapshot(state.editor.engine);
  p.fieldOverrides = snapshot;
  const hf = state.editor.engine.headerFooterData || {};
  p.headerFooterOverrides = {
    company: hf.company || '',
    title: hf.title || '',
    version: hf.version || '',
    revisionDate: hf.revisionDate || '',
    customFileNamePattern: hf.customFileNamePattern || (p.headerFooterOverrides?.customFileNamePattern) || '',
  };

  PresetStore.savePresets(state.editor.presets);
  state.editor.dirty = false;
  showToast(`预设【${p.name}】已成功保存！共包含 ${Object.keys(snapshot).length} 项覆写值。`, 'success');
  renderApp();
}

function handleCreateNewPreset() {
  const name = window.prompt('请输入新预设的名称（如：出口客户A、清远分厂、定制版等）：', `自定义预设 ${state.editor.presets.length + 1}`);
  if (!name || !name.trim()) return;
  const newPreset = PresetStore.createPreset(name.trim(), state.editor.template || 'CN 冠志');
  state.editor.presets.push(newPreset);
  PresetStore.savePresets(state.editor.presets);
  state.editor.editingPresetId = newPreset.id;
  enterPresetEditing(newPreset.id);
  showToast(`已创建并进入新预设【${newPreset.name}】！可在编辑器中直接修改覆写字段。`, 'success');
}

function handleDeleteCurrentPreset() {
  if (state.editor.presets.length <= 1) {
    showToast('当前仅剩唯一预设，无法删除最后一份预设（可使用【清空所有覆写】恢复全部留空继承）。', 'warning');
    return;
  }
  const curP = state.editor.presets.find((p) => p.id === state.editor.editingPresetId);
  if (!curP) return;
  if (!window.confirm(`确定要删除预设【${curP.name}】吗？删除后不可恢复。`)) return;
  state.editor.presets = state.editor.presets.filter((p) => p.id !== curP.id);
  PresetStore.savePresets(state.editor.presets);
  const nextP = state.editor.presets[0];
  state.editor.editingPresetId = nextP.id;
  showToast(`已删除预设【${curP.name}】，已切换至【${nextP.name}】。`, 'info');
  enterPresetEditing(nextP.id);
}

function handleClearAllPresetOverrides() {
  const curP = state.editor.presets.find((p) => p.id === state.editor.editingPresetId);
  if (!curP) return;
  if (!window.confirm(`确定要清空预设【${curP.name}】的所有覆写值吗？\n清空后该预设所有字段将恢复留空继承普通文档。`)) return;
  curP.fieldOverrides = {};
  curP.headerFooterOverrides = {};
  for (const rec of tableRecords(state.editor.engine)) {
    clearSectionValues(rec);
  }
  PresetStore.savePresets(state.editor.presets);
  state.editor.dirty = true;
  showToast(`已清空预设【${curP.name}】的全部覆写值，所有字段现已恢复留空继承。`, 'info');
  renderApp();
}


function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function executeUnifiedExport() {
  ensureCurrentDraft();
  const targets = computeExportTargets();
  if (targets.length === 0) {
    showToast('未选择任何导出组合，请至少勾选一项已就绪版本与导出格式。', 'warning');
    return;
  }

  // 审阅门禁检查
  if (state.review.session) {
    const gate = checkExportGate(state.review.session);
    if (!gate.allowed) {
      const confirmExport = window.confirm(
        `【审阅门禁提示】\n当前存在 ${gate.blockers.length} 个阻断项与 ${gate.errors.length} 个错误批注尚未标记解决。\n\n是否确认忽略门禁并继续强行导出？`
      );
      if (!confirmExport) {
        state.review.drawerOpen = true;
        renderApp();
        return;
      }
    }
  }

  state.editor.exportConfig.isExporting = true;
  state.editor.exportConfig.exportProgress = '正在从各基准独立草稿并发生成 Word 文档…';
  renderApp();

  try {
    const curDraft = state.editor.drafts[state.editor.currentBaselineId];
    const baseModel = curDraft?.engine?.headerFooterData?.model || state.review.session?.productModel || 'MSDS';

    // 1. 并发生成全部需要的 DOCX
    const uniqueDocxMap = new Map();
    for (const t of targets) {
      if (!uniqueDocxMap.has(t.docxFileName)) {
        uniqueDocxMap.set(t.docxFileName, t);
      }
    }

    const docxTasks = Array.from(uniqueDocxMap.values()).map(async (t) => {
      let doc;
      if (t.type === 'base') {
        doc = t.engine;
      } else if (t.type === 'preset' && t.preset) {
        const editedBuf = await t.engine.exportArrayBuffer();
        doc = await loadDocx(editedBuf, t.docxFileName);
        applyPresetPriorityOverlay(t.engine, t.preset, doc);
      } else {
        doc = t.engine;
      }

      tableRecords(doc).forEach((r) => renumberRecord(r));
      const buf = await doc.exportArrayBuffer();
      return {
        docxFileName: t.docxFileName,
        buffer: buf,
        target: t,
      };
    });

    const generatedDocxList = await Promise.all(docxTasks);
    const docxMap = new Map();
    for (const g of generatedDocxList) {
      docxMap.set(g.docxFileName, g.buffer);
    }

    // 2. 批量并发转译 PDF (如果勾选了 PDF)
    const pdfMap = new Map();
    const needsPdf = targets.some((t) => t.format === 'pdf');

    if (needsPdf) {
      state.editor.exportConfig.exportProgress = '正在通过批处理管道极速渲染高清 PDF…';
      renderApp();

      const pdfRequests = [];
      for (const t of targets) {
        if (t.format === 'pdf' && docxMap.has(t.docxFileName)) {
          if (!pdfRequests.some((p) => p.name === t.docxFileName)) {
            const buf = docxMap.get(t.docxFileName);
            pdfRequests.push({
              name: t.docxFileName,
              bufferBase64: arrayBufferToBase64(buf),
            });
          }
        }
      }

      try {
        const resp = await fetch('/api/msds/convert-pdf-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: pdfRequests }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && Array.isArray(data.pdfs)) {
            for (const p of data.pdfs) {
              pdfMap.set(p.pdfName, base64ToArrayBuffer(p.pdfBase64));
            }
          }
        } else {
          console.warn('PDF 转换服务端接口返回状态非 200，继续交付 DOCX');
        }
      } catch (pdfErr) {
        console.warn('PDF 批量转换请求失败:', pdfErr);
      }
    }

    // 3. 组装最终交付清单
    const finalFiles = [];
    for (const t of targets) {
      if (t.format === 'docx') {
        const buf = docxMap.get(t.docxFileName);
        if (buf) {
          finalFiles.push({ name: t.fileName, buffer: buf });
        }
      } else if (t.format === 'pdf') {
        const buf = pdfMap.get(t.fileName);
        if (buf) {
          finalFiles.push({ name: t.fileName, buffer: buf });
        }
      }
    }

    if (finalFiles.length === 0) {
      showToast('未生成任何有效交付物，请检查选择。', 'error');
      return;
    }

    // 4. 打包并触发下载（严守单一 ZIP 导出交付物契约）
    const zip = new JSZip();
    for (const f of finalFiles) {
      zip.file(f.name, f.buffer);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipName = `${baseModel}_MSDS_交付物.zip`;
    downloadBlob(zipBlob, zipName);
    showToast(`成功打包导出全部 ${finalFiles.length} 份交付物 (ZIP)。`, 'success');

    state.editor.exportModalOpen = false;
  } catch (err) {
    console.error('Unified export failed:', err);
    showToast(`导出失败：${err.message}`, 'error');
  } finally {
    state.editor.exportConfig.isExporting = false;
    state.editor.exportConfig.exportProgress = '';
    renderApp();
  }
}

async function handleExportReviewBundle() {
  if (!state.review.session) {
    showToast('当前尚未生成审阅会话，请先执行智能匹配。', 'warning');
    return;
  }
  // 审阅包本身就是用于承载批注清单与问题快照供评审的，因此永远准予导出！

  const tEngine = state.editor.engine || state.matching.templateEngine;
  if (!tEngine) {
    showToast('缺少模板引擎实例，无法导出审阅包。', 'error');
    return;
  }

  try {
    const cleanDocxBuf = await tEngine.exportArrayBuffer();
    const finalDocxName = buildExportDocxName(tEngine, {
      customFileName: state.editor.customFileName,
      templateName: state.matching.template || state.editor.template,
      sourcePreviewName: state.sourcePreview?.name,
      productModel: tEngine?.headerFooterData?.model || state.review.session?.productModel,
    });
    const model = state.review.session.productModel || 'MSDS';

    const bundle = buildReviewBundle(state.review.session, { finalDocxName });

    const zip = new JSZip();
    zip.file(finalDocxName, cleanDocxBuf);
    for (const [fname, content] of Object.entries(bundle.files)) {
      zip.file(fname, content);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${model}_MSDS_REVIEW_BUNDLE.zip`);
    showToast(`正式 MSDS 与 Agent 审阅包已成功导出 (${gate.status})！`, 'success');
  } catch (err) {
    showToast(`审阅包导出失败: ${err.message}`, 'error');
  }
}

async function bootstrap() {
  renderApp();
  fetchRepoData();
  PresetStore.fetchPresetsFromApi().then((apiPresets) => {
    if (apiPresets && apiPresets.length > 0) {
      state.editor.presets = apiPresets;
      renderApp();
    }
  }).catch(() => {});
  try {
    await switchBaselineDraft('baseline_cn_guanzhi');
  } catch (error) {
    console.warn('Initial draft load fallback:', error);
    try {
      await loadEditorTemplate('CN 冠志');
    } catch {}
  }
}

bootstrap();


// 保证单次注册全局弹窗生命周期键盘监听器 (Escape 关闭与 Tab 焦点限制)
if (!window._msdsGlobalKeydownAttached) {
  window._msdsGlobalKeydownAttached = true;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.editor.versionModalOpen) {
        e.preventDefault();
        closeVersionModal();
        return;
      }
      if (state.editor.managerModalOpen) {
        e.preventDefault();
        closePresetManagerModal();
        return;
      }
      if (state.editor.exportModalOpen) {
        e.preventDefault();
        closeUnifiedExportModal();
        return;
      }
      if (state.review?.drawerOpen) {
        e.preventDefault();
        state.review.drawerOpen = false;
        renderApp();
        return;
      }
    }

    if (e.key === 'Tab') {
      const activeModal = document.querySelector('.modal-card[role="dialog"]');
      if (activeModal) {
        const focusables = Array.from(activeModal.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
  });
}
