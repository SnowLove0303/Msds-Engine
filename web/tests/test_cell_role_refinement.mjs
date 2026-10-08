import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

function isPunctuationOnly(str) {
  return !str || /^[。.,:：;；、\-—\s/／()（）\[\]【】"'“”‘’!！?？]+$/.test(str.trim());
}

function isSectionTitle(str) {
  return /^\s*(?:v)?\d{1,2}[\.、\s]/i.test(str) && /(?:标识|概述|成分|急救|消防|泄漏|操作|接触|理化|稳定|毒|生态|废弃|运输|法规|其他|Identification|Hazards|Composition|First|Fire|Accidental|Handling|Exposure|Physical|Stability|Toxicological|Ecological|Disposal|Transport|Regulatory|Other)/i.test(str);
}

function refinedCellRole(cell) {
  const labelParts = [];
  const valueParts = [];
  const labelNodes = [];
  const valueNodes = [];

  for (const paragraph of cell.paragraphs) {
    const boldRuns = paragraph.runs.filter((run) => run.bold);
    const notBoldRuns = paragraph.runs.filter((run) => !run.bold);
    const boldText = boldRuns.map((run) => run.text).join('').trim();
    const notBoldText = notBoldRuns.map((run) => run.text).join('').trim();
    const num = paragraph.numberingText?.trim();

    if (notBoldText && !num) {
      valueParts.push(notBoldText);
      valueNodes.push(...notBoldRuns.flatMap((r) => r.textNodes));
    }

    if (boldText) {
      // 1. Pure punctuation filter (e.g. "。")
      if (isPunctuationOnly(boldText)) {
        valueParts.push(boldText);
        valueNodes.push(...boldRuns.flatMap((r) => r.textNodes));
        continue;
      }

      // 2. Check for inline colon separating label and value within fully bold paragraph
      const inlineColon = boldText.match(/^([^：:]{1,12}[：:])\s*(.+)$/);
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

      // 3. Col > 0 context: In data/value columns, bold text is normally a value unless explicitly ending with colon & short
      if (cell.col > 0) {
        const isExplicitSubLabel = /[：:]$/.test(boldText) && boldText.length <= 10;
        if (!isExplicitSubLabel) {
          valueParts.push(boldText);
          valueNodes.push(...boldRuns.flatMap((r) => r.textNodes));
          continue;
        }
      }

      // 4. Character count rule: labels are short (<= 10 chars) or end with colon or are section titles or have property number prefix or num
      const endsWithColon = /[：:]$/.test(boldText) || /[：:]$/.test(paragraph.text?.trim() || '');
      const isSecTitle = isSectionTitle(boldText) || (num && isSectionTitle(`${num} ${boldText}`));
      const isShortLabel = boldText.length <= 10;
      const hasPropertyNumberPrefix = /^\s*(?:v)?\d+(?:[\.．、]\d+)*[\.．、\s]/i.test(boldText) && boldText.length <= 25;
      const isNumbered = Boolean(num) && (boldText.length <= 25 || endsWithColon);

      if (!isShortLabel && !endsWithColon && !isSecTitle && !hasPropertyNumberPrefix && !isNumbered) {
        // Demote to value! This is a bold sentence/paragraph (e.g. "根据EC指令...", "在着火或爆炸情况下..."), not a slot label
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

const files = [
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1007 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-202A msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3617 MSDS-CN 国彩.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3615 MSDS（冠志）.docx'
];

for (const f of files) {
  const buf = await fs.readFile(f);
  const eng = await loadDocx(buf, path.basename(f));
  console.log(`\n=================== FILE: ${path.basename(f)} ===================`);
  for (const r of eng.records.filter(r => r.kind === 'table')) {
    for (const row of r.rows) {
      for (const cell of row.cells) {
        const refined = refinedCellRole(cell);
        // Compare with current role
        if (refined.labelText !== cell.labelText || refined.valueText !== cell.valueText) {
          console.log(`Sec ${r.sectionNumber} R${row.index} C${cell.col}:`);
          console.log(`  OLD: label='${cell.labelText.slice(0, 30)}', val='${cell.valueText.slice(0, 30)}', kind=${cell.kind}`);
          console.log(`  NEW: label='${refined.labelText.slice(0, 30)}', val='${refined.valueText.slice(0, 30)}', kind=${refined.kind}`);
        }
      }
    }
  }
}
