import fs from 'fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
let content = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// 1. Add 14 to writeCellLabel allowed sections
content = content.replace(
  '![2, 5, 6, 9, 10, 11, 12].includes(cell.record.sectionNumber)',
  '![2, 3, 5, 6, 9, 10, 11, 12, 14].includes(cell.record.sectionNumber)'
);

// 2. Fix formatSection11PreambleRow to remove extra cells
const oldPreambleStart = `export function formatSection11PreambleRow(row, text, isEnglish = false, leftIndentTwips = 34) {
  if (!row?.node) return;
  const doc = row.node.ownerDocument;
  const tcs = Array.from(row.node.getElementsByTagNameNS(W_NS, 'tc'));
  if (tcs.length === 0) return;
  const tc = tcs[0];`;

const newPreambleStart = `export function formatSection11PreambleRow(row, text, isEnglish = false, leftIndentTwips = 34) {
  if (!row?.node) return;
  const doc = row.node.ownerDocument;
  const tcs = Array.from(row.node.getElementsByTagNameNS(W_NS, 'tc'));
  if (tcs.length === 0) return;
  for (let i = 1; i < tcs.length; i++) {
    row.node.removeChild(tcs[i]);
  }
  const tc = tcs[0];`;

if (content.includes(oldPreambleStart)) {
  content = content.replace(oldPreambleStart, newPreambleStart);
}

// 3. Add normalizeTwoColumnRow, mapToxicologyLabelToEnglish, formatSection11LabelCell, formatSection14LabelCell, extractToxicologicalEndpointsFromSource if not present
if (!content.includes('export function normalizeTwoColumnRow')) {
  const newFunctions = `
/**
 * 规整表格行为标准纯净的双列结构 (消除底模继承的 vMerge、多余单元格或列宽漂移)
 */
export function normalizeTwoColumnRow(rowNode, w0 = 2800, w1 = 6981) {
  let cNodes = Array.from(rowNode.getElementsByTagNameNS(W_NS, 'tc'));
  while (cNodes.length > 2) {
    rowNode.removeChild(cNodes[cNodes.length - 1]);
    cNodes = Array.from(rowNode.getElementsByTagNameNS(W_NS, 'tc'));
  }
  while (cNodes.length < 2) {
    const newTc = rowNode.ownerDocument.createElementNS(W_NS, 'w:tc');
    const newP = rowNode.ownerDocument.createElementNS(W_NS, 'w:p');
    newTc.appendChild(newP);
    rowNode.appendChild(newTc);
    cNodes = Array.from(rowNode.getElementsByTagNameNS(W_NS, 'tc'));
  }
  [w0, w1].forEach((wVal, idx) => {
    const tc = cNodes[idx];
    let tcPr = tc.getElementsByTagNameNS(W_NS, 'tcPr')[0];
    if (!tcPr) {
      tcPr = rowNode.ownerDocument.createElementNS(W_NS, 'w:tcPr');
      tc.insertBefore(tcPr, tc.firstChild);
    }
    const span = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
    if (span) tcPr.removeChild(span);

    const vMerge = tcPr.getElementsByTagNameNS(W_NS, 'vMerge')[0];
    if (vMerge) tcPr.removeChild(vMerge);

    let tcW = tcPr.getElementsByTagNameNS(W_NS, 'w:tcW')[0];
    if (!tcW) {
      tcW = rowNode.ownerDocument.createElementNS(W_NS, 'w:tcW');
      tcPr.appendChild(tcW);
    }
    tcW.setAttributeNS(W_NS, 'w:w', String(wVal));
    tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
  });
}

/**
 * 中文毒理学标签英译映射表 (严格遵循法定 GHS 术语与主审计断言)
 */
export function mapToxicologyLabelToEnglish(cnLabel) {
  const clean = cnLabel.replace(/^\\s*11\\.\\d+\\s*/, '').replace(/[:：]$/, '').trim();
  if (/经口/i.test(clean)) return 'Acute toxicity, oral';
  if (/经皮/i.test(clean)) return 'Acute toxicity, dermal';
  if (/吸入/i.test(clean) && !/危害|危险/i.test(clean)) return 'Acute toxicity, inhalation';
  if (/主要皮肤刺激|原发性皮肤刺激|皮肤刺激/i.test(clean)) return 'Primary skin irritation';
  if (/主要粘膜刺激|主要眼睛刺激|原发性粘膜刺激|眼睛刺激/i.test(clean)) return 'Primary mucosal irritation';
  if (/致敏/i.test(clean)) return 'Respiratory or skin sensitization';
  if (/亚急性/i.test(clean)) return 'Subacute, subchronic and prolonged toxicity';
  if (/致癌/i.test(clean)) return 'Carcinogenicity';
  if (/生育力/i.test(clean)) return 'Reproductive toxicity - fertility';
  if (/致畸/i.test(clean)) return 'Reproductive toxicity - teratogenicity';
  if (/生殖毒性/i.test(clean)) return 'Reproductive toxicity';
  if (/体外/i.test(clean)) return 'Germ cell mutagenicity (in vitro)';
  if (/体内/i.test(clean)) return 'Germ cell mutagenicity (in vivo)';
  if (/致突变|遗传毒性/i.test(clean)) return 'Germ cell mutagenicity';
  if (/一次性接触/i.test(clean)) return 'Specific target organ toxicity (single exposure)';
  if (/重复性接触|反复接触/i.test(clean)) return 'Specific target organ toxicity (repeated exposure)';
  if (/吸入危/i.test(clean)) return 'Aspiration hazard';
  if (/CMR/i.test(clean)) return 'CMR assessment';
  if (/附加信息|其它信息/i.test(clean)) return 'Additional information';
  return clean;
}

/**
 * 格式化 Section 11 标签单元格 (法定悬挂缩进 565/565、字号、加粗)
 */
export function formatSection11LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  applyStandardHangingIndent(cell, '565', '565');
  const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  const p = ps[0];
  for (let i = 1; i < ps.length; i++) {
    ps[i].parentNode?.removeChild(ps[i]);
  }
  Array.from(p.getElementsByTagNameNS(W_NS, 'r')).forEach(r => p.removeChild(r));

  let cleanLabel = labelText.trim();
  if (isEnglish) {
    cleanLabel = cleanLabel.replace(/：/g, ':');
    if (!cleanLabel.endsWith(':')) cleanLabel += ':';
  } else {
    cleanLabel = cleanLabel.replace(/:/g, '：');
    if (!cleanLabel.endsWith('：')) cleanLabel += '：';
  }

  const fullText = \`\${numberStr}  \${cleanLabel}\`;

  const r = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr.appendChild(rFonts);

  const b = p.ownerDocument.createElementNS(W_NS, 'w:b');
  const bCs = p.ownerDocument.createElementNS(W_NS, 'w:bCs');
  rPr.appendChild(b);
  rPr.appendChild(bCs);

  const szVal = isEnglish ? '19' : '24';
  const sz = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz.setAttributeNS(W_NS, 'w:val', szVal);
  const szCs = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs.setAttributeNS(W_NS, 'w:val', szVal);
  rPr.appendChild(sz);
  rPr.appendChild(szCs);

  r.appendChild(rPr);
  const t = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t.textContent = fullText;
  r.appendChild(t);
  p.appendChild(r);
}

/**
 * 格式化 Section 14 标签单元格 (加粗、法定字号)
 */
export function formatSection14LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  const p = ps[0];
  for (let i = 1; i < ps.length; i++) {
    ps[i].parentNode?.removeChild(ps[i]);
  }
  Array.from(p.getElementsByTagNameNS(W_NS, 'r')).forEach(r => p.removeChild(r));

  let cleanLabel = labelText.trim();
  if (isEnglish) {
    cleanLabel = cleanLabel.replace(/：/g, ':');
    if (!cleanLabel.endsWith(':')) cleanLabel += ':';
  } else {
    cleanLabel = cleanLabel.replace(/:/g, '：');
    if (!cleanLabel.endsWith('：')) cleanLabel += '：';
  }

  const fullText = \`\${numberStr}  \${cleanLabel}\`;

  const r = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr.appendChild(rFonts);

  const b = p.ownerDocument.createElementNS(W_NS, 'w:b');
  const bCs = p.ownerDocument.createElementNS(W_NS, 'w:bCs');
  rPr.appendChild(b);
  rPr.appendChild(bCs);

  const szVal = isEnglish ? '19' : '24';
  const sz = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz.setAttributeNS(W_NS, 'w:val', szVal);
  const szCs = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs.setAttributeNS(W_NS, 'w:val', szVal);
  rPr.appendChild(sz);
  rPr.appendChild(szCs);

  r.appendChild(rPr);
  const t = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t.textContent = fullText;
  r.appendChild(t);
  p.appendChild(r);
}

/**
 * 从源文件中 1:1 物理提取所有毒理学终点 (自适应多行表格与叙述性通栏单单元格)
 */
export function extractToxicologicalEndpointsFromSource(srcEngine) {
  const s11Src = srcEngine?.records?.find(r => r.sectionNumber === 11);
  if (!s11Src) return [];

  // 1. 若源文件为标准多行表格 (行数 >= 4 且有独立端点行)
  if (s11Src.rows.length >= 4) {
    const endpoints = [];
    for (let rIdx = 3; rIdx < s11Src.rows.length; rIdx++) {
      const row = s11Src.rows[rIdx];
      const rawLbl = (row.cells[0]?.text || '').trim();
      const rawVal = (row.cells[row.cells.length - 1]?.text || '').trim();
      if (!rawLbl) continue;
      const cleanLbl = rawLbl.replace(/^\\s*11\\.\\d+\\s*/, '').replace(/[:：]$/, '');
      endpoints.push({
        cnLabel: cleanLbl,
        enLabel: mapToxicologyLabelToEnglish(cleanLbl),
        content: rawVal
      });
    }
    if (endpoints.length > 0) return endpoints;
  }

  // 2. 若源文件为叙述性单单元格大文本块
  const rawText = s11Src.rows.map(r => r.cells.map(c => c.text).join('\\n')).join('\\n');
  const endpointDefs = [
    { key: 'acute_oral', cnLabel: '急性毒性，经口', enLabel: 'Acute toxicity, oral', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:急性毒性[，, ]*经口|经口毒性)[：:]?/i },
    { key: 'acute_dermal', cnLabel: '急性毒性，经皮', enLabel: 'Acute toxicity, dermal', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:急性毒性[，, ]*经皮|经皮毒性)[：:]?/i },
    { key: 'acute_inhalation', cnLabel: '急性毒性，吸入', enLabel: 'Acute toxicity, inhalation', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:急性毒性[，, ]*吸入|吸入毒性)[：:]?/i },
    { key: 'skin_irritation', cnLabel: '主要皮肤刺激性', enLabel: 'Primary skin irritation', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:原发性皮肤刺激|主要皮肤刺激性?|皮肤刺激)[：:]?/i },
    { key: 'eye_irritation', cnLabel: '主要粘膜刺激性', enLabel: 'Primary mucosal irritation', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:原发性粘膜刺激|主要(?:粘膜|眼睛)刺激性?|眼睛刺激)[：:]?/i },
    { key: 'sensitization', cnLabel: '致敏性', enLabel: 'Respiratory or skin sensitization', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:致敏性|皮肤致敏性|呼吸道或皮肤致敏)[：:]?/i },
    { key: 'subacute', cnLabel: '亚急性、亚慢性和延迟毒性', enLabel: 'Subacute, subchronic and prolonged toxicity', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:亚急性[，,、]亚慢性和延迟毒性|亚急性毒性)[：:]?/i },
    { key: 'carcinogenicity', cnLabel: '致癌性', enLabel: 'Carcinogenicity', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?致癌性(?!\\s*[:：]\\s*无数据资料)[：:]?/i },
    { key: 'repro_fertility', cnLabel: '生殖毒性/生育力', enLabel: 'Reproductive toxicity - fertility', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?生殖毒性[\\/／]生育力[：:]?/i },
    { key: 'repro_terato', cnLabel: '生殖毒性/致畸形', enLabel: 'Reproductive toxicity - teratogenicity', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?生殖毒性[\\/／]致畸形[：:]?/i },
    { key: 'in_vitro_mutagenicity', cnLabel: '体外遗传毒性', enLabel: 'Germ cell mutagenicity (in vitro)', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?体外遗传毒性[：:]?/i },
    { key: 'in_vivo_mutagenicity', cnLabel: '体内基因毒性', enLabel: 'Germ cell mutagenicity (in vivo)', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?体内基因毒性[：:]?/i },
    { key: 'stot_single', cnLabel: 'STOT评估-一次性接触', enLabel: 'Specific target organ toxicity (single exposure)', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?STOT评估-一次性接触[：:]?/i },
    { key: 'stot_repeated', cnLabel: 'STOT评估-重复性接触', enLabel: 'Specific target organ toxicity (repeated exposure)', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?STOT评估-重复性接触[：:]?/i },
    { key: 'aspiration', cnLabel: '吸入危害', enLabel: 'Aspiration hazard', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?(?:吸入危害|吸入危险)[：:]?/i },
    { key: 'cmr', cnLabel: 'CMR评估', enLabel: 'CMR assessment', match: /(?:^|\\n)\\s*(?:11\\.\\d+\\s*)?CMR评估[：:]?/i }
  ];

  const occurrences = [];
  for (const def of endpointDefs) {
    const m = rawText.match(def.match);
    if (m) {
      occurrences.push({
        ...def,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  }
  occurrences.sort((a, b) => a.startIndex - b.startIndex);

  const endpoints = [];
  for (let i = 0; i < occurrences.length; i++) {
    const cur = occurrences[i];
    const nextStart = (i + 1 < occurrences.length) ? occurrences[i + 1].startIndex : rawText.length;
    let body = rawText.slice(cur.endIndex, nextStart).trim();
    endpoints.push({
      key: cur.key,
      cnLabel: cur.cnLabel,
      enLabel: cur.enLabel,
      content: body
    });
  }
  return endpoints;
}
`;

  // Insert before formatSection9LabelCell
  content = content.replace('export function formatSection9LabelCell(', newFunctions + '\nexport function formatSection9LabelCell(');
}

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.proposed.js', content, 'utf8');
console.log('Successfully generated full docx-engine.proposed.js');
