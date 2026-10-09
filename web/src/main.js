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
import './styles.css';

const root = document.querySelector('#app');

const TEMPLATE_OPTIONS = {
  'CN 冠志': '正式模板_MSDS_CN_冠志(1).docx',
  'EN 冠志': '正式模板_MSDS_EN_冠志(1).docx',
};

const state = {
  view: 'inspect', // 'inspect' | 'matching' | 'editor'
  toast: null,
  sourcePreview: null, // { name: string, type: 'docx' | 'pdf' | 'doc', blobUrl?: string, file?: File }
  inspector: { engine: null, selectedRecordId: null, selectedCellId: null, query: '', showPreview: true, zoomScale: 'fit' },
  matching: { template: 'CN 冠志', templateEngine: null, result: null, selectedSectionNumber: 1, query: '', compareMode: 'doc-match', zoomScale: 'fit', isWidePreview: false },
  editor: { engine: null, template: 'CN 冠志', selectedRecordId: null, selectedCellId: null, allowLabelEdit: false, dirty: false, query: '', customFileName: '' },
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
      <div class="topbar-meta"><span class="local-dot"></span>浏览器本地处理 <span class="topbar-divider"></span><span>16 sections ready</span></div>
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
    <section class="empty-workspace" ${isInspect ? 'data-dropzone="inspect"' : ''}>
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
                <option value="error">Error (需修复)</option>
                <option value="blocker">Blocker (阻断导出)</option>
                <option value="warning">Warning (存疑警告)</option>
                <option value="info">Info (记录说明)</option>
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

function renderApp() {
  let content = '';
  if (state.view === 'inspect') content = renderInspector();
  else if (state.view === 'matching') content = renderMatching();
  else content = renderEditor();

  root.innerHTML = `${navMarkup()}<main class="page-shell ${state.view === 'matching' ? 'matching-shell' : ''}">${content}</main>${toastMarkup()}${renderAnnotationDrawer()}${renderAnnotationModal()}`;
  bindEvents();
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
        <div class="side-heading"><h2>Section</h2><span class="side-count">${records.length}</span></div>
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

async function syncMatchingEngine(templateName = state.matching.template || 'CN 冠志') {
  if (!state.inspector.engine) return null;
  state.matching.template = templateName;
  const result = runSmartMatching(state.inspector.engine.records);
  state.matching.result = result;
  const tplEngine = await fetchTemplate(templateName);
  applyMatchResultToEditor(result, tplEngine);
  state.matching.templateEngine = tplEngine;

  // 初始化或同步审阅会话
  if (!state.review.session) {
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

function renderMatching() {
  const inspectEngine = state.inspector.engine;
  if (!inspectEngine) {
    return `
      ${headerBand('智能匹配', '02 / SMART MATCHING', '将非标识别结果匹配进模板标准插槽，呈现三模块同屏对照。')}
      <section class="empty-workspace">
        <h1>请先导入并识别 DOCX</h1>
        <p>智能匹配需要基于 DOCX 识别结果进行标准化结构提取。请先前往第一步导入源文件。</p>
        <div class="empty-actions">
          <button class="button button-primary" data-action="go-inspect">前往 DOCX 识别</button>
        </div>
      </section>
    `;
  }

  const selectedSecNum = state.matching.selectedSectionNumber || 1;
  const query = (state.matching.query || '').trim().toLowerCase();

  // 模块一：原始识别记录
  const rawRecord = (inspectEngine.records || []).find((r) => r.kind === 'table' && r.sectionNumber === selectedSecNum);

  // 模块二：标准匹配记录（已填入匹配值的标准模板表格）
  const matchedTemplateRecord = (state.matching.templateEngine?.records || []).find((r) => r.kind === 'table' && r.sectionNumber === selectedSecNum);

  return `
    <div class="matching-shell page-shell">
      <div class="matching-topbar">
        <div class="matching-brand-group">
          <h2 class="matching-title"><span>⇄</span>智能匹配</h2>
          <div class="matching-meta-ribbon">
            <span class="meta-tag"><strong>型号：</strong>${escapeHtml(state.matching.result?.headerFooter?.model || state.matching.templateEngine?.headerFooterData?.model || '—')}</span>
            <span class="meta-tag"><strong>主体：</strong>${escapeHtml(state.matching.result?.fileNaming?.entity || state.matching.templateEngine?.headerFooterData?.entity || '冠志')}</span>
            <span class="meta-tag"><strong>语言：</strong>${escapeHtml(state.matching.result?.fileNaming?.language || 'CN')}</span>
            <span class="meta-tag"><strong>修订：</strong>${escapeHtml(state.matching.result?.headerFooter?.revisionDate || state.matching.templateEngine?.headerFooterData?.revisionDate || '—')}</span>
            <span class="meta-tag meta-filename"><strong>推荐导出名：</strong><code>${escapeHtml(state.matching.result?.fileNaming?.recommendedFileName || (state.matching.templateEngine ? buildExportDocxName(state.matching.templateEngine) : ''))}</code></span>
          </div>
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
          <div class="matching-audit-summary">
            <span class="audit-pill audit-pill-good" title="源事实与模板插槽精准对齐">✓ 对齐 ${state.matching.result?.summary?.matchedFields || 0}</span>
            <span class="audit-pill audit-pill-clean" title="源未提供字段已安全清空，杜绝模板示例残留">⊘ 已安全清空</span>
            ${(state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 ? `<span class="audit-pill audit-pill-danger" title="存在多处矛盾或存疑项">⚠ 冲突 ${state.matching.result.summary.reviewAmbiguousFields}</span>` : ''}
            ${(state.matching.result?.summary?.unmatchedFields || 0) > 0 ? `<span class="audit-pill audit-pill-warning" title="存在未对标源行">? 未对标 ${state.matching.result.summary.unmatchedFields}</span>` : ''}
          </div>
          <button class="button button-quiet button-sm" data-action="toggle-review-drawer" title="查看或管理批注与问题清单"><span>💬</span> 批注 (${(state.review.session?.annotations || []).filter((a) => a.status === 'open').length})</button>
          <button class="button button-dark button-sm" data-action="export-review-bundle" title="导出正式 DOCX 与 Agent 审阅包"><span>📦</span> 导出审阅包</button>
          <button class="button button-quiet button-sm" data-action="re-run-matching">重新匹配</button>
          <button class="button button-primary button-sm" data-action="commit-to-editor" style="background:${((state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 || (state.matching.result?.summary?.unmatchedFields || 0) > 0) ? '#d97706' : '#059669'};border-color:${((state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 || (state.matching.result?.summary?.unmatchedFields || 0) > 0) ? '#d97706' : '#059669'};color:#fff;font-weight:600;">
            ${((state.matching.result?.summary?.reviewAmbiguousFields || 0) > 0 || (state.matching.result?.summary?.unmatchedFields || 0) > 0) ? '⚠ 审阅并导入编辑' : '✓ 导入编辑模块'}
          </button>
        </div>
      </div>

      <div class="matching-layout">
        <!-- 侧边栏：16 节紧凑导航 -->
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

        <!-- 核心区域：多态对照网格 -->
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

function renderHeaderFooterEditor(engine, records, query) {
  const hf = engine?.headerFooterData || extractHeaderFooterData(engine) || {};
  const currentExportName = buildExportDocxName(engine, {
    customFileName: state.editor.customFileName,
    templateName: state.editor.template,
    sourcePreviewName: state.sourcePreview?.name,
    productModel: hf.model,
  });

  return `
    ${headerBand('模板编辑器', '', '', `
      <button class="button button-quiet" data-action="reset-all-template" title="清空全部修改并恢复至初始模板状态">↺ 恢复整份模板</button>
      <button class="button button-quiet" data-action="run-audit">审计</button>
      <button class="button button-quiet" data-action="toggle-review-drawer" title="查看或管理批注与问题清单"><span>💬</span> 批注 (${(state.review.session?.annotations || []).filter((a) => a.status === 'open').length})</button>
      <button class="button button-dark" data-action="export-review-bundle" title="导出正式 DOCX 与 Agent 审阅包"><span>📦</span> 导出审阅包</button>
      <button class="button button-dark" data-action="export-docx">导出 DOCX</button>
    `)}
    <div class="file-ribbon" title="内嵌模板工作副本，源模板只读">
      <div class="file-ribbon-icon">模板</div>
      <div class="file-ribbon-copy">
        <strong>${escapeHtml(state.editor.template)}</strong>
        <span class="file-ribbon-name-wrap">
          <span>导出文件名：</span>
          <input id="quick-export-name-input" class="quick-export-name-input" value="${escapeHtml(currentExportName)}" title="直接修改导出文件名，回车或失焦生效" />
          <button class="button button-quiet button-xs" data-action="reset-filename-to-standard" title="恢复标准命名规则" style="padding:1px 6px;height:20px;font-size:11px;">↺</button>
        </span>
      </div>
      <div class="template-selector"><select id="template-select" aria-label="模板选择">${Object.keys(TEMPLATE_OPTIONS).map((name) => `<option ${state.editor.template === name ? 'selected' : ''}>${name}</option>`).join('')}</select></div>
      <label class="toggle-control"><input id="allow-label-edit" type="checkbox" ${state.editor.allowLabelEdit ? 'checked' : ''}><span class="toggle-track"></span><span>特殊情况：允许修改标签文本</span></label>
      <div class="file-ribbon-coverage"><span class="pulse-dot"></span>${records.filter((record) => record.sectionNumber).length}/16</div>
    </div>
    <div class="inspector-layout editor-layout">
      <aside class="side-panel editor-side">
        <div class="side-heading"><h2>Section</h2><span class="side-count">${records.filter((record) => record.sectionNumber).length}/16</span></div>
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
  if (state.editor.selectedRecordId === '__header_footer__') {
    return renderHeaderFooterEditor(engine, records, query);
  }
  const selected = selectedRecord(engine, state.editor.selectedRecordId);
  if (selected) state.editor.selectedRecordId = selected.id;
  const errors = auditEngine(engine);
  const query = state.editor.query.trim().toLowerCase();
  const visibleRecords = records.filter((record) => !query || record.searchText.toLowerCase().includes(query));
  const selectedVisible = visibleRecords.find((record) => record.id === selected?.id) || visibleRecords[0] || selected;
  if (selectedVisible) state.editor.selectedRecordId = selectedVisible.id;
  return `
    ${headerBand('模板编辑器', '', '', `
      <button class="button button-quiet" data-action="reset-all-template" title="清空全部修改并恢复至初始模板状态">↺ 恢复整份模板</button>
      <button class="button button-quiet" data-action="run-audit">审计</button>
      <button class="button button-quiet" data-action="toggle-review-drawer" title="查看或管理批注与问题清单"><span>💬</span> 批注 (${(state.review.session?.annotations || []).filter((a) => a.status === 'open').length})</button>
      <button class="button button-dark" data-action="export-review-bundle" title="导出正式 DOCX 与 Agent 审阅包"><span>📦</span> 导出审阅包</button>
      <button class="button button-dark" data-action="export-docx">导出 DOCX</button>
    `)}
    <div class="file-ribbon" title="内嵌模板工作副本，源模板只读">
      <div class="file-ribbon-icon">模板</div>
      <div class="file-ribbon-copy">
        <strong>${escapeHtml(state.editor.template)}</strong>
        <span class="file-ribbon-name-wrap">
          <span>导出文件名：</span>
          <input id="quick-export-name-input" class="quick-export-name-input" value="${escapeHtml(buildExportDocxName(engine, { customFileName: state.editor.customFileName, templateName: state.editor.template, sourcePreviewName: state.sourcePreview?.name, productModel: engine.headerFooterData?.model }))}" title="直接修改导出文件名，回车或失焦生效" />
          <button class="button button-quiet button-xs" data-action="reset-filename-to-standard" title="恢复标准命名规则" style="padding:1px 6px;height:20px;font-size:11px;">↺</button>
        </span>
      </div>
      <div class="template-selector"><select id="template-select" aria-label="模板选择">${Object.keys(TEMPLATE_OPTIONS).map((name) => `<option ${state.editor.template === name ? 'selected' : ''}>${name}</option>`).join('')}</select></div>
      <label class="toggle-control"><input id="allow-label-edit" type="checkbox" ${state.editor.allowLabelEdit ? 'checked' : ''}><span class="toggle-track"></span><span>特殊情况：允许修改标签文本</span></label>
      <div class="file-ribbon-coverage"><span class="pulse-dot"></span>${records.filter((record) => record.sectionNumber).length}/16</div>
    </div>
    <div class="inspector-layout editor-layout">
      <aside class="side-panel editor-side">
        <div class="side-heading"><h2>Section</h2><span class="side-count">${records.filter((record) => record.sectionNumber).length}/16</span></div>
        <label class="search-box"><span>⌕</span><input id="editor-search" type="search" placeholder="搜索标签、序号…" value="${escapeHtml(state.editor.query)}" /><kbd>⌘ K</kbd></label>
        <div class="section-list">${sectionNav(records, state.editor.selectedRecordId, query, 'editor', engine)}</div>
        <div class="side-footer"><span class="file-signal"></span><span>${state.editor.dirty ? '有未导出修改' : '工作副本干净'}</span></div>
      </aside>
      <section class="content-panel editor-content structured-panel">
        <div class="panel-heading">
          <h2>${escapeHtml(selectedVisible?.title || '未找到章节')}</h2>
          <div class="heading-pills">
            <span class="pill pill-blue">${selectedVisible ? sectionLabel(selectedVisible.sectionNumber) : '—'}</span>
            <span class="pill">${selectedVisible?.rows?.length || 0} 行</span>
            <button class="button button-quiet button-sm" data-action="reset-current-section" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="仅将当前 Section 恢复至初始模板状态（保留其他 Section 修改）" style="height:22px;padding:0 8px;font-size:10px;line-height:20px;color:#d97706;">↺ 恢复本节</button>
            <button class="button button-quiet button-sm" data-table-action="add-note-row" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="在当前节顶部插入单列说明行" style="height:22px;padding:0 8px;font-size:10px;line-height:20px;color:#0284c7;">＋ 说明行</button>
            <button class="button button-quiet button-sm" data-table-action="add-row" data-record-id="${escapeHtml(selectedVisible?.id || '')}" title="在表格末尾追加一行" style="height:22px;padding:0 8px;font-size:10px;line-height:20px;">＋ 追加行</button>
            <span class="pill pill-green">${errors.length ? `${errors.length} 个问题` : '通过'}</span>
          </div>
        </div>
        ${selectedVisible ? renderEditorTable(selectedVisible) : '<div class="no-results">没有可编辑章节</div>'}
      </section>
      <aside class="right-stack">
        <section class="preview-panel">
          <div class="panel-heading compact"><h2>原版式</h2><span class="preview-lock">只读</span></div>
          <div class="docx-preview-shell editor-preview" data-preview="editor"><div class="preview-loading"><span class="spinner"></span></div></div>
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
    roleStyles: state.editor.engine?.roleStyles || null,
  });
}

function bindEvents() {
  root.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', async () => {
    state.view = button.dataset.view;
    if (state.view === 'matching') {
      if (!state.inspector.engine) {
        showToast('请先在识别工作区导入或选择 DOCX 文件。', 'info');
      } else if (!state.matching.templateEngine) {
        await syncMatchingEngine(state.matching.template || 'CN 冠志');
      }
    }
    renderApp();
  }));
  root.querySelectorAll('.section-nav-row[data-record-id]').forEach((button) => button.addEventListener('click', () => {
    if (state.view === 'inspect') state.inspector.selectedRecordId = button.dataset.recordId;
    else state.editor.selectedRecordId = button.dataset.recordId;
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
        state.matching.isWidePreview = !state.matching.isWidePreview;
        renderApp();
        return;
      }

      let currentScale = parseFloat(target.dataset.currentScale || '1.0');
      if (!Number.isFinite(currentScale)) currentScale = 1.0;

      if (action === 'fit') {
        target.dataset.zoomMode = 'fit';
        if (targetId === 'inspect') state.inspector.zoomScale = 'fit';
        if (targetId === 'matching') state.matching.zoomScale = 'fit';
        applyDocxFitToWidth(target, 'fit');
      } else if (action === '100') {
        target.dataset.zoomMode = '1.0';
        if (targetId === 'inspect') state.inspector.zoomScale = '1.0';
        if (targetId === 'matching') state.matching.zoomScale = '1.0';
        applyDocxFitToWidth(target, 1.0);
      } else if (action === 'in') {
        const next = Math.min(2.0, Math.round((currentScale + 0.15) * 100) / 100);
        target.dataset.zoomMode = String(next);
        if (targetId === 'inspect') state.inspector.zoomScale = String(next);
        if (targetId === 'matching') state.matching.zoomScale = String(next);
        applyDocxFitToWidth(target, next);
      } else if (action === 'out') {
        const next = Math.max(0.3, Math.round((currentScale - 0.15) * 100) / 100);
        target.dataset.zoomMode = String(next);
        if (targetId === 'inspect') state.inspector.zoomScale = String(next);
        if (targetId === 'matching') state.matching.zoomScale = String(next);
        applyDocxFitToWidth(target, next);
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
  root.querySelector('[data-action="load-editor"]')?.addEventListener('click', () => loadEditorTemplate('CN 冠志'));
  root.querySelector('[data-action="load-en-editor"]')?.addEventListener('click', () => loadEditorTemplate('EN 冠志'));
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
    state.review.modal = null;
    renderApp();
    showToast(`批注已保存 (${ann.annotationId})。`, 'success');
  });
  root.querySelectorAll('.ann-badge[data-ann-id]').forEach((badge) => badge.addEventListener('click', (e) => {
    e.stopPropagation();
    state.review.drawerOpen = true;
    renderApp();
  }));
  root.querySelector('#template-select')?.addEventListener('change', (event) => loadEditorTemplate(event.target.value));
  root.querySelector('#allow-label-edit')?.addEventListener('change', (event) => {
    state.editor.allowLabelEdit = event.target.checked;
    renderApp();
  });

  // 智能匹配核心流转事件
  root.querySelectorAll('[data-action="start-matching"]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!state.inspector.engine) {
      showToast('请先在识别工作区导入或选择 DOCX 文件。', 'error');
      return;
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
    state.editor.selectedRecordId = firstSectionRecord(state.editor.engine)?.id || null;
    state.editor.selectedCellId = null;
    state.editor.dirty = true;
    state.view = 'editor';
    renderApp();
    showToast(`✓ 智能匹配结果已安全导入模板编辑器（${state.editor.template}）。`, 'success');
  });

  root.querySelectorAll('.matching-nav-item[data-section-num]').forEach((btn) => btn.addEventListener('click', () => {
    state.matching.selectedSectionNumber = Number(btn.dataset.sectionNum);
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
    }
  }, { once: true });
}

function renderZoomBar(targetId, currentZoom = 'fit') {
  const isPdf = state.sourcePreview?.type === 'pdf';
  const isDoc = state.sourcePreview?.type === 'doc';
  const badgeText = isPdf ? 'PDF 原件' : isDoc ? 'DOC 待转' : 'DOCX 原版';
  const badgeClass = isPdf ? 'badge-pdf' : isDoc ? 'badge-doc' : 'badge-docx';
  const isExpanded = state.matching.isWidePreview;

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
      <button type="button" class="zoom-btn zoom-btn-expand ${isExpanded ? 'active' : ''}" data-zoom-action="toggle-expand" title="${isExpanded ? '还原三栏标准比例' : '⤢ 展宽原版式视口 (68% 宽幅)'}">
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
    const isEditor = target.dataset.preview === 'editor';
    const previewType = isEditor ? 'docx' : (state.sourcePreview?.type || 'docx');

    if (previewType === 'pdf' && state.sourcePreview?.blobUrl) {
      target.innerHTML = `
        <div class="pdf-viewer-shell">
          <iframe src="${state.sourcePreview.blobUrl}#toolbar=1&navpanes=0&view=FitH" class="native-pdf-frame" title="PDF 真实原版式阅览"></iframe>
        </div>
      `;
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
    if (target.dataset.preview === 'inspect' || target.dataset.preview === 'matching') {
      engine = state.inspector.engine;
    } else if (isEditor) {
      engine = state.editor.engine;
    }
    if (!engine) return;
    try {
      target.innerHTML = '';
      await renderAsync(engineBuffer(engine), target, null, {
        className: 'docx-preview',
        inWrapper: true,
        breakPages: true,
        useBase64URL: true,
      });
      previewResizeObserver.observe(target);
      applyDocxFitToWidth(target, target.dataset.zoomMode || 'fit');
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
    state.view = 'editor';
    showToast(`已载入 ${name} 内嵌模板。`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function fetchTemplate(name) {
  const response = await fetch(`/templates/${encodeURIComponent(TEMPLATE_OPTIONS[name])}`);
  if (!response.ok) throw new DocxEngineError(`无法读取内嵌模板：${response.status}`, 'TEMPLATE_FETCH');
  return loadDocx(await response.arrayBuffer(), TEMPLATE_OPTIONS[name]);
}

function handleEditorInput(event) {
  const input = event.currentTarget;
  const record = recordById(state.editor.engine, input.dataset.recordId);
  const cell = getCell(record, input.dataset.row, input.dataset.col);
  if (!record || !cell) return;
  const text = (input.isContentEditable ? (input.innerText || '') : (input.value || '')).replace(/^\n$/, '');
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

async function exportDocx() {
  if (!state.editor.engine) return;
  if (state.review.session) {
    const gate = checkExportGate(state.review.session);
    if (!gate.allowed) {
      showToast(`导出已阻止：${gate.message}`, 'error');
      state.review.drawerOpen = true;
      renderApp();
      return;
    }
  }
  const errors = auditEngine(state.editor.engine);
  if (errors.length) {
    showToast(`导出已阻止：请先处理 ${errors.length} 个审计问题。`, 'error');
    return;
  }
  try {
    const buffer = await state.editor.engine.exportArrayBuffer();
    const exportName = buildExportDocxName(state.editor.engine, {
      customFileName: state.editor.customFileName,
      templateName: state.editor.template,
      sourcePreviewName: state.sourcePreview?.name,
      productModel: state.editor.engine?.headerFooterData?.model || state.review.session?.productModel,
    });
    downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), exportName);
    state.editor.dirty = false;
    renderApp();
    showToast(`已导出 ${exportName}，源模板保持不变。`, 'success');
  } catch (error) {
    showToast(`导出失败：${error.message}`, 'error');
  }
}

async function handleExportReviewBundle() {
  if (!state.review.session) {
    showToast('当前尚未生成审阅会话，请先执行智能匹配。', 'warning');
    return;
  }
  const gate = checkExportGate(state.review.session);
  if (!gate.allowed) {
    showToast(`导出已阻止：${gate.message}`, 'error');
    state.review.drawerOpen = true;
    renderApp();
    return;
  }

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
  try {
    await loadEditorTemplate('CN 冠志');
  } catch (error) {
    showToast('内嵌模板暂时无法加载，请确认开发服务器已启动。', 'error');
  }
}

bootstrap();
