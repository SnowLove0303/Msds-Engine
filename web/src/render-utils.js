import { classifyLabelTier, normalizedSequence } from './docx-engine.js';

export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function twipsToPx(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${(number / 15).toFixed(2)}px` : null;
}

export function cssValue(value) {
  return String(value || '').replace(/[;<>"']/g, '').trim();
}

export function imageStyle(image) {
  const width = Number(image?.extent?.widthEmu);
  const height = Number(image?.extent?.heightEmu);
  const styles = ['max-width:100%;vertical-align:middle'];
  if (Number.isFinite(width) && width > 0) styles.push(`width:${(width / 9525).toFixed(2)}px`);
  if (Number.isFinite(height) && height > 0) styles.push(`height:${(height / 9525).toFixed(2)}px`);
  return styles.join(';');
}

export function sourceParagraphStyle(paragraph, isLabelColumn = false) {
  const styles = [];
  const alignment = paragraph?.format?.alignment;
  if (!isLabelColumn && alignment) styles.push(`text-align:${alignment === 'both' ? 'justify' : alignment}`);
  const line = Number(paragraph?.format?.spacing?.line);
  if (Number.isFinite(line) && line > 0) styles.push(`line-height:${(line / 240).toFixed(2)}`);
  const before = twipsToPx(paragraph?.format?.spacing?.before);
  const after = twipsToPx(paragraph?.format?.spacing?.after);
  if (before) styles.push(`margin-top:${before}`);
  if (after) styles.push(`margin-bottom:${after}`);
  if (!isLabelColumn) {
    const indent = paragraph?.format?.indent || {};
    const left = twipsToPx(indent.left);
    const right = twipsToPx(indent.right);
    const firstLine = twipsToPx(indent.firstLine);
    const hanging = twipsToPx(indent.hanging);
    if (left) styles.push(`margin-left:${left}`);
    if (right) styles.push(`margin-right:${right}`);
    if (firstLine) styles.push(`text-indent:${firstLine}`);
    if (hanging) styles.push(`text-indent:-${hanging}`);
  }
  return styles.join(';');
}

export function sourceRunStyle(run, roleStyle = null, isHeaderFooter = false, forceBold = false, forceNormal = false) {
  const format = run?.format || {};
  const font = roleStyle?.font || format.font;
  const sizeHalfPoints = roleStyle?.sizeHalfPoints || format.sizeHalfPoints;
  const styles = [];
  if (font) styles.push(`font-family:${cssValue(font)}`);
  if (sizeHalfPoints) styles.push(`font-size:${Number(sizeHalfPoints) / 2}pt`);
  if (isHeaderFooter || forceNormal) {
    styles.push('font-weight:normal');
  } else if (forceBold) {
    styles.push('font-weight:700');
  } else {
    const isBold = Boolean(run?.bold ?? format.bold);
    if (isBold) {
      styles.push('font-weight:700');
    } else {
      styles.push('font-weight:normal');
    }
  }
  if (format.italic) styles.push('font-style:italic');
  if (format.color && format.color !== 'auto') styles.push(`color:#${cssValue(format.color)}`);
  if (format.underline && format.underline !== 'none') styles.push('text-decoration:underline');
  if (format.strike) styles.push('text-decoration:line-through');
  if (format.verticalAlignment === 'superscript') styles.push('vertical-align:super;font-size:smaller');
  if (format.verticalAlignment === 'subscript') styles.push('vertical-align:sub;font-size:smaller');
  return styles.join(';');
}

export function splitLabelSequence(rawText) {
  if (!rawText) return { sequence: '', labelText: '' };
  const str = String(rawText).trim();
  const match = str.match(/^\s*(?:v)?(\d{1,2}(?:[\.．、]\d{1,2})+|\d{1,2}[\.．、])\s*([\.．、:：]|\s|$)?/i);
  if (!match) {
    return { sequence: '', labelText: str };
  }
  const rawNum = match[1].replace(/[．]/g, '.').replace(/[\.、]$/, '');
  const seqText = `${rawNum}  `;
  const cleanLabel = str.slice(match[0].length).trim();
  return { sequence: seqText, labelText: cleanLabel };
}

export function renderEditorLabelMarkup(labelText, allowLabelEdit, record, row, cell) {
  if (!labelText) return '';
  const { sequence, labelText: cleanLabel } = splitLabelSequence(labelText);
  const seqSlot = sequence
    ? `<span class="sequence-run" style="white-space:pre">${escapeHtml(sequence)}</span>`
    : `<span class="sequence-run empty-slot" aria-hidden="true">&nbsp;</span>`;

  let textSlot = '';
  if (allowLabelEdit) {
    textSlot = `<span class="label-text-slot"><div class="structured-cell-copy excel-cell-editor is-editable-label" contenteditable="plaintext-only" data-edit-kind="label" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" data-col="${cell.col}" spellcheck="false" role="textbox" aria-label="可编辑标签" title="标签（已允许编辑）">${escapeHtml(cleanLabel)}</div></span>`;
  } else {
    textSlot = `<span class="label-text-slot"><div class="locked-label structured-cell-copy">${escapeHtml(cleanLabel)}</div></span>`;
  }

  return `<div class="label-line-grid label-parent-row">${seqSlot}${textSlot}</div>`;
}

export function renderParagraph(paragraph, cell, record, roleStyles = null, isFirstParagraph = false, row = null) {
  const isHeaderFooter = Boolean(record?.part && /^word\/(?:header|footer)/i.test(record.part) || record?.section?.includes('页眉') || record?.section?.includes('页脚'));
  const isRow0 = (row?.index === 0 || cell?.row === 0);

  // Table Section Header (Row 0) MUST be output 100% as-is without any sequence extraction, stripping, or mutation!
  if (isRow0) {
    const runMarkup = (paragraph.runs || []).map((run) => {
      const runText = escapeHtml(run.text || '').replaceAll('\n', '<br>').replaceAll('\t', '&emsp;');
      return `<span style="${sourceRunStyle(run, null, false)}">${runText}</span>`;
    }).join('');
    return `<div class="label-title-row" style="${sourceParagraphStyle(paragraph, true)}">${runMarkup}</div>`;
  }

  // Header / Footer text: completely suppress body roleStyles and force normal font weight
  if (isHeaderFooter) {
    const runMarkup = (paragraph.runs || []).map((run) => {
      const runText = escapeHtml(run.text || '').replaceAll('\n', '<br>').replaceAll('\t', '&emsp;');
      return `<span style="${sourceRunStyle(run, null, true)}">${runText}</span>`;
    }).join('');
    return `<div style="${sourceParagraphStyle(paragraph, false)}">${runMarkup}</div>`;
  }

  const isSec15 = record?.sectionNumber === 15;
  const isFirstColumn = (cell?.col === 0 || row?.cells?.[0] === cell);
  const isSec8Note = Boolean(record?.sectionNumber === 8 && /无可用的接触限值信息|No exposure limit|根据EC指令/i.test(paragraph.text || cell?.text || ''));

  // Table header identification
  const isTableHeader = cell?.role === 'table-header' || cell?.fontRole === 'label-header' ||
    Boolean(row && (
      /化学品名称.*CAS编号|物质.*依据.*类型/i.test(row.cells.map((c) => c.text).join(' ')) ||
      (record?.sectionNumber === 3 && row.cells.some((c) => /CAS编号|化学品名称/i.test(c.text)))
    ));

  // Value-only single column identification
  const isValueOnly = cell?.role === 'value-only' || cell?.role === 'source-note' || cell?.fontRole === 'value' ||
    Boolean(row && row.cells.length === 1 && (
      (record?.sectionNumber === 13 && /必需遵守适用的国标|处理方法|废弃/i.test(cell.text || '')) ||
      (record?.sectionNumber === 15 && !paragraph.text?.trim()?.endsWith('：')) ||
      (record?.sectionNumber === 16 && /就我们所掌握的知识/i.test(cell.text || ''))
    ));

  // Empty spacer line in content cell: render as non-collapsing visual line spacer
  const isEmptyParagraph = !(paragraph.text || paragraph.rawText || '').trim() && (!paragraph.runs?.length || paragraph.runs.every((r) => !r.text?.trim() && !r.images?.length));
  if (isEmptyParagraph) {
    return `<div class="paragraph-spacer" style="${sourceParagraphStyle(paragraph, isFirstColumn)};min-height:1.2em;line-height:1.2em" aria-hidden="true">&nbsp;</div>`;
  }

  // Sequences extracted only for data rows (Row > 0) in column 0, except Section 15, table headers and value only
  const sequence = (isSec15 || !isFirstColumn || isTableHeader || isValueOnly) ? null : normalizedSequence(paragraph, cell);
  const tier = isTableHeader
    ? 'header'
    : isSec15
      ? 'parent'
      : isValueOnly
        ? 'value'
        : classifyLabelTier(cell, row, paragraph, record);

  const isDataLabelRow = isFirstColumn && !isTableHeader && !isValueOnly && !isSec15 && (row ? row.index > 0 : (cell?.row !== 0)) && (Boolean(sequence) || tier === 'parent' || tier === 'child' || Boolean(cell?.labelText) || /^[^\n：:]{1,100}[：:]/.test(paragraph.text || cell?.text || ''));

  let stripRemaining = sequence?.stripLength || 0;
  const effectiveRoleStyles = roleStyles;
  const runMarkup = (paragraph.runs || []).map((run) => {
    const text = String(run.text || '');
    const remove = Math.min(stripRemaining, text.length);
    stripRemaining -= remove;
    const runText = escapeHtml(text.slice(remove)).replaceAll('\n', '<br>').replaceAll('\t', '&emsp;');
    const images = (run.images || []).map((image) => {
      const target = cell.relationships?.find((item) => item.rid === image.rid)?.target;
      return target ? `<img class="source-inline-image" data-image-target="${escapeHtml(target)}" style="${imageStyle(image)}" alt="DOCX 图像" />` : '';
    }).join('');

    let roleStyle;
    let forceBold = false;
    let forceNormal = false;

    if (isTableHeader) {
      roleStyle = effectiveRoleStyles?.label || { sizeHalfPoints: '24' };
      forceBold = true;
    } else if (isSec15) {
      roleStyle = (run.bold ? effectiveRoleStyles?.label : effectiveRoleStyles?.value) || { sizeHalfPoints: '24' };
    } else if (isValueOnly) {
      roleStyle = effectiveRoleStyles?.value || { sizeHalfPoints: '24' };
      forceNormal = true;
    } else if (isFirstColumn) {
      roleStyle = effectiveRoleStyles?.label || { sizeHalfPoints: '24' };
    } else {
      roleStyle = (run.bold ? effectiveRoleStyles?.label : effectiveRoleStyles?.value) || { sizeHalfPoints: '24' };
    }

    return `<span style="${sourceRunStyle(run, roleStyle, false, forceBold, isSec8Note || forceNormal)}">${runText}${images}</span>`;
  }).join('');

  const sequenceStyle = sequence ? `${sourceRunStyle(paragraph.runs?.[0], { ...(effectiveRoleStyles?.label || {}), sizeHalfPoints: '24' }, false, true)};white-space:pre` : '';
  const tierClass = isTableHeader
    ? 'table-header-row'
    : isSec15
      ? 'label-parent-row'
      : isValueOnly
        ? 'value-only-row'
        : tier === 'parent' ? 'label-parent-row' : tier === 'child' ? 'label-child-row' : tier === 'title' ? 'label-title-row' : '';

  if (isDataLabelRow) {
    if (sequence) {
      return `<div class="label-line-grid ${tierClass}" style="${sourceParagraphStyle(paragraph, isFirstColumn)}"><span class="sequence-run" style="${sequenceStyle}">${escapeHtml(sequence.text)}</span><span class="label-text-slot">${runMarkup}</span></div>`;
    }
    return `<div class="label-line-grid ${tierClass}" style="${sourceParagraphStyle(paragraph, isFirstColumn)}"><span class="sequence-run empty-slot" aria-hidden="true">&nbsp;</span><span class="label-text-slot">${runMarkup}</span></div>`;
  }

  return `<div class="${tierClass}" style="${sourceParagraphStyle(paragraph, isFirstColumn)}">${runMarkup}</div>`;
}

export function wordBorder(border) {
  if (!border || ['nil', 'none'].includes(String(border.val || '').toLowerCase())) return 'none';
  const width = Math.max(0.5, Number(border.size || 4) / 8 * 1.333).toFixed(2);
  const color = border.color && border.color !== 'auto' ? `#${cssValue(border.color)}` : '#b8bec6';
  return `${width}px solid ${color}`;
}

export function sourceCellStyle(cell, tableWidthTwips = null, fallbackGrid = false, record = null) {
  const format = cell?.format || {};
  const paragraph = cell?.paragraphs?.[0];
  const styles = [];
  const widthValue = Number(format.width?.value);
  if (Number.isFinite(widthValue) && widthValue > 0 && Number(tableWidthTwips) > 0) styles.push(`width:${(widthValue / Number(tableWidthTwips) * 100).toFixed(3)}%`);
  if (format.shading?.fill && format.shading.fill !== 'auto' && format.shading.fill !== 'clear') styles.push(`background:#${cssValue(format.shading.fill)}`);
  if (format.verticalAlignment) {
    styles.push(`vertical-align:${format.verticalAlignment === 'center' ? 'middle' : format.verticalAlignment}`);
  } else {
    styles.push('vertical-align:middle');
  }
  const margins = format.margins || {};
  for (const [side, cssSide] of [['top', 'top'], ['start', 'left'], ['bottom', 'bottom'], ['end', 'right']]) {
    const value = twipsToPx(margins[side]?.value);
    if (value) styles.push(`padding-${cssSide}:${value}`);
  }
  if (!fallbackGrid) {
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (format.borders?.[side] && !['nil', 'none'].includes(String(format.borders[side].val || '').toLowerCase())) styles.push(`border-${side}:${wordBorder(format.borders[side])}`);
    }
  }
  const alignment = paragraph?.format?.alignment;
  if (alignment && cell?.col !== 0) styles.push(`text-align:${alignment === 'both' ? 'justify' : alignment}`);
  const line = Number(paragraph?.format?.spacing?.line);
  if (Number.isFinite(line) && line > 0) styles.push(`line-height:${(line / 240).toFixed(2)}`);
  const isLabelCol = (cell?.col === 0 || cell?.role === 'table-header' || cell?.fontRole === 'label-header');
  if (isLabelCol) {
    const isPureTwoCol = Boolean(record && (
      (Array.isArray(record.structure?.gridWidthsTwips) && record.structure.gridWidthsTwips.length === 2) ||
      (Number(record.structure?.columnCount) === 2) ||
      (Array.isArray(record.rows?.[0]?.cells) && record.rows[0].cells.length === 2)
    ));
    const minWidth = (isPureTwoCol && cell?.col === 0 && (Number(cell?.colspan || 1) === 1)) ? '175px' : '110px';
    styles.push(`min-width:${minWidth}`);
    styles.push('word-break:normal;overflow-wrap:break-word');
  } else {
    styles.push('word-break:break-word;overflow-wrap:anywhere');
  }
  return styles.join(';');
}

export function sourceRowStyle(row, divisor = 1) {
  const rawHeight = Number(row?.properties?.height?.value);
  const height = Number.isFinite(rawHeight) && rawHeight > 0 ? twipsToPx(rawHeight / Math.max(1, divisor)) : null;
  const styles = [];
  if (height) styles.push(`height:${height}`, `min-height:${height}`);
  return styles.join(';');
}

export function sourceColumnMarkup(record) {
  const widths = record?.structure?.gridWidthsTwips || [];
  const total = widths.reduce((sum, width) => sum + (Number(width) || 0), 0);
  return widths.length ? `<colgroup>${widths.map((width) => `<col style="${total ? `width:${(Number(width) / total * 100).toFixed(3)}%` : ''}" />`).join('')}</colgroup>` : '';
}

export function sourceTableStyle(record) {
  return 'width:100%;max-width:none;border:1px solid #6f6f6f';
}

export function needsFallbackGrid(record) {
  return Boolean(record);
}

export function renderCellContent(cell, selectedCellId, record, roleStyles = null, row = null) {
  const isHeaderFooter = Boolean(record?.part && /^word\/(?:header|footer)/i.test(record.part) || record?.section?.includes('页眉') || record?.section?.includes('页脚'));
  const effectiveRoleStyles = isHeaderFooter ? null : roleStyles;
  const isCellEmpty = !cell.text?.trim() && !cell.images?.length;
  if (isCellEmpty && !isHeaderFooter) {
    return `<div class="structured-cell-copy"><span class="muted">空白单元格</span></div>`;
  }
  const text = cell.paragraphs.map((paragraph, index) => renderParagraph(paragraph, cell, record, effectiveRoleStyles, index === 0, row)).join('');
  return `<div class="structured-cell-copy">${text || '<span class="muted">空白单元格</span>'}</div>`;
}

export function renderEditorCell(record, row, cell, tableWidth, fallbackGrid = false, roleStyles = null, isLastCellInRow = false, options = {}) {
  const isRow0 = row.index === 0;
  const allowLabelEdit = Boolean(options.allowLabelEdit);
  const isPresetMode = Boolean(options.isPresetMode);
  let innerMarkup = '';

  if (isRow0) {
    innerMarkup = renderCellContent(cell, '', record, roleStyles, row);
  } else if (cell.editable && cell.valueNodes.length) {
    const labelPart = cell.labelText
      ? renderEditorLabelMarkup(cell.labelText, allowLabelEdit, record, row, cell)
      : '';
    const images = (cell.images || []).map((img) => {
      const target = cell.relationships?.find((item) => item.rid === img.rid)?.target;
      return target ? `<img class="source-inline-image" data-image-target="${escapeHtml(target)}" style="${imageStyle(img)}" alt="DOCX 图像" />` : '';
    }).join('');

    const placeholder = isPresetMode ? '留空则继承普通模式值…' : '点击输入值…';
    const cellValue = cell.valueText || '';
    const hasValue = Boolean(cellValue.trim());

    // 值清空按钮：普通模式与预设模式均支持
    const clearBtn = hasValue
      ? `<button type="button" class="cell-clear-val-btn" data-cell-action="clear-value" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" data-col="${cell.col}" title="一键清空此格内容">✕</button>`
      : '';

    const presetIndicator = isPresetMode
      ? `<span class="preset-mode-cell-tag ${hasValue ? 'tag-has-override' : 'tag-inherited'}">${hasValue ? '预设覆盖' : '留空继承'}</span>`
      : '';

    const cellClass = isPresetMode
      ? (hasValue ? 'is-preset-override-val' : 'is-preset-inherited-val')
      : '';

    const valueEditor = `<div class="structured-cell-copy excel-cell-editor is-editable-value ${cellClass}" contenteditable="plaintext-only" data-edit-kind="value" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" data-col="${cell.col}" data-placeholder="${placeholder}" spellcheck="false" role="textbox" aria-label="可编辑值">${escapeHtml(cellValue)}</div>`;
    
    innerMarkup = `<div class="editor-cell-wrapper">${labelPart}${images}${valueEditor}${clearBtn}${presetIndicator}</div>`;
  } else if (cell.labelText) {
    if (allowLabelEdit) {
      innerMarkup = renderEditorLabelMarkup(cell.labelText, true, record, row, cell);
    } else {
      innerMarkup = renderCellContent(cell, '', record, roleStyles, row);
    }
  } else {
    innerMarkup = renderCellContent(cell, '', record, roleStyles, row);
  }

  const canMoveUp = row.index > 1;
  const canMoveDown = row.index < (record.rows?.length || 1) - 1;

  const floatingActions = (!isRow0 && isLastCellInRow)
    ? `<div class="row-floating-actions" aria-hidden="false"><button type="button" class="row-mini-btn btn-move" data-row-action="move-up" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" title="上移行" ${canMoveUp ? '' : 'disabled'}>↑</button><button type="button" class="row-mini-btn btn-move" data-row-action="move-down" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" title="下移行" ${canMoveDown ? '' : 'disabled'}>↓</button><button type="button" class="row-mini-btn" data-row-action="add" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" title="在此行后新增同构数据行">＋</button><button type="button" class="row-mini-btn btn-note wide" data-row-action="add-note" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" title="在此行后插入单列说明行">＋注</button><button type="button" class="row-mini-btn danger" data-row-action="delete" data-record-id="${escapeHtml(record.id)}" data-row="${row.index}" title="删除行" ${record.rows.length <= 2 ? 'disabled' : ''}>－</button></div>`
    : '';

  const totalRows = record.rows?.length || 1;
  const maxPossibleSpan = Math.max(1, totalRows - (row.index ?? 0));
  const effectiveRowspan = Math.min(Number(cell.rowspan) || 1, maxPossibleSpan);

  return `<td colspan="${cell.colspan}" rowspan="${effectiveRowspan}" style="${sourceCellStyle(cell, tableWidth, fallbackGrid, record)}" class="editor-cell ${cell.editable ? 'is-editable' : 'is-protected'}" data-anchor-section="${record.sectionNumber || ''}" data-anchor-row="${row.index}" data-anchor-col="${cell.col}" data-anchor-role="${cell.role || (cell.labelText ? 'label' : 'value')}">${innerMarkup}${floatingActions}</td>`;
}

export function renderEditorTable(record, options = {}) {
  const width = (record.structure?.gridWidthsTwips || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const fallbackGrid = needsFallbackGrid(record);
  const roleStyles = options.roleStyles || null;

  return `
    <div class="table-scroll">
      <table class="structured-table editor-excel-table" style="${sourceTableStyle(record)}">
        ${sourceColumnMarkup(record)}
        <tbody>
          ${record.rows.map((row) => `
            <tr class="editor-row ${row.index === 0 ? 'title-row' : ''}" style="${sourceRowStyle(row)}" data-row-index="${row.index}">
              ${row.cells.map((cell, cellIdx) => renderEditorCell(record, row, cell, width, fallbackGrid, roleStyles, cellIdx === row.cells.length - 1, options)).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
