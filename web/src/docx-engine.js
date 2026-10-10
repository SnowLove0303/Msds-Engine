import JSZip from 'jszip';

export const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
export const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
export const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
export const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';

const parser = () => new DOMParser();
const serializer = () => new XMLSerializer();

export class DocxEngineError extends Error {
  constructor(message, code = 'DOCX_ERROR') {
    super(message);
    this.name = 'DocxEngineError';
    this.code = code;
  }
}

const localName = (node) => (node?.localName || node?.nodeName || '').split(':').pop();
const directChildren = (node, name) => Array.from(node?.childNodes || []).filter((child) => child.nodeType === 1 && (!name || localName(child) === name));
const descendants = (node, name) => Array.from(node?.getElementsByTagNameNS?.(W_NS, name) || []);
const descendantsAny = (node, name) => Array.from(node?.getElementsByTagName?.(`w:${name}`) || []);
const firstChild = (node, name) => directChildren(node, name)[0] || null;

function attr(node, namespace, name, fallback = null) {
  if (!node) return fallback;
  return node.getAttributeNS?.(namespace, name)
    ?? node.getAttribute?.(`w:${name}`)
    ?? node.getAttribute?.(name)
    ?? fallback;
}

function anyAttr(node, namespace, name, fallback = null) {
  if (!node) return fallback;
  return node.getAttributeNS?.(namespace, name)
    ?? node.getAttribute?.(name)
    ?? fallback;
}

function boolValue(node, fallback = true) {
  if (!node) return fallback;
  const value = attr(node, W_NS, 'val');
  return value == null || !['0', 'false', 'off', 'no'].includes(String(value).toLowerCase());
}

function numberValue(node, name) {
  const value = attr(node, W_NS, name);
  return value == null ? null : Number.isNaN(Number(value)) ? value : Number(value);
}

function parseXml(text, label) {
  const xml = parser().parseFromString(text, 'application/xml');
  const parserError = xml.getElementsByTagName?.('parsererror')?.[0];
  if (parserError) throw new DocxEngineError(`${label} 不是有效的 XML：${parserError.textContent}`, 'INVALID_XML');
  return xml;
}

function formatNumber(value, format) {
  const number = Number(value || 1);
  if (format === 'lowerLetter' || format === 'upperLetter') {
    let result = '';
    let current = number;
    while (current > 0) {
      current -= 1;
      result = String.fromCharCode(97 + (current % 26)) + result;
      current = Math.floor(current / 26);
    }
    return format === 'upperLetter' ? result.toUpperCase() : result;
  }
  if (format === 'lowerRoman' || format === 'upperRoman') {
    const values = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    let result = '';
    let current = number;
    for (const [unit, glyph] of values) {
      while (current >= unit) {
        result += glyph;
        current -= unit;
      }
    }
    return format === 'upperRoman' ? result.toUpperCase() : result;
  }
  return String(number);
}

function parseNumberingDefinitions(xmlText) {
  if (!xmlText) return { nums: new Map(), abstracts: new Map() };
  const xml = parseXml(xmlText, 'word/numbering.xml');
  const abstracts = new Map();
  for (const abstract of descendants(xml, 'abstractNum')) {
    const id = attr(abstract, W_NS, 'abstractNumId');
    const levels = new Map();
    for (const level of directChildren(abstract, 'lvl')) {
      const ilvl = Number(attr(level, W_NS, 'ilvl') || 0);
      levels.set(ilvl, {
        start: Number(attr(firstChild(level, 'start'), W_NS, 'val') || 1),
        format: attr(firstChild(level, 'numFmt'), W_NS, 'val') || 'decimal',
        text: attr(firstChild(level, 'lvlText'), W_NS, 'val') || `%${ilvl + 1}`,
      });
    }
    abstracts.set(String(id), levels);
  }
  const nums = new Map();
  for (const num of descendants(xml, 'num')) {
    const id = attr(num, W_NS, 'numId');
    const abstractId = attr(firstChild(num, 'abstractNumId'), W_NS, 'val');
    nums.set(String(id), abstracts.get(String(abstractId)) || new Map());
  }
  return { nums, abstracts };
}

function numberingTextForParagraph(paragraph, numbering) {
  if (!numbering?.definitions) return '';
  const pPr = firstChild(paragraph, 'pPr');
  const numPr = firstChild(pPr, 'numPr');
  if (!numPr) return '';
  const numId = attr(firstChild(numPr, 'numId'), W_NS, 'val');
  const ilvl = Number(attr(firstChild(numPr, 'ilvl'), W_NS, 'val') || 0);
  const levels = numbering.definitions.nums.get(String(numId));
  const level = levels?.get(ilvl);
  if (!level) return '';
  const key = String(numId);
  const counters = numbering.state[key] || (numbering.state[key] = []);
  const previous = counters[ilvl] || 0;
  counters[ilvl] = previous ? previous + 1 : level.start;
  for (let index = ilvl + 1; index < counters.length; index += 1) counters[index] = 0;
  const label = level.text.replace(/%(\d+)/g, (_, token) => {
    const index = Number(token) - 1;
    const referenced = levels.get(index) || level;
    return formatNumber(counters[index] || referenced.start, referenced.format);
  });
  return label;
}

function directProperties(node) {
  if (!node) return {};
  return Object.fromEntries(directChildren(node).map((child) => [localName(child), Object.fromEntries(
    Array.from(child.attributes || []).map((item) => [localName(item), item.value]),
  )]));
}

function parseRunFormat(run) {
  const props = firstChild(run, 'rPr');
  const fonts = firstChild(props, 'rFonts');
  const color = firstChild(props, 'color');
  const size = firstChild(props, 'sz');
  const format = {
    bold: boolValue(firstChild(props, 'b'), false),
    italic: boolValue(firstChild(props, 'i'), false),
    underline: attr(firstChild(props, 'u'), W_NS, 'val'),
    strike: boolValue(firstChild(props, 'strike'), false),
    font: attr(fonts, W_NS, 'eastAsia') || attr(fonts, W_NS, 'ascii'),
    sizeHalfPoints: attr(size, W_NS, 'val'),
    color: attr(color, W_NS, 'val'),
    highlight: attr(firstChild(props, 'highlight'), W_NS, 'val'),
    verticalAlignment: attr(firstChild(props, 'vertAlign'), W_NS, 'val'),
    direct: directProperties(props),
  };
  return format;
}

function parseParagraphFormat(paragraph) {
  const props = firstChild(paragraph, 'pPr');
  const indent = firstChild(props, 'ind');
  const spacing = firstChild(props, 'spacing');
  return {
    style: attr(firstChild(props, 'pStyle'), W_NS, 'val'),
    alignment: attr(firstChild(props, 'jc'), W_NS, 'val'),
    indent: Object.fromEntries(['left', 'right', 'firstLine', 'hanging'].map((name) => [name, attr(indent, W_NS, name)])),
    spacing: Object.fromEntries(['before', 'after', 'line', 'lineRule'].map((name) => [name, attr(spacing, W_NS, name)])),
    direct: directProperties(props),
  };
}

function parseBorderSet(node) {
  const result = {};
  for (const border of directChildren(node)) {
    result[localName(border)] = {
      val: attr(border, W_NS, 'val'),
      size: attr(border, W_NS, 'sz'),
      color: attr(border, W_NS, 'color'),
      space: attr(border, W_NS, 'space'),
    };
  }
  return result;
}

function parseTableProperties(tbl) {
  const props = firstChild(tbl, 'tblPr');
  const borders = firstChild(props, 'tblBorders');
  const shading = firstChild(props, 'shd');
  const width = firstChild(props, 'tblW');
  return {
    width: { value: attr(width, W_NS, 'w'), type: attr(width, W_NS, 'type') },
    alignment: attr(firstChild(props, 'jc'), W_NS, 'val'),
    layout: attr(firstChild(props, 'tblLayout'), W_NS, 'type'),
    borders: parseBorderSet(borders),
    shading: { fill: attr(shading, W_NS, 'fill'), pattern: attr(shading, W_NS, 'val') },
    direct: directProperties(props),
  };
}

function parseRowProperties(row) {
  const props = firstChild(row, 'trPr');
  const height = firstChild(props, 'trHeight');
  return {
    height: { value: attr(height, W_NS, 'val'), rule: attr(height, W_NS, 'hRule') },
    cantSplit: boolValue(firstChild(props, 'cantSplit'), false),
    header: boolValue(firstChild(props, 'tblHeader'), false),
    gridBefore: numberValue(firstChild(props, 'gridBefore'), 'val') || 0,
    gridAfter: numberValue(firstChild(props, 'gridAfter'), 'val') || 0,
    direct: directProperties(props),
  };
}

function parseCellProperties(cell) {
  const props = firstChild(cell, 'tcPr');
  const width = firstChild(props, 'tcW');
  const span = firstChild(props, 'gridSpan');
  const vertical = firstChild(props, 'vMerge');
  const shading = firstChild(props, 'shd');
  const margins = firstChild(props, 'tcMar');
  return {
    width: { value: attr(width, W_NS, 'w'), type: attr(width, W_NS, 'type') },
    gridSpan: Math.max(1, Number(attr(span, W_NS, 'val') || 1)),
    vMerge: vertical ? (attr(vertical, W_NS, 'val') || 'continue') : null,
    shading: { fill: attr(shading, W_NS, 'fill'), pattern: attr(shading, W_NS, 'val') },
    margins: Object.fromEntries(directChildren(margins).map((item) => [localName(item), {
      value: attr(item, W_NS, 'w'), type: attr(item, W_NS, 'type'),
    }])),
    borders: parseBorderSet(firstChild(props, 'tcBorders')),
    verticalAlignment: attr(firstChild(props, 'vAlign'), W_NS, 'val'),
    direct: directProperties(props),
  };
}

function parseRun(run) {
  const textNodes = descendants(run, 't');
  const textParts = [];
  for (const child of Array.from(run.childNodes || [])) {
    if (child.nodeType !== 1) continue;
    if (localName(child) === 't') textParts.push(child.textContent || '');
    if (localName(child) === 'tab') textParts.push('\t');
    if (localName(child) === 'br' || localName(child) === 'cr') textParts.push('\n');
  }
  const blips = Array.from(run.getElementsByTagNameNS?.(A_NS, 'blip') || []);
  const images = blips.map((blip) => ({
    rid: blip.getAttributeNS?.(R_NS, 'embed') || blip.getAttribute?.('r:embed'),
    node: blip,
    extent: (() => {
      const drawing = blip.parentNode?.parentNode?.parentNode;
      const extent = drawing?.getElementsByTagNameNS?.(WP_NS, 'extent')?.[0];
      return extent ? { widthEmu: extent.getAttribute('cx'), heightEmu: extent.getAttribute('cy') } : null;
    })(),
  })).filter((image) => image.rid);
  return {
    node: run,
    textNodes,
    text: textParts.join(''),
    bold: parseRunFormat(run).bold,
    format: parseRunFormat(run),
    images,
  };
}

function parseParagraph(paragraph, numbering = null) {
  const runs = descendants(paragraph, 'r').map(parseRun);
  const segments = [];
  for (const run of runs) {
    if (run.text) segments.push({ type: 'text', text: run.text, run });
    for (const image of run.images) segments.push({ type: 'image', image, run });
  }
  let rawText = segments.filter((segment) => segment.type === 'text').map((segment) => segment.text).join('');
  if (!rawText && segments.some((segment) => segment.type === 'image')) {
    rawText = '[象形图]';
  }
  const numberingText = numberingTextForParagraph(paragraph, numbering);
  return {
    node: paragraph,
    text: `${numberingText}${rawText}`,
    rawText,
    numberingText,
    runs,
    segments,
    format: parseParagraphFormat(paragraph),
  };
}

function cellText(cell) {
  return cell.paragraphs.map((paragraph) => paragraph.text).join('\n').trim();
}

function isPunctuationOnly(str) {
  return !str || /^[。.,:：;；、\-—\s/／()（）\[\]【】"'“”‘’!！?？]+$/.test(str.trim());
}

function isSectionTitle(str) {
  return /^\s*(?:v)?\d{1,2}[\.、\s]/i.test(str) && /(?:标识|概述|成分|急救|消防|泄漏|操作|接触|理化|稳定|毒|生态|废弃|运输|法规|其他|Identification|Hazards|Composition|First|Fire|Accidental|Handling|Exposure|Physical|Stability|Toxicological|Ecological|Disposal|Transport|Regulatory|Other)/i.test(str);
}

export function cellRole(cell) {
  const labelParts = [];
  const valueParts = [];
  const labelNodes = [];
  const valueNodes = [];

  const allRunsAreBold = cell.paragraphs.length > 0 && cell.paragraphs.every((p) => p.runs.length > 0 && p.runs.every((r) => r.bold));
  const cellEndsWithColon = /[：:]$/.test(cell.text.trim());
  const isPureMultiLineLabel = cell.col === 0 && allRunsAreBold && cellEndsWithColon;

  for (const paragraph of cell.paragraphs) {
    const boldRuns = paragraph.runs.filter((run) => run.bold);
    const notBoldRuns = paragraph.runs.filter((run) => !run.bold);
    const boldText = boldRuns.map((run) => run.text).join('').trim();
    const notBoldText = notBoldRuns.map((run) => run.text).join('').trim();
    const num = paragraph.numberingText?.trim();

    if (notBoldRuns.length > 0 && !num) {
      if (notBoldText) valueParts.push(notBoldText);
      valueNodes.push(...notBoldRuns.flatMap((r) => r.textNodes));
    }

    if (boldText) {
      // 1. Pure punctuation filter (e.g. "。")
      if (isPunctuationOnly(boldText)) {
        valueParts.push(boldText);
        valueNodes.push(...boldRuns.flatMap((r) => r.textNodes));
        continue;
      }

      if (isPureMultiLineLabel) {
        const hasNumInBold = /^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(boldText);
        const fullLabel = (num && !hasNumInBold) ? `${num}  ${boldText}` : boldText;
        labelParts.push(fullLabel);
        labelNodes.push(...boldRuns.flatMap((r) => r.textNodes));
        continue;
      }

      // 2. Check for inline colon separating label and value within fully bold paragraph
      const inlineColon = boldText.match(/^([^：:\n]{1,50}[：:])\s*(.+)$/);
      if (inlineColon) {
        const fullLabel = (num && !/^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(inlineColon[1]))
          ? `${num}  ${inlineColon[1]}`
          : inlineColon[1];
        labelParts.push(fullLabel);
        valueParts.push(inlineColon[2]);
        labelNodes.push(...boldRuns.flatMap((r) => r.textNodes));
        valueNodes.push(...boldRuns.flatMap((r) => r.textNodes));
        continue;
      }

      // 3. Header and structural keyword protection: Table headers and sublabels are never values!
      const isHeaderKeyword = /^(?:CAS编号|CAS\s*(?:NO\.?|Number)?|化学品名称|Chemical\s*name|含量|Concentration|物质|Substance|依据|Basis|类型|Type|数值|Value|项目|Item|指标|Index|规格|Specification|成分|Component|Ingredient|Ingredients|防护手套|Protective\s*gloves|生育力|Fertility|致畸形|Teratogenicity|体外遗传毒性|In\s*vitro\s*genotoxicity|经口|Oral|经皮|Dermal|吸入|Inhalation|工作场所组分控制参数|Control\s*parameters\s*(?:for\s*workplace\s*components)?|工作场所|Workplace)/i.test(boldText.trim());

      // 4. Col > 0 context: In data/value columns, demote to value ONLY if NOT a header keyword and length > 12
      if (cell.col > 0 && !isHeaderKeyword) {
        const isExplicitSubLabel = (/[：:]$/.test(boldText) && (/[a-zA-Z]/.test(boldText) ? boldText.length <= 40 : boldText.length <= 15)) || boldText.length <= 8;
        if (!isExplicitSubLabel) {
          valueParts.push(boldText);
          valueNodes.push(...boldRuns.flatMap((r) => r.textNodes));
          continue;
        }
      }

      // 5. Character count rule: labels are short (<= 15 chars for CN, <= 60 for EN) or end with colon or are section titles or have property number prefix or num
      const endsWithColon = /[：:]$/.test(boldText) || /[：:]$/.test(paragraph.text?.trim() || '');
      const isSecTitle = isSectionTitle(boldText) || (num && isSectionTitle(`${num} ${boldText}`));
      const isShortLabel = (/[a-zA-Z]/.test(boldText) ? boldText.length <= 60 : boldText.length <= 15) || isHeaderKeyword;
      const hasPropertyNumberPrefix = /^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(boldText) && (/[a-zA-Z]/.test(boldText) ? boldText.length <= 70 : boldText.length <= 25);
      const isNumbered = Boolean(num) && (boldText.length <= 35 || endsWithColon);

      if (!isShortLabel && !endsWithColon && !isSecTitle && !hasPropertyNumberPrefix && !isNumbered) {
        // Demote to value! This is a long bold sentence/paragraph (e.g. "根据EC指令...", "在着火或爆炸情况下..."), not a slot label
        const fullVal = (num && !/^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(boldText))
          ? `${num}  ${boldText}`
          : boldText;
        valueParts.push(fullVal);
        valueNodes.push(...boldRuns.flatMap((r) => r.textNodes));
      } else {
        // Legitimate label
        const hasNumInBold = /^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(boldText);
        const fullLabel = (num && !hasNumInBold) ? `${num}  ${boldText}` : boldText;
        labelParts.push(fullLabel);
        labelNodes.push(...boldRuns.flatMap((r) => r.textNodes));
      }
    } else if (num) {
      const raw = paragraph.rawText?.trim() || '';
      const hasNumInRaw = /^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(raw);
      const fullLabel = (num && !hasNumInRaw) ? `${num}  ${raw}` : (raw || num);
      labelParts.push(fullLabel);
      labelNodes.push(...paragraph.runs.flatMap((r) => r.textNodes));
    }
  }

  const labelText = labelParts.join('\n').trim();
  const valueText = valueParts.join('\n').trim();
  const labelLike = labelText || (!valueText && /[：:]$/.test(cell.text) && cell.text.length < 100);
  const explicitLabelSequence = cell.col === 0 && Boolean(labelLike) && /^\s*(?:v)?\d+(?:[\.．、]\d+)*(?=\s|[、）:：.]|[\u4e00-\u9fffA-Za-z]|$)/i.test(cell.text);
  const sequence = Boolean(explicitLabelSequence) || cell.paragraphs.some((p) => Boolean(p.numberingText?.trim()));

  return {
    labelText,
    valueText,
    valueNodes,
    labelNodes,
    sequence,
    kind: labelLike && valueText ? 'label-value' : labelLike ? 'label-only' : cell.paragraphs.length === 1 && !labelText ? 'note' : valueText ? 'value-only' : 'structure',
  };
}

function parseCell(tc, rowIndex, column, span, rowNode, numbering = null) {
  const paragraphs = directChildren(tc, 'p').map((paragraph) => parseParagraph(paragraph, numbering));
  const nestedTables = descendants(tc, 'tbl').length;
  const images = paragraphs.flatMap((paragraph) => paragraph.segments.filter((segment) => segment.type === 'image').map((segment) => segment.image));
  const cell = {
    node: tc,
    row: rowIndex,
    col: column,
    colspan: span,
    rowspan: 1,
    rowNode,
    paragraphs,
    text: cellText({ paragraphs }),
    images,
    format: parseCellProperties(tc),
    align: paragraphs[0]?.format?.alignment || 'left',
  };
  Object.assign(cell, cellRole(cell));
  cell.nestedTableCount = nestedTables;
  return cell;
}

function textOfRecord(record) {
  return [record.title, ...record.rows.flatMap((row) => row.cells.map((cell) => cell.text))].filter(Boolean).join(' ');
}

function sectionInfo(title, tableIndex) {
  const rawTitle = String(title || '');
  const match = rawTitle.match(/^\s*v?(\d{1,2})\s*[\.、\s]/i);
  let sectionNumber = match ? Number(match[1]) : null;
  if (!sectionNumber) {
    const normalized = String(title || '').replace(/[\s/]+/g, ' ').trim().toLowerCase();
    const aliases = [
      [/^(物料及供应商标识|产品及公司标识|identification)/i, 1],
      [/^(危险性概述|hazards identification)/i, 2],
      [/^(组成\/成分信息|composition)/i, 3],
      [/^(急救措施|first aid)/i, 4],
      [/^(消防措施|fire fighting)/i, 5],
      [/^(泄漏应急处理|accidental leakage)/i, 6],
      [/^(操作处置与储存|operation and storage)/i, 7],
      [/^(接触控制|exposure control)/i, 8],
      [/^(理化特性|physical and chemical properties)/i, 9],
      [/^(稳定性和反应性|stability and reactivity)/i, 10],
      [/^(毒理学资料|toxicity information)/i, 11],
      [/^(生态学资料|ecological information)/i, 12],
      [/^(废弃处置|handling precautions)/i, 13],
      [/^(运输信息|transportation information)/i, 14],
      [/^(法规信息|regulatory information)/i, 15],
      [/^(其他信息|other information)/i, 16],
    ];
    sectionNumber = aliases.find(([pattern]) => pattern.test(normalized))?.[1] || null;
  }
  return {
    sectionNumber,
    section: sectionNumber ? `第 ${sectionNumber} 部分` : '未分类',
    title: sectionNumber === 1 ? rawTitle.replace(/^\s*v1\s*[\.、]/i, '1.') : (title || `表格 ${tableIndex + 1}`),
  };
}

function buildFieldCandidates(rows) {
  const candidates = [];
  rows.forEach((row, rowIndex) => {
    row.cells.forEach((cell, cellIndex) => {
      if (!cell.text) return;
      const colon = cell.text.match(/^([^：:\n\t]{1,80})[：:]/);
      const next = row.cells[cellIndex + 1];
      if (next && (colon || cell.labelText) && next.text) {
        candidates.push({
          label: (colon?.[1] || cell.labelText).trim(),
          value: next.text,
          method: 'adjacent_cells',
          source: { label_cell: { row: rowIndex, column: cell.col }, value_cell: { row: rowIndex, column: next.col } },
          evidence: { bold_label: Boolean(cell.labelText), explicit_delimiter: colon?.[0]?.slice(-1) || null },
        });
      }
      if (colon && colon[0].length < cell.text.length) {
        candidates.push({
          label: colon[1].trim(),
          value: cell.text.slice(colon[0].length).trim(),
          method: 'same_cell_colon',
          source: { label_cell: { row: rowIndex, column: cell.col } },
        });
      }
    });
  });
  return candidates;
}

function buildTableRecord(table, tableIndex, partName, relationshipMap, prefix = '', numbering = null) {
  const grid = firstChild(table, 'tblGrid');
  const columns = directChildren(grid, 'gridCol').length || 1;
  const rows = [];
  const activeMerges = new Map();
  const rowNodes = directChildren(table, 'tr');
  rowNodes.forEach((rowNode, rowIndex) => {
    const properties = parseRowProperties(rowNode);
    let column = properties.gridBefore;
    const cells = [];
    const nextMerges = new Map();
    for (const tc of directChildren(rowNode, 'tc')) {
      const format = parseCellProperties(tc);
      const span = format.gridSpan;
      const key = `${column}|${span}`;
      if (format.vMerge && format.vMerge !== 'restart' && activeMerges.has(key)) {
        const origin = activeMerges.get(key);
        origin.rowspan += 1;
        nextMerges.set(key, origin);
      } else {
        const cell = parseCell(tc, rowIndex, column, span, rowNode, numbering);
        cell.format = format;
        cells.push(cell);
        if (format.vMerge) nextMerges.set(key, cell);
      }
      column += span;
    }
    rows.push({ node: rowNode, index: rowIndex, properties, cells });
    activeMerges.clear();
    nextMerges.forEach((value, key) => activeMerges.set(key, value));
  });
  const title = rows.flatMap((row) => row.cells).map((cell) => cell.text).find(Boolean) || `表格 ${tableIndex + 1}`;
  const info = sectionInfo(title, tableIndex);
  const record = {
    id: `${partName}-table-${tableIndex}`,
    kind: 'table',
    part: partName,
    tableIndex,
    title: info.title,
    section: prefix || info.section,
    sectionNumber: info.sectionNumber,
    rows,
    columns,
    fieldCandidates: buildFieldCandidates(rows),
    structure: {
      gridWidthsTwips: directChildren(grid, 'gridCol').map((col) => attr(col, W_NS, 'w')),
      table: parseTableProperties(table),
      rowProperties: rows.map((row) => row.properties),
      rowLayout: rows.map((row) => ({ row: row.index, cells: row.cells.length })),
    },
  };
  record.searchText = textOfRecord(record);
  record.aliases = [];
  if (/H(?:316|320|332)\b/i.test(record.searchText)) record.aliases.push('GHS07', '感叹号', '刺激', '吸入有害', '有害');
  if (/H(?:360|370|373)\b/i.test(record.searchText)) record.aliases.push('GHS08', '健康危害', '生殖毒性', '靶器官');
  record.searchText = `${record.searchText} ${record.aliases.join(' ')}`;
  for (const row of rows) {
    const isHeaderRow = row.index === 0 ||
      /(?:化学品名称.*CAS编号|物质.*依据.*类型|Chemical\s*name.*CAS|Substance.*Basis.*Type)/i.test(row.cells.map((c) => c.text).join(' ')) ||
      (info.sectionNumber === 3 && row.cells.some((c) => /(?:CAS编号|化学品名称|CAS\s*NO|Chemical\s*name)/i.test(c.text)));

    for (const cell of row.cells) {
      cell.record = record;
      cell.relationships = cell.images.map((image) => ({ ...image, target: relationshipMap.get(image.rid) || null }));

      // Section 8 手部防护脏模板残留彻底净化（中英文通用，文本与底层 XML textNodes 同步）
      if (info.sectionNumber === 8 && /(?:手部防护|Hand\s*protection)[：:]\s*喷涂过程中要求有呼吸防护设备/i.test(cell.text)) {
        const isEn = /Hand\s*protection/i.test(cell.text);
        const cleanLabel = isEn ? 'Hand protection：' : '手部防护：';
        cell.text = cleanLabel;
        cell.labelText = cleanLabel;
        cell.valueText = '';
        cell.valueNodes = [];
        cell.kind = 'label-only';
        for (const p of cell.paragraphs) {
          for (const run of p.runs) {
            for (const tn of run.textNodes) {
              if (tn.textContent.includes('喷涂过程中要求有呼吸防护设备')) {
                tn.textContent = tn.textContent.replace(/[\t\s]*喷涂过程中要求有呼吸防护设备[。.]?/, '');
              }
            }
          }
        }
      }

      if (isHeaderRow) {
        cell.editable = false;
        cell.protectedReason = '表头行受保护';
        cell.role = 'table-header';
        cell.fontRole = 'label-header';
        cell.kind = 'label-only';
        if (!cell.labelText && cell.text) {
          cell.labelText = cell.text;
          cell.valueText = '';
          cell.labelNodes = cell.paragraphs.flatMap((p) => p.runs.flatMap((r) => r.textNodes));
          cell.valueNodes = [];
        }
        for (const p of cell.paragraphs) {
          for (const r of p.runs) {
            r.bold = true;
            if (r.format) r.format.bold = true;
            if (r.node && r.node.ownerDocument) {
              let rPr = firstChild(r.node, 'rPr');
              if (!rPr) {
                rPr = r.node.ownerDocument.createElementNS(W_NS, 'w:rPr');
                r.node.insertBefore(rPr, r.node.firstChild);
              }
              if (!firstChild(rPr, 'b')) {
                const bEl = r.node.ownerDocument.createElementNS(W_NS, 'w:b');
                rPr.appendChild(bEl);
              }
            }
          }
        }
      } else {
        // 单列无标签独立说明行（如 Section 13 废弃处置、Section 15 法规清单、Section 16 免责声明）识别为 value-only
        const isSingleColValueRow = row.cells.length === 1 && (
          (info.sectionNumber === 13 && /必需遵守适用的国标|处理方法|废弃/i.test(cell.text)) ||
          (info.sectionNumber === 15 && !cell.text.endsWith('：')) ||
          (info.sectionNumber === 16 && /就我们所掌握的知识/i.test(cell.text))
        );
        if (isSingleColValueRow) {
          cell.role = 'value-only';
          cell.fontRole = 'value';
        }

        // Section 11 生殖毒性子项（生育力、致畸形、体外遗传毒性）及 Section 8 建议 行右侧值格特别允许写入
        const isS11SubValueCell = info.sectionNumber === 11 &&
          row.cells.length >= 2 &&
          cell === row.cells[row.cells.length - 1] &&
          row.cells.some((c) => /生育力|致畸形|体外遗传毒性|Fertility|Teratogenicity|In\s*vitro\s*genotoxicity/i.test(c.text));

        const isS8RecoValueCell = info.sectionNumber === 8 &&
          row.cells.length >= 2 &&
          cell === row.cells[row.cells.length - 1] &&
          row.cells.some((c) => /(?:建议|Recommendation)[：:]/i.test(c.text));

        // 统一规则：多列数据行末尾非标签格均作为可编辑值格（即使模板初始为空）
        const isEndValueCell = row.cells.length > 1 &&
          cell === row.cells[row.cells.length - 1] &&
          cell.kind !== 'label-only' &&
          !cell.sequence;

        if (isS11SubValueCell || isS8RecoValueCell || isEndValueCell) {
          cell.editable = true;
          cell.protectedReason = null;
          if (cell.kind === 'label-only') cell.kind = 'note';
        } else {
          cell.editable = cell.valueNodes.length > 0 && !cell.sequence && cell.kind !== 'label-only';
          cell.protectedReason = cell.sequence ? '序号/结构内容受保护' : cell.kind === 'label-only' ? '标签默认锁定' : null;
        }
      }
    }
  }
  return record;
}

function buildRelationshipMap(text) {
  if (!text) return new Map();
  const xml = parseXml(text, '关系文件');
  return new Map(Array.from(xml.getElementsByTagNameNS?.(PKG_REL_NS, 'Relationship') || []).map((item) => [
    item.getAttribute('Id'), item.getAttribute('Target'),
  ]));
}

function partXmlKey(name) {
  return name.startsWith('/') ? name.slice(1) : name;
}

function sourceOoxml(engine) {
  const result = {
    'word/document.xml': serializer().serializeToString(engine.documentXml),
  };
  for (const [name, xml] of Object.entries(engine.supportingXml || {})) result[name] = xml;
  return result;
}

function deriveRoleStyles(records) {
  let label = null;
  let value = null;
  for (const record of records || []) {
    if (record.kind !== 'table' || record.part !== 'word/document.xml') continue;
    for (const row of record.rows) {
      if (row.index === 0) continue;
      for (const cell of row.cells) {
        for (const paragraph of cell.paragraphs) {
          for (const run of paragraph.runs) {
            if (!run.text?.trim()) continue;
            if (!label && run.bold) label = { ...run.format };
            if (!value && !run.bold) value = { ...run.format };
            if (label && value) break;
          }
          if (label && value) break;
        }
        if (label && value) break;
      }
      if (label && value) break;
    }
    if (label && value) break;
  }
  return {
    label: {
      font: label?.font || '宋体',
      sizeHalfPoints: '24',
      bold: true,
    },
    value: {
      font: value?.font || label?.font || '宋体',
      sizeHalfPoints: '24',
      bold: false,
    },
  };
}

function parsePartRecords(xml, partName, relationshipMap, prefix = '', numbering = null) {
  const root = xml.documentElement;
  const records = [];
  let tableIndex = 0;
  for (const child of directChildren(root, 'body').flatMap((body) => directChildren(body))) {
    if (localName(child) === 'tbl') {
      records.push(buildTableRecord(child, tableIndex, partName, relationshipMap, prefix, numbering));
      tableIndex += 1;
    } else if (localName(child) === 'p') {
      const paragraph = parseParagraph(child, numbering);
      if (paragraph.text || paragraph.segments.length) {
        records.push({
          id: `${partName}-paragraph-${records.length}`,
          kind: 'text',
          part: partName,
          title: paragraph.text.slice(0, 80) || '文档正文',
          text: paragraph.text,
          content: paragraph.segments,
          paragraph,
          section: prefix || '文档正文',
          sectionNumber: null,
          searchText: paragraph.text,
        });
      }
    }
  }
  // Header/footer XML has a flat part root instead of w:body.
  if (!records.length) {
    for (const child of directChildren(root)) {
      if (localName(child) === 'tbl') records.push(buildTableRecord(child, tableIndex++, partName, relationshipMap, prefix, numbering));
      if (localName(child) === 'p') {
        const paragraph = parseParagraph(child, numbering);
        if (paragraph.text) records.push({ id: `${partName}-paragraph-${records.length}`, kind: 'text', part: partName, title: paragraph.text.slice(0, 80), text: paragraph.text, content: paragraph.segments, paragraph, section: prefix || '正文', sectionNumber: null, searchText: paragraph.text });
      }
    }
  }
  return records;
}

function countUnsupported(xmlText) {
  const unsupported = ['instrText', 'delText', 'sym', 'object', 'pict'];
  const xml = parseXml(xmlText, '文档 XML');
  return unsupported.flatMap((name) => {
    const count = descendants(xml, name).length || descendantsAny(xml, name).length;
    return count ? [{ code: 'source_ooxml_not_normalized', element: `w:${name}`, count, message: '元素原样保存在 DOCX 包中，当前结构化视图未展开该元素。' }] : [];
  });
}

function allXmlEntries(zip) {
  return Object.values(zip.files).filter((entry) => !entry.dir && entry.name.endsWith('.xml'));
}

function portableParagraph(paragraph) {
  return {
    text: paragraph.text,
    format: paragraph.format,
    content: paragraph.segments.map((segment) => segment.type === 'text' ? {
      type: 'text', text: segment.text, runFormat: segment.run.format,
    } : { type: 'image', image: { rid: segment.image.rid } }),
  };
}

function portableCell(cell) {
  return {
    row: cell.row,
    col: cell.col,
    colspan: cell.colspan,
    rowspan: cell.rowspan,
    text: cell.text,
    images: cell.relationships?.map((image) => ({ rid: image.rid, target: image.target })) || [],
    paragraphs: cell.paragraphs.map(portableParagraph),
    format: cell.format,
    role: cell.kind,
    editable: cell.editable,
    protectedReason: cell.protectedReason,
  };
}

function portableRecord(record) {
  const base = {
    id: record.id,
    kind: record.kind,
    part: record.part,
    title: record.title,
    section: record.section,
    sectionNumber: record.sectionNumber,
    searchText: record.searchText,
  };
  if (record.kind === 'table') {
    return {
      ...base,
      rows: record.rows.map((row) => ({ index: row.index, properties: row.properties, cells: row.cells.map(portableCell) })),
      columns: record.columns,
      fieldCandidates: record.fieldCandidates,
      structure: record.structure,
    };
  }
  return { ...base, text: record.text, content: record.content?.map((segment) => segment.type === 'text' ? { type: 'text', text: segment.text } : { type: 'image', image: { rid: segment.image.rid } }) };
}

export function portableModel(engine) {
  return {
    schema_version: '1.0',
    name: engine.sourceName,
    source_type: 'docx',
    records: engine.records.map(portableRecord),
    source_ooxml: sourceOoxml(engine),
    recognition_warnings: engine.warnings,
    coverage: engine.coverage,
  };
}

function allTablesInDocument(documentXml) {
  return descendants(documentXml, 'tbl');
}


/**
 * 从引擎中解析结构化页眉页脚数据
 */
export function extractHeaderFooterData(engine) {
  if (!engine) return null;
  const data = {
    title: '物料安全数据表',
    version: 'V1.0',
    model: '',
    company: '广州冠志新材料科技有限公司',
    docCode: '',
    revisionDate: '',
    language: 'CN',
    entity: '冠志',
  };

  // 1. 扫描 supportingXml 中的 header 与 footer
  for (const [partName, xmlText] of Object.entries(engine.supportingXml || {})) {
    if (!/^word\/(?:header|footer)\d+\.xml$/.test(partName) || !xmlText) continue;
    try {
      const doc = parseXml(xmlText, partName);
      if (/header/i.test(partName)) {
        // 段落 0: 标题
        const pars = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
        if (pars[0]) {
          const t = pars[0].textContent?.trim();
          if (t) {
            data.title = t;
            if (/MATERIAL SAFETY|SAFETY DATA/i.test(t)) {
              data.language = 'EN';
            }
          }
        }
        // 段落 1: 版本号
        if (pars[1]) {
          const t = pars[1].textContent?.trim();
          const vm = t.match(/Version[：:\s]*(V?[\d.]+)/i);
          if (vm) data.version = vm[1].startsWith('V') ? vm[1] : `V${vm[1]}`;
        }
        // 表格 0: 型号
        const tbl = doc.getElementsByTagNameNS(W_NS, 'tbl')[0];
        if (tbl) {
          const m = tbl.textContent?.trim();
          if (m && !/^(?:PEA-4139|示例型号)$/i.test(m)) {
            data.model = m;
          } else if (!data.model && m) {
            data.model = m;
          }
        }
      } else if (/footer/i.test(partName)) {
        const tbl = doc.getElementsByTagNameNS(W_NS, 'tbl')[0];
        if (tbl) {
          const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
          if (rows[0]) {
            const cells = Array.from(rows[0].getElementsByTagNameNS(W_NS, 'tc'));
            // cell 0: 公司 + 型号-MSDS
            if (cells[0]) {
              const c0Text = cells[0].textContent?.trim() || '';
              // 公司提取
              if (/国彩|Guocai/i.test(c0Text)) {
                data.company = /Guocai/i.test(c0Text) ? 'Yingde Guocai New Material Co., Ltd.' : '英德市国彩新材料有限公司';
                data.entity = '国彩';
              } else if (/冠志|Guanzhi/i.test(c0Text)) {
                data.company = /Guanzhi/i.test(c0Text) ? 'Guangzhou Guanzhi New Material Technology Co., Ltd.' : '广州冠志新材料科技有限公司';
                data.entity = '冠志';
              }
              // 型号与编号提取
              const codeM = c0Text.match(/([A-Za-z0-9_-]+)-MSDS/i);
              if (codeM) {
                data.docCode = codeM[0];
                if (!data.model) data.model = codeM[1];
              }
            }
            // cell 1: 修订日期
            if (cells[1]) {
              const c1Text = cells[1].textContent?.trim() || '';
              const dm = c1Text.match(/(\d{4}[年\-\/.\s]\d{1,2}[月\-\/.\s]\d{1,2}日?|\d{4}-\d{1,2}-\d{1,2})/);
              if (dm) {
                data.revisionDate = dm[1].trim();
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  // 2. 辅以 Section 1 的补充推断
  const sec1 = engine.records?.find((r) => r.sectionNumber === 1);
  if (sec1) {
    if (!data.model) {
      data.model = extractProductModelFromEngine(engine);
    }
    const allSec1 = sec1.rows?.flatMap((r) => r.cells.map((c) => c.text || '')).join(' ') || '';
    if (/国彩|Guocai/i.test(allSec1)) {
      data.company = /Guocai/i.test(allSec1) ? 'Yingde Guocai New Material Co., Ltd.' : '英德市国彩新材料有限公司';
      data.entity = '国彩';
    }
  }

  // 3. 辅以 sourceName 提取
  if (!data.model && engine.sourceName) {
    data.model = extractModelFromText(engine.sourceName);
  }

  if (data.model && !data.docCode) {
    data.docCode = `${data.model}-MSDS`;
  }

  if (!data.revisionDate) {
    const d = new Date();
    data.revisionDate = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
  }

  return data;
}

/**
 * 结构化安全更新页眉与页脚，并持久化到 supportingXml 与内存模型
 */
export function updateHeaderFooterData(engine, patch = {}) {
  if (!engine) return null;
  const current = extractHeaderFooterData(engine) || {};
  const next = { ...current, ...patch };

  const targetModel = String(next.model || '').trim();
  const targetCompany = String(next.company || '').trim();
  const targetDate = String(next.revisionDate || '').trim();
  const targetVersion = String(next.version || '').trim();
  const targetTitle = String(next.title || '').trim();

  // 格式化修订日期：去除残留 P 前缀与异形空格
  const cleanDateStr = targetDate.replace(/^[P\s]+/, '').trim();
  const formattedDate = /修订日期|Revision Date/i.test(cleanDateStr)
    ? cleanDateStr
    : (next.language === 'EN' ? `Revision Date: ${cleanDateStr}` : `修订日期：${cleanDateStr}`);

  for (const [partName, xmlText] of Object.entries(engine.supportingXml || {})) {
    if (!/^word\/(?:header|footer)\d+\.xml$/.test(partName) || !xmlText) continue;
    try {
      const doc = parseXml(xmlText, partName);
      let modified = false;

      if (/header/i.test(partName)) {
        const pars = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
        // 1. Header 标题
        if (targetTitle && pars[0]) {
          const p = pars[0];
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          if (runs.length > 0) {
            let t = runs[0].getElementsByTagNameNS(W_NS, 't')[0];
            if (!t) {
              t = doc.createElementNS(W_NS, 'w:t');
              runs[0].appendChild(t);
            }
            t.textContent = targetTitle.startsWith(' ') ? targetTitle : `  ${targetTitle}`;
            for (let i = 1; i < runs.length; i++) p.removeChild(runs[i]);
            modified = true;
          }
        }

        // 2. Header 版本号
        if (targetVersion && pars[1]) {
          const p = pars[1];
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          if (runs.length > 0) {
            let t = runs[0].getElementsByTagNameNS(W_NS, 't')[0];
            if (!t) {
              t = doc.createElementNS(W_NS, 'w:t');
              runs[0].appendChild(t);
            }
            const cleanV = targetVersion.replace(/^Version[：:\s]*/i, '');
            t.textContent = `Version：${cleanV}`;
            for (let i = 1; i < runs.length; i++) p.removeChild(runs[i]);
            modified = true;
          }
        }

        // 3. Header 表格型号
        if (targetModel) {
          const tbl = doc.getElementsByTagNameNS(W_NS, 'tbl')[0];
          if (tbl) {
            const tc = tbl.getElementsByTagNameNS(W_NS, 'tc')[0];
            const p = tc?.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
              if (runs.length > 0) {
                let t = runs[0].getElementsByTagNameNS(W_NS, 't')[0];
                if (!t) {
                  t = doc.createElementNS(W_NS, 'w:t');
                  runs[0].appendChild(t);
                }
                t.textContent = targetModel;
                for (let i = 1; i < runs.length; i++) p.removeChild(runs[i]);
                modified = true;
              }
            }
          }
        }
      } else if (/footer/i.test(partName)) {
        const tbl = doc.getElementsByTagNameNS(W_NS, 'tbl')[0];
        if (tbl) {
          const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
          if (rows[0]) {
            const cells = Array.from(rows[0].getElementsByTagNameNS(W_NS, 'tc'));
            // 1. Footer Row 0 Cell 0: 公司 + 型号-MSDS
            if (cells[0] && (targetCompany || targetModel)) {
              const p = cells[0].getElementsByTagNameNS(W_NS, 'p')[0];
              if (p) {
                const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
                if (runs.length > 0) {
                  let t = runs[0].getElementsByTagNameNS(W_NS, 't')[0];
                  if (!t) {
                    t = doc.createElementNS(W_NS, 'w:t');
                    runs[0].appendChild(t);
                  }
                  const comp = targetCompany || current.company || '广州冠志新材料科技有限公司';
                  const mod = targetModel || current.model || '';
                  t.textContent = mod ? `${comp} ${mod}-MSDS` : comp;
                  for (let i = 1; i < runs.length; i++) p.removeChild(runs[i]);
                  modified = true;
                }
              }
            }

            // 2. Footer Row 0 Cell 1: 修订日期
            if (cells[1] && formattedDate) {
              const p = cells[1].getElementsByTagNameNS(W_NS, 'p')[0];
              if (p) {
                const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
                if (runs.length > 0) {
                  let t = runs[0].getElementsByTagNameNS(W_NS, 't')[0];
                  if (!t) {
                    t = doc.createElementNS(W_NS, 'w:t');
                    runs[0].appendChild(t);
                  }
                  t.textContent = `${formattedDate}   `;
                  for (let i = 1; i < runs.length; i++) p.removeChild(runs[i]);
                  modified = true;
                }
              }
            }
          }
        }
      }

      if (modified) {
        engine.supportingXml[partName] = serializer().serializeToString(doc);
      }
    } catch (e) {
      console.warn('Failed to update header/footer part', partName, e);
    }
  }

  // 同步正文 documentXml 中的示例型号 (如果包含 PEA-4139 等)
  if (targetModel) {
    try {
      const tNodes = Array.from(engine.documentXml.getElementsByTagNameNS(W_NS, 't'));
      for (const t of tNodes) {
        if (/PEA-4139/i.test(t.textContent)) {
          t.textContent = t.textContent.replace(/PEA-4139/g, targetModel);
        }
      }
    } catch (e) {}
  }

  // 刷新内存记录中的 Header/Footer 单元格文本
  engine.headerFooterData = next;
  for (const record of (engine.records || [])) {
    if (record.part && /header/i.test(record.part)) {
      if (record.kind === 'table' && record.rows?.[0]?.cells?.[0] && targetModel) {
        record.rows[0].cells[0].text = targetModel;
      }
    } else if (record.part && /footer/i.test(record.part)) {
      if (record.kind === 'table' && record.rows?.[0]?.cells) {
        if (record.rows[0].cells[0] && (targetCompany || targetModel)) {
          const comp = targetCompany || current.company || '广州冠志新材料科技有限公司';
          const mod = targetModel || current.model || '';
          record.rows[0].cells[0].text = mod ? `${comp} ${mod}-MSDS` : comp;
        }
        if (record.rows[0].cells[1] && formattedDate) {
          record.rows[0].cells[1].text = formattedDate;
        }
      }
    }
  }

  return next;
}

export function stampDocumentIdentity(engine, info = {}) {
  if (!engine) return;
  const patch = typeof info === 'string' ? { model: info } : { ...info };
  if (patch.date && !patch.revisionDate) patch.revisionDate = patch.date;
  return updateHeaderFooterData(engine, patch);
}

export async function loadDocx(source, sourceName = 'document.docx') {
  let safeName = String(sourceName || 'document.docx');
  if (!safeName.toLowerCase().endsWith('.docx')) {
    safeName += '.docx';
  }
  let bytes;
  if (source instanceof ArrayBuffer) bytes = new Uint8Array(source);
  else if (ArrayBuffer.isView(source)) bytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  else if (source?.arrayBuffer) bytes = new Uint8Array(await source.arrayBuffer());
  else throw new DocxEngineError('未能读取 DOCX 文件内容。', 'INVALID_SOURCE');
  let zip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    throw new DocxEngineError(`DOCX 压缩包读取失败：${error.message}`, 'INVALID_PACKAGE');
  }
  const documentEntry = zip.file('word/document.xml');
  if (!documentEntry) throw new DocxEngineError('DOCX 包中缺少 word/document.xml。', 'MISSING_DOCUMENT_XML');
  const documentText = await documentEntry.async('string');
  const documentXml = parseXml(documentText, 'word/document.xml');
  const relsText = await zip.file('word/_rels/document.xml.rels')?.async('string');
  const relationshipMap = buildRelationshipMap(relsText);
  const supportingXml = {};
  for (const name of ['word/styles.xml', 'word/settings.xml', 'word/numbering.xml']) {
    if (zip.file(name)) supportingXml[name] = await zip.file(name).async('string');
  }
  for (const entry of allXmlEntries(zip)) {
    if (/^word\/(?:header|footer)\d+\.xml$/.test(entry.name)) supportingXml[entry.name] = await entry.async('string');
  }
  const numberingDefinitions = parseNumberingDefinitions(supportingXml['word/numbering.xml']);
  const mediaFiles = new Map();
  for (const [name, file] of Object.entries(zip.files)) {
    if (name.startsWith('word/media/') && !file.dir) {
      mediaFiles.set(name, await file.async('uint8array'));
    }
  }
  const engine = {
    sourceName,
    originalBytes: new Uint8Array(bytes),
    zip,
    documentXml,
    supportingXml,
    numberingDefinitions,
    relationshipMap,
    records: [],
    warnings: [],
    coverage: {},
    roleStyles: { label: { bold: true }, value: { bold: false } },
    headerFooterData: null,
    relsText: relsText || '',
    mediaFiles,
    refresh() {
      this.records = [];
      this.warnings = [];
      const numbering = { definitions: this.numberingDefinitions, state: {} };
      this.records.push(...parsePartRecords(this.documentXml, 'word/document.xml', this.relationshipMap, '', numbering));
      for (const [partName, xmlText] of Object.entries(this.supportingXml)) {
        if (!/^word\/(?:header|footer)\d+\.xml$/.test(partName)) continue;
        const partXml = parseXml(xmlText, partName);
        const partRelsName = `word/_rels/${partName.split('/').pop()}.rels`;
        const relText = this.supportingXml[partRelsName];
        this.records.unshift(...parsePartRecords(partXml, partName, buildRelationshipMap(relText), '第 0 部分：页眉 + 页脚', { definitions: this.numberingDefinitions, state: {} }));
      }
      this.roleStyles = deriveRoleStyles(this.records);
      const bodyTables = allTablesInDocument(this.documentXml);
      this.coverage = {
        body_table_xml_count: bodyTables.length,
        normalized_body_table_count: this.records.filter((record) => record.part === 'word/document.xml' && record.kind === 'table').length,
        table_count_matches: bodyTables.length === this.records.filter((record) => record.part === 'word/document.xml' && record.kind === 'table').length,
        normalized_cell_count: this.records.filter((record) => record.kind === 'table').reduce((sum, record) => sum + record.rows.reduce((rowSum, row) => rowSum + row.cells.length, 0), 0),
      };
      for (const entry of allXmlEntries(this.zip)) {
        if (!entry.name.startsWith('word/') || entry.name.endsWith('.rels')) continue;
        // Warnings are diagnostic only; they never modify the package.
        const xml = entry.name === 'word/document.xml' ? serializer().serializeToString(this.documentXml) : this.supportingXml[entry.name];
        if (xml) this.warnings.push(...countUnsupported(xml));
      }
      for (const record of this.records) {
        record.engine = this;
      }
      this.headerFooterData = extractHeaderFooterData(this);
      return this;
    },
    async exportArrayBuffer() {
      const output = await JSZip.loadAsync(this.originalBytes);
      output.file('word/document.xml', serializer().serializeToString(this.documentXml));
      if (this.relsText) {
        output.file('word/_rels/document.xml.rels', this.relsText);
      }
      if (this.mediaFiles) {
        for (const [name, bytes] of this.mediaFiles.entries()) {
          output.file(name, bytes);
        }
      }
      for (const [name, text] of Object.entries(this.supportingXml)) {
        if (/^word\/(?:header|footer)\d+\.xml$/.test(name)) {
          output.file(name, text);
        }
      }
      return output.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    },
    async exportArrayBufferOld() {
      const output = await JSZip.loadAsync(this.originalBytes);
      output.file('word/document.xml', serializer().serializeToString(this.documentXml));
      for (const [name, text] of Object.entries(this.supportingXml)) {
        if (/^word\/(?:header|footer)\d+\.xml$/.test(name)) {
          output.file(name, text);
        }
      }
      return output.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    },
    stampIdentity(info) {
      stampDocumentIdentity(this, info);
      return this;
    },
    async getImageDataUrl(target) {
      const normalized = String(target || '').replace(/^\//, '');
      const entryName = normalized.startsWith('word/') ? normalized : `word/${normalized}`;
      const entry = this.zip.file(entryName);
      if (!entry) return null;
      const extension = entryName.split('.').pop().toLowerCase();
      const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' }[extension] || 'application/octet-stream';
      return `data:${mime};base64,${await entry.async('base64')}`;
    },
    toJSON() { return portableModel(this); },
  };
  engine.refresh();
  return engine;
}

function combinedNodeText(nodes) {
  return nodes.map((node) => node.textContent || '').join('');
}

function refreshParagraphContent(paragraph) {
  const runs = descendants(paragraph.node, 'r').map(parseRun);
  const segments = [];
  for (const run of runs) {
    if (run.text) segments.push({ type: 'text', text: run.text, run });
    for (const image of run.images) segments.push({ type: 'image', image, run });
  }
  const rawText = segments.filter((segment) => segment.type === 'text').map((segment) => segment.text).join('');
  paragraph.runs = runs;
  paragraph.segments = segments;
  paragraph.rawText = rawText;
  paragraph.text = `${paragraph.numberingText || ''}${rawText}`;
}

function refreshCellText(cell) {
  for (const paragraph of cell.paragraphs) refreshParagraphContent(paragraph);
  cell.text = cell.paragraphs.map((paragraph) => paragraph.text).join('\n').trim();
  const role = cellRole(cell);
  cell.labelText = role.labelText;
  cell.valueText = role.valueText;
  cell.valueNodes = role.valueNodes;
  cell.labelNodes = role.labelNodes;
  cell.kind = role.kind;
  cell.sequence = role.sequence;
  if (role.valueNodes.length > 0 && !cell.sequence && cell.row > 0) {
    cell.editable = true;
  }
}

function distributeText(nodes, value) {
  if (!nodes.length) return;
  const clean = String(value ?? '').replace(/\r\n?/g, '\n');
  const weights = nodes.map((node) => Math.max((node.textContent || '').length, 1));
  const total = weights.reduce((sum, item) => sum + item, 0);
  let offset = 0;
  nodes.forEach((node, index) => {
    const end = index === nodes.length - 1 ? clean.length : offset + Math.round(clean.length * weights[index] / total);
    node.textContent = clean.slice(offset, end);
    if (/^\s|\s$/.test(node.textContent)) node.setAttribute('xml:space', 'preserve');
    offset = end;
  });
}

const RUN_PROPERTY_ORDER = [
  'rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike',
  'outline', 'shadow', 'emboss', 'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden',
  'color', 'spacing', 'w', 'kern', 'position', 'sz', 'szCs', 'highlight', 'u', 'effect',
  'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang', 'eastAsianLayout',
  'specVanish', 'oMath',
];

function ensureRunProperties(run) {
  let properties = firstChild(run, 'rPr');
  if (properties) return properties;
  properties = run.ownerDocument.createElementNS(W_NS, 'w:rPr');
  run.insertBefore(properties, run.firstChild);
  return properties;
}

function ensureRunProperty(properties, name) {
  const existing = firstChild(properties, name);
  if (existing) return existing;
  const property = properties.ownerDocument.createElementNS(W_NS, `w:${name}`);
  const rank = RUN_PROPERTY_ORDER.indexOf(name);
  const next = directChildren(properties).find((item) => {
    const itemRank = RUN_PROPERTY_ORDER.indexOf(localName(item));
    return itemRank > rank;
  });
  if (next) properties.insertBefore(property, next);
  else properties.appendChild(property);
  return property;
}

function setWordValue(element, value) {
  element.setAttributeNS(W_NS, 'w:val', String(value));
}

function runForTextNode(node) {
  let current = node?.parentNode || null;
  while (current && localName(current) !== 'r') current = current.parentNode;
  return current;
}

function isSequenceOnlyRun(run) {
  const text = descendants(run, 't').map((node) => node.textContent || '').join('');
  return /^\s*\d+(?:[.．、]\d+)+\s*$/.test(text);
}

function applyRoleTypography(nodes, roleStyle, defaultBold) {
  const font = roleStyle?.font || '宋体';
  const size = roleStyle?.sizeHalfPoints || '24';
  const bold = roleStyle?.bold ?? defaultBold;
  const runs = new Set(nodes.map(runForTextNode).filter(Boolean));
  for (const run of runs) {
    const properties = ensureRunProperties(run);
    const fonts = ensureRunProperty(properties, 'rFonts');
    fonts.setAttributeNS(W_NS, 'w:eastAsia', font);
    if (!isSequenceOnlyRun(run)) {
      setWordValue(ensureRunProperty(properties, 'sz'), size);
      setWordValue(ensureRunProperty(properties, 'szCs'), size);
    }
    setWordValue(ensureRunProperty(properties, 'b'), bold ? '1' : '0');
    setWordValue(ensureRunProperty(properties, 'bCs'), bold ? '1' : '0');
  }
}

function paragraphForNode(node) {
  let current = node?.parentNode || null;
  while (current && localName(current) !== 'p') current = current.parentNode;
  return current;
}

function clearRunTextContent(run) {
  for (const child of directChildren(run)) {
    if (['t', 'br', 'cr', 'tab'].includes(localName(child))) run.removeChild(child);
  }
}

function writeRunTextContent(run, value) {
  clearRunTextContent(run);
  const text = String(value ?? '').replace(/\r\n?/g, '\n');
  const tokens = text.split(/([\n\t])/);
  const anchor = directChildren(run).find((child) => localName(child) !== 'rPr') || null;
  const insert = (node) => run.insertBefore(node, anchor);
  for (const token of tokens) {
    if (token === '\n' || token === '\t') {
      insert(run.ownerDocument.createElementNS(W_NS, `w:${token === '\n' ? 'br' : 'tab'}`));
      continue;
    }
    if (token || tokens.length === 1) {
      const textNode = run.ownerDocument.createElementNS(W_NS, 'w:t');
      textNode.textContent = token;
      if (/^\s|\s$/.test(token)) textNode.setAttribute('xml:space', 'preserve');
      insert(textNode);
    }
  }
}

function paragraphHasContent(paragraph) {
  for (const child of directChildren(paragraph)) {
    const childName = localName(child);
    if (childName === 'pPr') continue;
    if (childName !== 'r') return true;
    for (const runChild of directChildren(child)) {
      const runChildName = localName(runChild);
      if (runChildName === 'rPr') continue;
      if (runChildName === 't' && !(runChild.textContent || '').length) continue;
      return true;
    }
  }
  return false;
}

function replaceCellValueContent(cell, value, roleStyle) {
  const nonBoldRun = cell.paragraphs
    .flatMap((paragraph) => paragraph.runs)
    .find((run) => !run.bold && run.node);

  let destinationRun = nonBoldRun?.node || null;
  let destinationParagraph = nonBoldRun ? paragraphForNode(nonBoldRun.node) : null;

  if (!destinationRun) {
    const targetP = cell.paragraphs[cell.paragraphs.length - 1]?.node || cell.node.getElementsByTagNameNS(W_NS, 'p')[0];
    if (!targetP) throw new DocxEngineError('无法定位该值的 Word 文本段落。', 'VALUE_RUN_NOT_FOUND');
    const newRun = cell.node.ownerDocument.createElementNS(W_NS, 'w:r');
    targetP.appendChild(newRun);
    destinationRun = newRun;
    destinationParagraph = targetP;
  }

  // 严格只清除非加粗运行区，绝不碰任何加粗标签
  const editableRuns = new Set(cell.paragraphs.flatMap((paragraph) => paragraph.runs
    .filter((run) => !run.bold && (run.textNodes.length || /[\n\t]/.test(run.text || '')))
    .map((run) => run.node)));
  for (const run of editableRuns) clearRunTextContent(run);
  writeRunTextContent(destinationRun, value);
  applyRoleTypography(Array.from(destinationRun.getElementsByTagNameNS(W_NS, 't')), roleStyle, false);

  const keptParagraphs = [];
  for (const paragraph of cell.paragraphs) {
    if (paragraph.node === destinationParagraph || paragraphHasContent(paragraph.node)) {
      keptParagraphs.push(paragraph);
    } else {
      paragraph.node.parentNode?.removeChild(paragraph.node);
    }
  }
  cell.paragraphs = keptParagraphs;
}

/**
 * 跨文档图片迁移：从源文档复制 drawing 节点及对应的图片二进制文件与 relationships 关系
 */
export function transferDrawingToCell(srcEngine, targetEngine, srcDrawingNode, targetCell) {
  if (!srcDrawingNode || !targetCell?.node) return false;

  const srcEng = srcEngine?.engine || srcEngine;
  const tgtEng = targetEngine?.engine || targetEngine;
  if (!srcEng || !tgtEng) return false;

  const blip = srcDrawingNode.getElementsByTagNameNS('*', 'blip')[0];
  if (!blip) return false;
  const embedId = blip.getAttribute('r:embed') || blip.getAttributeNS(R_NS, 'embed') || blip.getAttribute('ns1:embed');
  if (!embedId) return false;

  const rel = srcEng.relationshipMap?.get(embedId) || 'media/image1.png';
  let targetPath = rel.startsWith('word/') ? rel : `word/${rel.replace(/^\//, '')}`;
  const imgBytes = srcEng.mediaFiles?.get(targetPath);
  if (!imgBytes) return false;

  const ext = targetPath.split('.').pop() || 'png';
  const relsText = tgtEng.relsText || '';
  const rIdNums = [...relsText.matchAll(/Id=["']rId(\d+)["']/g)].map((m) => parseInt(m[1], 10));
  const maxRId = Math.max(0, ...rIdNums);
  const newRId = `rId${maxRId + 10}`;
  const newMediaPath = `word/media/image_ghs_${Date.now()}.${ext}`;
  const newRelTarget = `media/${newMediaPath.split('/').pop()}`;

  if (!tgtEng.mediaFiles) tgtEng.mediaFiles = new Map();
  tgtEng.mediaFiles.set(newMediaPath, imgBytes);
  tgtEng.zip?.file(newMediaPath, imgBytes);
  tgtEng.relationshipMap?.set(newRId, newRelTarget);

  const newRelTag = `<Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${newRelTarget}"/>`;
  tgtEng.relsText = relsText.includes('</Relationships>')
    ? relsText.replace('</Relationships>', `${newRelTag}</Relationships>`)
    : `${relsText}\n${newRelTag}`;

  const clonedDrawing = targetCell.node.ownerDocument.importNode(srcDrawingNode, true);
  const clonedBlip = clonedDrawing.getElementsByTagNameNS('*', 'blip')[0];
  if (clonedBlip) {
    clonedBlip.setAttributeNS(R_NS, 'r:embed', newRId);
  }

  let p = targetCell.node.getElementsByTagNameNS(W_NS, 'p')[0];
  if (!p) {
    p = targetCell.node.ownerDocument.createElementNS(W_NS, 'w:p');
    targetCell.node.appendChild(p);
  }
  const existingRuns = [...p.getElementsByTagNameNS(W_NS, 'r')];
  existingRuns.forEach((r) => p.removeChild(r));

  const run = targetCell.node.ownerDocument.createElementNS(W_NS, 'w:r');
  run.appendChild(clonedDrawing);
  p.appendChild(run);

  targetCell.text = '[象形图]';
  targetCell.valueText = '[象形图]';
  return true;
}

export function setCellAlignment(cell, align = 'center') {
  if (!cell?.node) return;
  const ps = cell.node.getElementsByTagNameNS(W_NS, 'p');
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    let pPr = firstChild(p, 'pPr');
    if (!pPr) {
      pPr = cell.node.ownerDocument.createElementNS(W_NS, 'w:pPr');
      p.insertBefore(pPr, p.firstChild);
    }
    let jc = firstChild(pPr, 'jc');
    if (!jc) {
      jc = cell.node.ownerDocument.createElementNS(W_NS, 'w:jc');
      pPr.appendChild(jc);
    }
    jc.setAttributeNS(W_NS, 'w:val', align);
  }
  cell.align = align;
  if (cell.paragraphs) {
    for (const para of cell.paragraphs) {
      if (!para.format) para.format = {};
      para.format.alignment = align;
    }
  }
}

export function writeCellValue(cell, value, roleStyle = null) {
  if (!cell?.editable) throw new DocxEngineError(cell?.protectedReason || '该单元格不是可编辑值区域。', 'LOCKED_FIELD');
  const valStr = typeof value === 'object' && value !== null && 'value' in value
    ? value.value
    : String(value ?? '');
  // 严格压缩连续空行，杜绝空白占位行 (OW-LineBreak-02)
  const clean = valStr.replace(/\r\n?/g, '\n').replace(/\n\s*\n+/g, '\n').trim();
  replaceCellValueContent(cell, clean, roleStyle);
  refreshCellText(cell);
}

export function writeCellLabel(cell, value, allowLabelEdit = false, roleStyle = null) {
  if (!allowLabelEdit) throw new DocxEngineError('标签默认锁定，请先开启“允许修改标签文本”。', 'LOCKED_LABEL');
  if (cell?.record?.sectionNumber && cell.record.sectionNumber !== 9 && cell.record.sectionNumber !== 11) {
    throw new DocxEngineError('只有第9部分与第11部分允许根据源文件微调特殊标签，其他章节标签完全锁定。', 'LABEL_MUTATION_FORBIDDEN');
  }
  if (!cell?.labelNodes?.length) throw new DocxEngineError('该单元格没有可编辑的标签运行区。', 'NO_LABEL');
  let clean = String(value ?? '').trim();
  if (cell.row >= 1 && /^\s*9\.\d+/.test(cell.text)) {
    clean = clean.replace(/^\s*9\.\d+\s*/, '').trim();
    if (!/[：:]$/.test(clean)) clean += '：';
    const prefixMatch = cell.text.match(/^\s*(9\.\d+)/);
    const prefix = prefixMatch ? `${prefixMatch[1]}${' '.repeat(Math.max(1, 5 - prefixMatch[1].length))}` : '';
    clean = prefix + clean;
  } else if (cell.row >= 1 && /^\s*11\.\d+/.test(cell.text)) {
    clean = clean.replace(/^\s*11\.\d+\s*/, '').trim();
    if (!/[：:]$/.test(clean)) clean += '：';
    const prefixMatch = cell.text.match(/^\s*(11\.\d+)/);
    const prefix = prefixMatch ? `${prefixMatch[1]}${' '.repeat(Math.max(1, 6 - prefixMatch[1].length))}` : '';
    clean = prefix + clean;
  }
  distributeText(cell.labelNodes, clean);
  applyRoleTypography(cell.labelNodes, roleStyle, true);
  refreshCellText(cell);
}

function sequenceMatch(text) {
  return String(text || '').match(/^(\s*)(\d+)\.(\d+)(\s*)(.*)$/s);
}

function replaceSequence(cell, sectionNumber, itemNumber) {
  if (!cell) return false;
  const full = combinedNodeText(cell.paragraphs.flatMap((paragraph) => paragraph.runs.flatMap((run) => run.textNodes)));
  const match = sequenceMatch(full);
  if (!match || Number(match[2]) !== Number(sectionNumber)) return false;
  const separator = ' '.repeat(Math.max(1, 5 - `${sectionNumber}.${itemNumber}`.length));
  const replacement = `${match[1]}${sectionNumber}.${itemNumber}${sectionNumber === 9 ? separator : (match[4] || '  ')}${match[5]}`;
  distributeText(cell.paragraphs.flatMap((paragraph) => paragraph.runs.flatMap((run) => run.textNodes)), replacement);
  refreshCellText(cell);
  return true;
}

export function renumberRecord(record) {
  const section = record?.sectionNumber;
  if (!section || record.kind !== 'table') return [];
  let next = 0;
  const seenNodes = new Set();
  const changes = [];
  for (const row of record.rows.slice(1)) {
    const cell = row.cells[0];
    if (!cell) continue;
    if (cell.node && seenNodes.has(cell.node)) continue;
    if (cell.node) seenNodes.add(cell.node);
    const match = sequenceMatch(cell.text);
    if (!match || Number(match[2]) !== section) continue;
    const rest = match[5].trim();
    if (!rest || /^[+\-<>=~\d]/.test(rest)) continue;
    const oldItem = Number(match[3]);
    const item = ++next;
    if (oldItem !== item) {
      changes.push({ row: row.index, from: `${section}.${oldItem}`, to: `${section}.${item}` });
      replaceSequence(cell, section, item);
    }
  }
  return changes;
}

function clearNonBoldText(rowNode) {
  for (const run of descendants(rowNode, 'r')) {
    const format = parseRunFormat(run);
    if (format.bold) continue;
    for (const text of descendants(run, 't')) text.textContent = '';
  }
}

export function addRowAfter(engine, record, rowIndex) {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  const row = record.rows[rowIndex];
  if (!row) throw new DocxEngineError('未找到要复制的行', 'ROW_NOT_FOUND');
  const clone = row.node.cloneNode(true);
  clearNonBoldText(clone);
  row.node.parentNode.insertBefore(clone, row.node.nextSibling);
  engine.refresh();
  let updated = engine.records.find((item) => item.id === record.id);
  if (updated) {
    renumberRecord(updated);
    engine.refresh();
    updated = engine.records.find((item) => item.id === record.id);
  }
  return updated;
}

export function deleteRow(engine, record, rowIndex) {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  if (rowIndex === 0) throw new DocxEngineError('禁止删除章节标题行', 'PROTECTED_ROW');
  if (record.rows.length <= 2) throw new DocxEngineError('至少保留一行数据，禁止删除唯一行', 'PROTECTED_ROW');
  const row = record.rows[rowIndex];
  if (!row) throw new DocxEngineError('未找到要删除的行', 'ROW_NOT_FOUND');
  row.node.parentNode.removeChild(row.node);
  engine.refresh();
  let updated = engine.records.find((item) => item.id === record.id);
  if (updated) {
    renumberRecord(updated);
    engine.refresh();
    updated = engine.records.find((item) => item.id === record.id);
  }
  return updated;
}

export function addNoteRowAfter(engine, record, rowIndex, initialText = '说明：') {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  const targetRow = record.rows[rowIndex];
  if (!targetRow) throw new DocxEngineError('未找到目标行', 'ROW_NOT_FOUND');

  const totalCols = (record.structure?.gridWidthsTwips?.length) || record.columns || 1;
  const totalWidthTwips = (record.structure?.gridWidthsTwips || []).reduce((sum, w) => sum + (Number(w) || 0), 0) || 9781;

  const doc = targetRow.node.ownerDocument;
  const tr = doc.createElementNS(W_NS, 'w:tr');

  const trPr = doc.createElementNS(W_NS, 'w:trPr');
  tr.appendChild(trPr);

  const tc = doc.createElementNS(W_NS, 'w:tc');
  const tcPr = doc.createElementNS(W_NS, 'w:tcPr');

  const tcW = doc.createElementNS(W_NS, 'w:tcW');
  tcW.setAttributeNS(W_NS, 'w:w', String(totalWidthTwips));
  tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
  tcPr.appendChild(tcW);

  if (totalCols > 1) {
    const gridSpan = doc.createElementNS(W_NS, 'w:gridSpan');
    gridSpan.setAttributeNS(W_NS, 'w:val', String(totalCols));
    tcPr.appendChild(gridSpan);
  }

  const tcBorders = doc.createElementNS(W_NS, 'w:tcBorders');
  for (const borderType of ['top', 'bottom']) {
    const border = doc.createElementNS(W_NS, `w:${borderType}`);
    border.setAttributeNS(W_NS, 'w:val', 'dotted');
    border.setAttributeNS(W_NS, 'w:color', 'auto');
    border.setAttributeNS(W_NS, 'w:sz', '4');
    border.setAttributeNS(W_NS, 'w:space', '0');
    tcBorders.appendChild(border);
  }
  tcPr.appendChild(tcBorders);
  tc.appendChild(tcPr);

  const p = doc.createElementNS(W_NS, 'w:p');
  const r = doc.createElementNS(W_NS, 'w:r');
  const t = doc.createElementNS(W_NS, 'w:t');
  t.setAttribute('xml:space', 'preserve');
  t.textContent = initialText;
  r.appendChild(t);
  p.appendChild(r);
  tc.appendChild(p);

  tr.appendChild(tc);
  targetRow.node.parentNode.insertBefore(tr, targetRow.node.nextSibling);

  engine.refresh();
  let updated = engine.records.find((item) => item.id === record.id);
  if (updated) {
    renumberRecord(updated);
    engine.refresh();
    updated = engine.records.find((item) => item.id === record.id);
  }
  return updated;
}

export function moveRow(engine, record, rowIndex, direction) {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  if (rowIndex === 0) throw new DocxEngineError('禁止移动章节标题行', 'PROTECTED_ROW');
  const targetRow = record.rows[rowIndex];
  if (!targetRow) throw new DocxEngineError('未找到目标行', 'ROW_NOT_FOUND');

  if (direction === 'up') {
    if (rowIndex <= 1) throw new DocxEngineError('该行已处于第一项，无法继续上移', 'CANNOT_MOVE');
    const prevRow = record.rows[rowIndex - 1];
    prevRow.node.parentNode.insertBefore(targetRow.node, prevRow.node);
  } else if (direction === 'down') {
    if (rowIndex >= record.rows.length - 1) throw new DocxEngineError('该行已处于末尾，无法继续下移', 'CANNOT_MOVE');
    const nextRow = record.rows[rowIndex + 1];
    nextRow.node.parentNode.insertBefore(targetRow.node, nextRow.node.nextSibling);
  } else {
    throw new DocxEngineError('未知的移动方向', 'INVALID_DIRECTION');
  }

  engine.refresh();
  let updated = engine.records.find((item) => item.id === record.id);
  if (updated) {
    renumberRecord(updated);
    engine.refresh();
    updated = engine.records.find((item) => item.id === record.id);
  }
  return updated;
}

export function moveRowUp(engine, record, rowIndex) {
  return moveRow(engine, record, rowIndex, 'up');
}

export function moveRowDown(engine, record, rowIndex) {
  return moveRow(engine, record, rowIndex, 'down');
}

export function auditRecord(record) {
  const errors = [];
  const section = record?.sectionNumber;
  if (!section || record.kind !== 'table') return errors;
  let expected = 1;
  let lastItem = null;
  for (const row of record.rows.slice(1)) {
    const cell = row.cells[0];
    if (!cell) continue;
    const match = sequenceMatch(cell.text);
    if (!match || Number(match[2]) !== section) continue;
    const item = Number(match[3]);
    if (item === lastItem) continue;
    if ([11, 12].includes(section)) {
      if (item < 1) errors.push(`Section ${section} 第 ${row.index} 行序号无效`);
      lastItem = item;
      continue;
    }
    if (item !== expected) errors.push(`Section ${section} 序号断号：应为 ${section}.${expected}，当前为 ${section}.${item}`);
    expected += 1;
    lastItem = item;
  }
  return errors;
}

export function auditEngine(engine) {
  return engine.records.filter((record) => record.kind === 'table').flatMap((record) => auditRecord(record).map((message) => ({ recordId: record.id, section: record.section, message })));
}

export function recordById(engine, id) {
  return engine.records.find((record) => record.id === id) || null;
}

export function restoreSectionToTemplate(engine, baselineEngine, sectionIdentifier) {
  if (!engine) throw new DocxEngineError('目标引擎为空。', 'ENGINE_NULL');
  if (!baselineEngine) throw new DocxEngineError('基准模板引擎为空。', 'BASELINE_NULL');

  const currentRecord = typeof sectionIdentifier === 'object' && sectionIdentifier
    ? sectionIdentifier
    : engine.records.find((r) => r.id === sectionIdentifier || (r.sectionNumber != null && r.sectionNumber === Number(sectionIdentifier)));

  if (!currentRecord || currentRecord.kind !== 'table') {
    throw new DocxEngineError('未找到当前可恢复的章节表格。', 'SECTION_NOT_FOUND');
  }

  const baselineRecord = baselineEngine.records.find((r) =>
    r.kind === 'table' &&
    (currentRecord.sectionNumber != null
      ? r.sectionNumber === currentRecord.sectionNumber
      : r.tableIndex === currentRecord.tableIndex)
  );

  if (!baselineRecord) {
    throw new DocxEngineError('未在初始模板中找到对应章节表格。', 'BASELINE_NOT_FOUND');
  }

  const currentTblNode = currentRecord.rows[0]?.node?.parentNode;
  const baselineTblNode = baselineRecord.rows[0]?.node?.parentNode;

  if (!currentTblNode || !baselineTblNode || !currentTblNode.parentNode) {
    throw new DocxEngineError('无法定位表格底层 XML 节点。', 'XML_NODE_NOT_FOUND');
  }

  const clonedTblNode = baselineTblNode.cloneNode(true);
  currentTblNode.parentNode.replaceChild(clonedTblNode, currentTblNode);

  engine.refresh();

  const updatedRecord = engine.records.find((r) =>
    r.kind === 'table' &&
    (currentRecord.sectionNumber != null
      ? r.sectionNumber === currentRecord.sectionNumber
      : r.tableIndex === currentRecord.tableIndex)
  );
  if (updatedRecord) {
    renumberRecord(updatedRecord);
  }
  return updatedRecord;
}

export function editableFields(record) {
  if (!record || record.kind !== 'table') return [];
  return record.rows.flatMap((row) => row.cells.flatMap((cell) => {
    const fields = [];
    if (cell.valueNodes.length) fields.push({ type: 'value', row: row.index, col: cell.col, cell });
    if (cell.labelNodes.length) fields.push({ type: 'label', row: row.index, col: cell.col, cell });
    return fields;
  }));
}

export function normalizedSequence(paragraph, cell) {
  if (!paragraph || cell?.row === 0) return null;
  const numText = paragraph.numberingText?.trim() || '';
  const rawText = paragraph.rawText || paragraph.text || '';

  const rawMatch = rawText.match(/^\s*(?:v)?(\d{1,2}(?:[\.．、]\d{1,2})+|\d{1,2}[\.．、])\s*([\.．、:：]|\s|$)?/i);
  const numMatch = numText.match(/^\s*(?:v)?(\d{1,2}(?:[\.．、]\d{1,2})+|\d{1,2}[\.．、])\s*([\.．、:：]|\s|$)?/i);

  const matchedStr = numMatch?.[1] || (numText ? numText : null) || rawMatch?.[1];
  if (!matchedStr) return null;

  const seqStr = matchedStr.replace(/[．]/g, '.');
  const cleanedSeq = seqStr.replace(/[\.、]$/, '');
  const displaySeq = `${cleanedSeq}  `;
  const stripLength = rawMatch ? rawMatch[0].length : 0;

  return {
    text: displaySeq,
    stripLength,
    rawNumber: cleanedSeq,
  };
}

export function classifyLabelTier(cell, row, paragraph, record) {
  if (!row || row.index === 0 || cell?.row === 0) return 'title';
  if (row.cells && row.cells[0] !== cell && cell?.col !== 0) return 'none';
  const text = cell.text?.trim() || '';
  const labelText = cell.labelText?.trim() || '';

  // Section 8 Special Exception: "建议" / "Recommendation" belongs to PARENT tier!
  if (record?.sectionNumber === 8 && /^\s*(?:建议|Recommendation)\s*[：:]?\s*$/i.test(labelText || text)) {
    return 'parent';
  }

  // Section 15 Explanatory Labels: Bold items are notes/explanatory labels and MUST NOT have child indent, must be flush left (parent)!
  if (record?.sectionNumber === 15) {
    return 'parent';
  }

  const seq = normalizedSequence(paragraph, cell);
  if (seq) return 'parent';

  if (labelText || /^[^\n：:]{1,100}[：:]/.test(text)) {
    return 'child';
  }

  return 'none';
}

export function extractProductModelFromEngine(engine) {
  if (!engine) return '';
  const sec1 = engine.records?.find((r) => r.sectionNumber === 1);
  if (!sec1) return '';

  for (const r of sec1.rows) {
    for (const c of r.cells) {
      const role = cellRole(c);
      const label = (role.labelText || '').trim();
      const val = (role.valueText || '').trim();
      if (!val) continue;
      if (/此处填写|待填|待确定|待完善|N\/A|---/.test(val)) continue;

      if (/产品名称|Product name|Trade name|品名|型号/i.test(label)) {
        const m = val.match(/([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+)/);
        if (m) return m[1];
        if (val.length <= 30) return val;
      }

      if (/中文名称|Name of substance/i.test(label)) {
        const m = val.match(/([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+)/);
        if (m) return m[1];
      }
    }
  }
  return '';
}

export function extractModelFromText(text) {
  if (!text) return '';
  const clean = text.replace(/\.(?:docx|pdf|doc|txt)$/i, '');
  const stripped = clean
    .replace(/(?:正式模板|模板|msds|tds|CN|EN|冠志|国彩|Guocai|Guanzhi|原件|编辑后|source|converted|test_export|current_matching|\(\d+\))/gi, ' ')
    .replace(/^[\s_-]+|[\s_-]+$/g, '')
    .trim();
  const m = stripped.match(/([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+)/);
  if (m) return m[1];
  const parts = stripped.split(/\s+/).filter(Boolean);
  if (parts.length > 0 && parts[0].length <= 25 && !/^[_-]+$/.test(parts[0])) {
    return parts[0];
  }
  return '';
}

export function buildExportDocxName(engine, options = {}) {
  // 0. 用户显式指定的自定义文件名优先
  if (options.customFileName && typeof options.customFileName === 'string') {
    let custom = options.customFileName.trim();
    if (custom) {
      if (!/\.docx$/i.test(custom)) custom += '.docx';
      return custom;
    }
  }

  // 1. Language: CN or EN
  let lang = options.lang || (options.language ? (options.language.toUpperCase().startsWith('EN') ? 'EN' : 'CN') : '');
  const tplName = options.templateName || '';
  const srcName = engine?.sourceName || '';
  if (!lang) {
    if (/EN|English/i.test(tplName) || /_EN_|_EN\b/i.test(srcName) || engine?.headerFooterData?.language === 'EN') {
      lang = 'EN';
    } else {
      const sec1 = engine?.records?.find((r) => r.sectionNumber === 1);
      if (sec1 && /Identification/i.test(sec1.title || '')) {
        lang = 'EN';
      } else {
        lang = 'CN';
      }
    }
  }

  // 2. Entity: 冠志 / 国彩 / Guanzhi / Guocai
  let entity = options.entity || '';
  if (!entity) {
    if (/国彩|Guocai/i.test(tplName) || /国彩|Guocai/i.test(srcName) || engine?.headerFooterData?.entity === '国彩') {
      entity = lang === 'EN' ? 'Guocai' : '国彩';
    } else if (engine) {
      const sec1 = engine.records?.find((r) => r.sectionNumber === 1);
      if (sec1) {
        const allText = sec1.rows.flatMap((r) => r.cells.map((c) => cellRole(c).valueText || '')).join(' ');
        if (/国彩/i.test(allText)) {
          entity = lang === 'EN' ? 'Guocai' : '国彩';
        } else if (/GUOCAI/i.test(allText)) {
          entity = 'Guocai';
        } else if (/GUANZHI/i.test(allText) && lang === 'EN') {
          entity = 'Guanzhi';
        }
      }
    }
    if (!entity) {
      entity = (lang === 'EN' && /Guanzhi/i.test(tplName)) ? 'Guanzhi' : '冠志';
    }
  }

  // 3. Product Model
  let model = '';
  if (options.productModel && !/^(?:MSDS|模板|正式模板|Template)$/i.test(options.productModel.trim())) {
    model = extractModelFromText(options.productModel) || options.productModel.trim();
  }
  if (!model && engine?.headerFooterData?.model) {
    model = engine.headerFooterData.model;
  }
  if (!model && engine) {
    model = extractProductModelFromEngine(engine);
  }
  if (!model && options.sourcePreviewName) {
    model = extractModelFromText(options.sourcePreviewName);
  }
  if (!model && srcName) {
    model = extractModelFromText(srcName);
  }
  if (model) {
    model = model.replace(/^[\s_-]+|[\s_-]+$/g, '');
  }
  if (!model || model === '_' || /^(?:MSDS|模板|正式模板)$/i.test(model)) {
    model = 'MSDS';
  }

  // Output format reference: "OS-1030 msds_CN 冠志.docx"
  return `${model} msds_${lang} ${entity}.docx`;
}

// =============================================================================
// 编辑器局部同步覆写模式 (Template-Agnostic Local Preset Overlay System)
// =============================================================================

export const SEMANTIC_KEY_PATTERNS = {
  'sec1.product_name': /^(?:1\.1\s*)?(?:产品名称|中文名称|Product\s*name|Trade\s*name|Product\s*Identifier)/i,
  'sec1.chemical_category': /^(?:化学品分类|Chemical\s*category|Chemical\s*Family|Chemical\s*Classification)/i,
  'sec1.recommended_use': /^(?:1\.2\s*)?(?:产品使用建议|使用建议和使用限制|Product\s*use|Recommended\s*Use)/i,
  'sec1.supplier.name': /^(?:供应商名称|Name\s*of\s*supplier|Supplier\s*Name)/i,
  'sec1.supplier.address': /^(?:供应商地址|Supplier\s*address)/i,
  'sec1.supplier.tel': /^(?:电话|Tel|Telephone)/i,
  'sec1.supplier.fax': /^(?:传真|Fax)/i,
  'sec2.ghs_classification': /^(?:2\.1\s*)?(?:GHS\s*危险性类别|GHS\s*Hazard\s*Classification)/i,
  'sec2.ghs_pictograms': /^(?:GHS\s*象形图|GHS\s*Hazard\s*Pictograms|GHS\s*Pictograms)/i,
  'sec2.other_hazards': /^(?:2\.2\s*)?(?:其他危害|Other\s*Hazards)/i,
  'sec3.product_type': /^(?:3\.1\s*)?(?:产品类型|Product\s*type)/i,
  'sec9.appearance': /^(?:9\.1\s*)?(?:外观|Appearance)/i,
  'sec9.ph': /^(?:9\.2\s*|9\.3\s*)?(?:pH\s*值|pH\s*value|pH)/i,
  'sec9.ionicity': /^(?:9\.3\s*|9\.4\s*)?(?:离子性|Ionicity|Ionic\s*Character)/i,
  'sec9.flammability': /^(?:9\.4\s*|9\.8\s*)?(?:可燃性|Flammability)/i,
  'sec9.density': /^(?:9\.5\s*|9\.12\s*)?(?:密度|Density)/i,
  'sec9.water_solubility': /^(?:9\.6\s*|9\.13\s*)?(?:水溶性|Solubility\s*in\s*water|Water\s*Solubility)/i,
  'sec9.viscosity': /^(?:9\.7\s*|9\.19\s*)?(?:粘度|Viscosity|Dynamic\s*viscosity)/i,
  'sec9.auto_ignition': /^(?:9\.8\s*|9\.16\s*)?(?:自燃温度|Auto-ignition)/i,
  'sec9.ignition_temp': /^(?:9\.9\s*|9\.17\s*)?(?:引燃温度|Ignition\s*Temperature)/i,
  'sec9.explosive_props': /^(?:9\.10\s*|9\.20\s*)?(?:爆炸特性|Explosive\s*properties)/i,
  'sec9.dust_explosion': /^(?:9\.11\s*|9\.21\s*)?(?:粉尘爆炸级别|Dust\s*explosion\s*class)/i,
  'sec9.solids': /^(?:9\.12\s*|9\.22\s*)?(?:固体含量|Solid\s*content|Solids\s*Content)/i,
  'sec9.other_info': /^(?:9\.13\s*|9\.24\s*)?(?:其他信息|Other\s*information)/i,
  'sec10.chemical_stability': /^(?:10\.1\s*)?(?:化学稳定性|Chemical\s*stability)/i,
  'sec10.decomposition_products': /^(?:10\.2\s*)?(?:危险分解产物|Hazardous\s*decomposition)/i,
  'sec10.possible_reactions': /^(?:10\.3\s*)?(?:可能的危害反应|Possible\s*hazardous\s*reactions|Possibility\s*of\s*Hazardous)/i,
  'sec11.acute_toxicity': /^(?:11\.1\s*)?(?:急性毒性|Acute\s*toxicity)/i,
  'sec11.skin_irritation': /^(?:11\.2\s*)?(?:主要皮肤刺激性|Primary\s*skin\s*irritation)/i,
  'sec11.eye_irritation': /^(?:11\.3\s*)?(?:主要眼睛刺激性|主要粘膜刺激性|Primary\s*eye\s*irritation)/i,
  'sec11.sensitization': /^(?:11\.4\s*)?(?:致敏性|Sensitization)/i,
  'sec11.mutagenicity': /^(?:11\.5\s*)?(?:致突变性|Mutagenicity)/i,
  'sec12.ecotoxicity': /^(?:12\.1\s*)?(?:生态毒性|Ecotoxicity)/i,
  'sec12.persistence': /^(?:12\.2\s*)?(?:持久性和降解性|Persistence\s*and\s*degradability)/i,
  'sec12.other_effects': /^(?:12\.3\s*)?(?:其他不利的影响|Other\s*adverse\s*effects)/i,
  'sec13.disposal_methods': /^(?:处理方法|Disposal\s*methods)/i,
  'sec14.road_rail': /^(?:14\.1\s*)?(?:公路和铁路运输|Road\s*and\s*rail\s*transport)/i,
  'sec14.sea': /^(?:14\.2\s*)?(?:海上运输|Maritime\s*transport|Sea\s*Transport)/i,
  'sec14.air': /^(?:14\.3\s*)?(?:空运|Air\s*transport)/i,
  'sec14.special_precautions': /^(?:14\.4\s*)?(?:用户特殊注意事项|Special\s*precautions\s*for\s*user)/i,
};

export function getCellSemanticKey(cell) {
  if (!cell) return null;
  const sec = cell.record?.sectionNumber;
  if (!sec) return null;
  const row = cell.record.rows[cell.row];
  if (!row) return null;

  // 1. Identify label text for the row / cell
  const labelCell =
    row.cells.find((c) => c.role === 'label' || c.isLabel) ||
    row.cells.slice(0, cell.col).reverse().find((c) => !c.editable && (c.labelText || c.text)?.trim()) ||
    row.cells.find((c) => !c.editable && (c.labelText || c.text)?.trim()) ||
    row.cells[0];
  const rawLabel = (cell.labelText || (cell.editable ? (labelCell?.labelText || labelCell?.text) : cell.text) || '').trim();

  // 2. Match canonical patterns
  for (const [key, pattern] of Object.entries(SEMANTIC_KEY_PATTERNS)) {
    if (key.startsWith(`sec${sec}.`) && pattern.test(rawLabel)) {
      return key;
    }
  }

  // 3. Fallback: normalized clean label key
  if (rawLabel) {
    const clean = rawLabel
      .replace(/^[0-9.]+\s*/, '')
      .replace(/[:：]/g, '')
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .slice(0, 32);
    if (clean) return `sec${sec}.lbl_${clean}`;
  }

  return `sec${sec}.r${cell.row}_c${cell.col}`;
}

export function findCellBySemanticKey(engine, semanticKey) {
  if (!engine?.records || !semanticKey) return null;
  const [secPart] = semanticKey.split('.');
  const secNum = parseInt(secPart.replace('sec', ''), 10);
  const matchingRecords = engine.records.filter((r) => r.sectionNumber === secNum && Array.isArray(r.rows));
  if (matchingRecords.length === 0) return null;

  // 1. Try exact match using getCellSemanticKey on editable cells across matching records
  let fallbackCandidate = null;
  for (const record of matchingRecords) {
    for (const row of record.rows) {
      for (const cell of row.cells) {
        if (cell.editable && getCellSemanticKey(cell) === semanticKey) {
          if (cell.text && cell.text.trim()) {
            return cell;
          }
          if (!fallbackCandidate) fallbackCandidate = cell;
        }
      }
    }
  }
  if (fallbackCandidate) return fallbackCandidate;

  // 2. Pattern fallback
  const pattern = SEMANTIC_KEY_PATTERNS[semanticKey];
  if (pattern) {
    for (const record of matchingRecords) {
      for (const row of record.rows) {
        const rowLabelCell =
          row.cells.find((c) => c.role === 'label' || c.isLabel) ||
          row.cells.find((c) => !c.editable && (c.labelText || c.text)?.trim()) ||
          row.cells[0];
        const rowLabel = (rowLabelCell?.labelText || rowLabelCell?.text || '').trim();
        if (pattern.test(rowLabel)) {
          const valCell = row.cells.find((c) => c.editable);
          if (valCell) return valCell;
        }
      }
    }
  }

  return null;
}

export function extractSemanticSnapshot(engine) {
  const snapshot = {};
  if (!engine?.records) return snapshot;
  for (const record of engine.records) {
    if (!Array.isArray(record.rows)) continue;
    for (const row of record.rows) {
      for (const cell of row.cells) {
        if (cell.editable) {
          const key = getCellSemanticKey(cell);
          if (key) {
            // 优先记录具有实质有效文本的单元格，防止小节空标题行遮蔽具体数据值行
            const val = (cell.valueText !== undefined ? cell.valueText : cell.text) || '';
            if (!(key in snapshot) || (!snapshot[key]?.trim() && val.trim())) {
              snapshot[key] = val;
            }
          }
        }
      }
    }
  }
  return snapshot;
}

export function applySemanticOverrides(engine, fieldOverrides = {}) {
  if (!engine?.records || !fieldOverrides) return 0;
  let count = 0;
  for (const [key, value] of Object.entries(fieldOverrides)) {
    if (value === undefined || value === null) continue;
    const cell = findCellBySemanticKey(engine, key);
    if (cell && cell.editable) {
      writeCellValue(cell, value);
      count++;
    }
  }
  return count;
}

export const SYSTEM_DEFAULT_PRESETS = [
  {
    id: 'preset_custom_1',
    name: '自定义预设 1',
    targetTemplate: 'CN 冠志',
    isBuiltin: false,
    enabledForExport: true,
    headerFooterOverrides: {},
    fieldOverrides: {},
  },
];
export const SYSTEM_BUILTIN_PRESETS = SYSTEM_DEFAULT_PRESETS;

export class PresetStore {
  static STORAGE_KEY = 'msds_editor_presets_v2';

  static loadPresets() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            return this._mergeWithBuiltins(list);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load presets from localStorage', e);
    }
    return JSON.parse(JSON.stringify(SYSTEM_DEFAULT_PRESETS));
  }

  static createPreset(name = '新建自定义预设', targetTemplate = 'CN 冠志') {
    return {
      id: `preset_${Date.now()}`,
      name: (name || '新建自定义预设').trim(),
      targetTemplate: targetTemplate || 'CN 冠志',
      isBuiltin: false,
      enabledForExport: true,
      headerFooterOverrides: {},
      fieldOverrides: {},
    };
  }

  static savePresets(presets) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
      }
    } catch (e) {
      console.warn('Failed to save presets to localStorage', e);
    }
  }

  static _mergeWithBuiltins(userList) {
    const result = [...userList];
    for (const b of SYSTEM_BUILTIN_PRESETS) {
      if (!result.some((p) => p.id === b.id)) {
        result.push(JSON.parse(JSON.stringify(b)));
      }
    }
    return result;
  }
}


// ============================================================
// 值清空功能 (Clear Value Functions) - 支持普通与预设编辑模式
// ============================================================

export function clearCellValue(cell, valueStyle = null) {
  if (!cell || !cell.editable) return false;
  writeCellValue(cell, '', valueStyle);
  return true;
}

export function clearSectionValues(record, valueStyle = null) {
  if (!record || !Array.isArray(record.rows)) return 0;
  let clearedCount = 0;
  for (const row of record.rows) {
    for (const cell of row.cells) {
      if (cell.editable) {
        writeCellValue(cell, '', valueStyle);
        clearedCount++;
      }
    }
  }
  return clearedCount;
}

// ============================================================
// 预设优先级覆盖核心合并管线 (Preset Priority Overlay Pipeline)
// ============================================================

export function applyPresetPriorityOverlay(baseEngine, preset, targetEngine) {
  if (!baseEngine || !preset || !targetEngine) return 0;

  // 1. 提取普通基准模式全部语义快照
  const baseSnapshot = extractSemanticSnapshot(baseEngine);

  // 2. 准备最终合并键值对：优先采用预设的非空值，未填项继承普通基准
  const mergedValues = { ...baseSnapshot };
  const presetValues = preset.fieldOverrides || preset.values || {};
  for (const [key, val] of Object.entries(presetValues)) {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      mergedValues[key] = String(val); // 优先级覆盖！
    }
  }

  // 3. 应用到目标引擎
  const appliedCount = applySemanticOverrides(targetEngine, mergedValues);

  // 4. 合并页眉页脚
  const baseHf = baseEngine.headerFooterData || {};
  const presetHf = preset.headerFooterOverrides || preset.headerFooterData || {};
  const mergedHf = {
    ...baseHf,
    company: presetHf.company?.trim() || baseHf.company || '',
    title: presetHf.title?.trim() || baseHf.title || '物料安全数据表',
    version: presetHf.version?.trim() || baseHf.version || 'V1.0',
    revisionDate: presetHf.revisionDate?.trim() || baseHf.revisionDate || '',
    model: baseHf.model || '', // 型号始终继承主文档
  };
  updateHeaderFooterData(targetEngine, mergedHf);

  return appliedCount;
}
